"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, Edit2, Sparkles, UploadCloud } from "lucide-react";

// Shadcn UI Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Levenshtein Distance Algorithm (Spelling checker)
const getLevenshteinDistance = (a, b) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const categorySchema = z.object({
  name: z
    .string()
    .min(1, { message: "Category name is required." })
    .trim()
    .min(2, { message: "Category name must be at least 2 characters long." })
    .max(50, { message: "Category name cannot exceed 50 characters." }),
  imageUrl: z
    .string()
    .url({ message: "Invalid image URL format." })
    .or(z.literal(""))
    .optional()
});

export default function CategoryManagementPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [spellingSuggestion, setSpellingSuggestion] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  
  const [aiOptions, setAiOptions] = useState(null);
  const [aiLoading1, setAiLoading1] = useState(false);
  const [aiLoading2, setAiLoading2] = useState(false);
  const [uploadMode, setUploadMode] = useState("ai");

  const [editingCategory, setEditingCategory] = useState(null); // null = add mode, object = edit mode

  // React Hook Form
  const { register, handleSubmit: handleFormSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(categorySchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      imageUrl: ""
    }
  });

  const selectedImage = watch("imageUrl");
  const categoryName = watch("name");

  // React Query Fetch categories
  const { 
    data: categoriesData, 
    isLoading: categoriesLoading, 
    refetch: refetchCategories 
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/categories");
      return res.data?.data || [];
    }
  });

  const categories = categoriesData || [];

  // Toggle status mutation
  const statusToggleMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.patch(`/api/admin/categories?id=${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Operation failed.");
    }
  });

  const handleStatusToggle = (id) => {
    statusToggleMutation.mutate(id);
  };

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.delete(`/api/admin/categories?id=${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Deletion sequence rejected.");
    }
  });

  const triggerDeleteCheck = (id) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const executeDeleteNode = () => {
    if (!pendingDeleteId) return;
    setDeleteDialogOpen(false);
    deleteMutation.mutate(pendingDeleteId, {
      onSettled: () => {
        setPendingDeleteId(null);
      }
    });
  };

  // Form Submit Mutation
  const categoryFormMutation = useMutation({
    mutationFn: async (data) => {
      const targetUrl = editingCategory 
        ? `/api/admin/categories?id=${editingCategory._id}` 
        : "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";
      
      const response = await axios({
        url: targetUrl,
        method,
        data: {
          name: data.name,
          imageUrl: data.imageUrl
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      closeAndResetModal();
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Database validation failed.");
    }
  });

  const onSubmit = (data) => {
    categoryFormMutation.mutate(data);
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setAiOptions(null);
    setUploadMode("ai");
    reset({
      name: "",
      imageUrl: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setAiOptions({ optionOne: cat.image, optionTwo: cat.image });
    setUploadMode(cat.image ? "manual" : "ai");
    reset({
      name: cat.name,
      imageUrl: cat.image
    });
    setIsModalOpen(true);
  };

  const closeAndResetModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setAiOptions(null);
    setUploadMode("ai");
    reset({
      name: "",
      imageUrl: ""
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setValue("imageUrl", imageUrl);
    }
  };

  // ==================== 🎨 INDEPENDENT SPLIT AI GENERATOR ENGINE ====================

  const generateAiIcons = () => {
    const nameVal = categoryName?.trim();
    if (!nameVal) {
      toast.error("Please fill the name input before invoking AI core.");
      return;
    }
    
    setAiLoading1(true);
    setAiLoading2(true);
    setUploadMode("ai");
    
    const cleanTerm = nameVal.toLowerCase().replace(/\s+/g, "-");
    const promptCore = `cute clean vector flat illustration of ${cleanTerm} item, minimalist stationery design concept, vibrant friendly colors, isolated on solid pure white background, digital 2d art style, smooth clipart asset`;
    
    const seed1 = Math.floor(Math.random() * 2000) + 1;
    const seed2 = Math.floor(Math.random() * 2000) + 2500;

    const optionOne = `https://image.pollinations.ai/p/${encodeURIComponent(promptCore + " primary colors")}?width=300&height=300&seed=${seed1}&nologo=true`;
    const optionTwo = `https://image.pollinations.ai/p/${encodeURIComponent(promptCore + " pastel colors")}?width=300&height=300&seed=${seed2}&nologo=true`;

    setAiOptions({ optionOne, optionTwo });
    setValue("imageUrl", optionOne);

    setTimeout(() => setAiLoading1(false), 2000);
    setTimeout(() => setAiLoading2(false), 3500);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSpellingSuggestion(null);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const directMatchExists = categories.some(cat => 
      cat.name.toLowerCase().includes(lowerQuery)
    );

    if (directMatchExists) {
      setSpellingSuggestion(null);
      return;
    }

    let bestMatch = null;
    let minDistance = 999;

    categories.forEach((cat) => {
      const catName = cat.name.toLowerCase();
      const words = catName.split(/\s+/);
      let closestWordDistance = 999;

      words.forEach((word) => {
        const wordDist = getLevenshteinDistance(lowerQuery, word);
        if (wordDist < closestWordDistance) closestWordDistance = wordDist;
      });

      const globalDistance = getLevenshteinDistance(lowerQuery, catName);
      const finalDistance = Math.min(closestWordDistance, globalDistance);

      if (finalDistance < minDistance && finalDistance <= 2) { 
        minDistance = finalDistance;
        bestMatch = cat.name;
      }
    });

    setSpellingSuggestion(bestMatch);
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen bg-[#09090b] text-white p-6 space-y-6 font-sans">
      
      {/* Top Header Grid Section */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Category Management</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Category counter :{" "}
            <span className="text-blue-400 font-mono font-bold text-base tracking-widest">
              {String(categories.length).padStart(3, "0")}
            </span>
          </p>
        </div>
        
        <Button
          onClick={openCreateModal}
          className="bg-white text-black font-semibold hover:bg-zinc-200 rounded-xl px-4 py-2 text-sm shadow-md"
        >
          + Add Category
        </Button>
      </div>

      {/* Workspace Area Table Arena */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
        
        {/* Wireframe Center Input Search Box */}
        <div className="flex flex-col items-center justify-center w-full space-y-2">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search Category with AI search features..."
              className="w-full bg-[#141416] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-center text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
            />
          </div>

          {/* ✨ Smart Did You Mean Ribbon Suggestion Box */}
          {spellingSuggestion && (
            <div className="text-xs text-zinc-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
              Did you mean:{" "}
              <button
                type="button"
                onClick={() => {
                  handleSearchChange(spellingSuggestion);
                  setSpellingSuggestion(null);
                }}
                className="text-blue-400 font-semibold hover:underline capitalize"
              >
                {spellingSuggestion}
              </button>
              {" "}?
            </div>
          )}
        </div>

        {/* 📊 CORE DATA TABLE NODE LAYER */}
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-800 bg-zinc-900/80 hover:bg-transparent">
                <TableHead className="w-16 text-center text-zinc-400 font-semibold">no</TableHead>
                <TableHead className="w-24 text-zinc-400 font-semibold">Icon</TableHead>
                <TableHead className="text-zinc-400 font-semibold">Category Name</TableHead>
                <TableHead className="text-zinc-400 font-semibold">Products Count</TableHead>
                <TableHead className="text-zinc-400 font-semibold">Status</TableHead>
                <TableHead className="text-zinc-400 font-semibold">Created At</TableHead>
                <TableHead className="text-center w-36 text-zinc-400 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-zinc-300">
              {categoriesLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      <span>Loading warehouse catalog indexes...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-zinc-500">
                    No categorical records found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category, index) => (
                  <TableRow 
                    key={category._id} 
                    className={`border-b border-zinc-800 hover:bg-zinc-900/40 transition-colors ${!category.isActive ? "opacity-60 bg-zinc-950/20" : ""}`}
                  >
                    <TableCell className="text-center font-medium text-zinc-500">{index + 1}</TableCell>
                    <TableCell>
                      <img 
                        src={category.image} 
                        alt="" 
                        className="w-10 h-10 rounded-xl object-cover border border-zinc-800 bg-white" 
                        referrerPolicy="no-referrer"
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-white capitalize">{category.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${category.totalProducts > 0 ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-zinc-800 text-zinc-500"}`}>
                        {String(category.totalProducts).padStart(2, '0')} Products
                      </span>
                    </TableCell>
                    <TableCell>
                      {((statusToggleMutation.isPending && statusToggleMutation.variables === category._id) || (deleteMutation.isPending && deleteMutation.variables === category._id)) ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      ) : (
                        <div className="flex items-center gap-3">
                          <Switch 
                            checked={category.isActive}
                            onCheckedChange={() => handleStatusToggle(category._id)}
                            className="data-[state=checked]:bg-emerald-600"
                          />
                          <span className={`text-xs font-bold uppercase min-w-[50px] ${category.isActive ? "text-emerald-400" : "text-zinc-500"}`}>
                            {category.isActive ? "Active" : "Disabled"}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-400 font-mono">
                      {new Date(category.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-4">
                        <button 
                          onClick={() => openEditModal(category)}
                          className="text-zinc-400 hover:text-white transition-colors p-1"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => triggerDeleteCheck(category._id)}
                          className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 🔲 COMPOSITE MULTI-OPERATIONAL DIALOG BOX FORMS */}
      <Dialog open={isModalOpen} onOpenChange={(val) => !val && closeAndResetModal()}>
        <DialogContent className="w-full max-w-md border border-zinc-800 bg-zinc-900 p-6 text-white rounded-2xl shadow-2xl">
          <DialogHeader className="border-b border-zinc-800 pb-4 mb-4">
            <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-400" /> {editingCategory ? "Edit Category Details" : "New Category"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="categoryName" className="text-zinc-400 text-xs font-semibold tracking-wider uppercase">Category Name</Label>
              <div className="flex gap-2">
                <Input
                  id="categoryName"
                  type="text"
                  placeholder="Enter Category name"
                  {...register("name")}
                  className="bg-zinc-950 border-zinc-800 text-white rounded-xl focus-visible:ring-blue-500"
                />
                <Button
                  type="button"
                  onClick={generateAiIcons}
                  className="bg-zinc-800 hover:bg-zinc-700 text-blue-400 font-medium rounded-xl shrink-0"
                >
                  Generate Icon
                </Button>
              </div>
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            {aiOptions && uploadMode === "ai" && (
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs font-semibold tracking-wider uppercase">Choose Brand Icon Options</Label>
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Option Card 1 */}
                  <div 
                    onClick={() => !aiLoading1 && setValue("imageUrl", aiOptions.optionOne)}
                    className={`relative cursor-pointer aspect-square rounded-xl overflow-hidden border flex items-center justify-center p-2 transition-all bg-white ${
                      selectedImage === aiOptions.optionOne ? "border-blue-500 ring-2 ring-blue-500/50" : "border-zinc-800"
                    }`}
                  >
                    {aiLoading1 ? (
                      <div className="absolute inset-0 bg-[#141416] flex items-center justify-center rounded-lg w-full h-full">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      </div>
                    ) : (
                      <img src={aiOptions.optionOne} alt="Option 1" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    )}
                  </div>

                  {/* Option Card 2 */}
                  <div 
                    onClick={() => !aiLoading2 && setValue("imageUrl", aiOptions.optionTwo)}
                    className={`relative cursor-pointer aspect-square rounded-xl overflow-hidden border flex items-center justify-center p-2 transition-all bg-white ${
                      selectedImage === aiOptions.optionTwo ? "border-blue-500 ring-2 ring-blue-500/50" : "border-zinc-800"
                    }`}
                  >
                    {aiLoading2 ? (
                      <div className="absolute inset-0 bg-[#141416] flex items-center justify-center rounded-lg w-full h-full">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      </div>
                    ) : (
                      <img src={aiOptions.optionTwo} alt="Option 2" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    )}
                  </div>

                </div>
              </div>
            )}

            {uploadMode === "manual" && (
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs font-semibold tracking-wider uppercase">Local Device Storage Uploader</Label>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div 
                  onClick={() => fileInputRef.current.click()}
                  className="border border-dashed border-zinc-700 rounded-xl p-6 bg-zinc-950/40 text-center flex flex-col items-center justify-center gap-2 hover:bg-zinc-950/80 transition-all cursor-pointer"
                >
                  <UploadCloud className="h-6 w-6 text-zinc-500" />
                  <span className="text-xs text-zinc-400">Click to load physical icon asset</span>
                </div>
              </div>
            )}

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setUploadMode(uploadMode === "ai" ? "manual" : "ai")}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline"
              >
                {uploadMode === "ai" ? "Or upload manually from browser file system" : "Back to AI illustration options panel"}
              </button>
            </div>

            <Button 
              type="submit" 
              disabled={categoryFormMutation.isPending} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 shadow-lg shadow-blue-600/10"
            >
              {categoryFormMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transmitting Document...</>
              ) : editingCategory ? (
                "Save Operational Changes"
              ) : (
                "Add Category"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* 🛡️ STRICT PRODUCT BLOCK GUARD SHIELD */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Confirm Asset Removal</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you absolutely sure you want to drop this category item? System rules prevent deletion if live stationery items are linked to this record node.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeDeleteNode} 
              className="rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-white"
            >
              Destroy Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}