"use client";

import { useState, useEffect } from "react";
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

export default function CategoryManagementPage() {
  // 1. Database Data & Loading States
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // 2. Component Layout Visibility Control Toggles
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  
  // 3. Independent Row and Submit Trackers
  const [actionId, setActionId] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // 4. Split AI Loading State Handlers 🌟
  const [aiLoading1, setAiLoading1] = useState(false);
  const [aiLoading2, setAiLoading2] = useState(false);

  // 5. Operation Flow Type Flags (Edit vs Create Routing Node)
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  // 6. Native Form Fields Structure
  const [categoryName, setCategoryName] = useState("");
  const [aiOptions, setAiOptions] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [uploadMode, setUploadMode] = useState("ai"); // 'ai' or 'manual'

  // ==================== 📡 BACKEND SERVER API INTERACTIONS ====================

  // Fetch Category Log Matrix (GET)
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (res.ok && data.success) {
        setCategories(data.data);
      } else {
        toast.error(data.message || "Failed to load categories catalog.");
      }
    } catch {
      toast.error("Network communication failure with server matrix.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Live Binary Status Switch Handler (PATCH)
  const handleStatusToggle = async (id) => {
    try {
      setActionId(id);
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: "PATCH" });
      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(result.message);
        fetchCategories();
      } else {
        toast.error(result.message || "Operation failed.");
      }
    } catch {
      toast.error("Internal state transmission failure.");
    } finally {
      setActionId("");
    }
  };

  // Safe Removal Shield (DELETE)
  const triggerDeleteCheck = (id) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const executeDeleteNode = async () => {
    if (!pendingDeleteId) return;
    try {
      setActionId(pendingDeleteId);
      setDeleteDialogOpen(false);
      
      const res = await fetch(`/api/admin/categories?id=${pendingDeleteId}`, { method: "DELETE" });
      const result = await res.json();
      
      if (res.ok && result.success) {
        toast.success(result.message);
        fetchCategories();
      } else {
        toast.error(result.message || "Deletion sequence rejected.");
      }
    } catch {
      toast.error("Server synchronization timed out.");
    } finally {
      setActionId("");
      setPendingDeleteId(null);
    }
  };

  // Master Data Submission router (PUT / POST Bifurcation Framework) 🚀
  const handleMasterSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setFormLoading(true);
    const targetUrl = isEditing ? `/api/admin/categories?id=${editingCategoryId}` : "/api/admin/categories";
    const targetMethod = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(targetUrl, {
        method: targetMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryName,
          imageUrl: selectedImage,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(result.message);
        closeAndResetModal();
        fetchCategories();
      } else {
        toast.error(result.message || "Database validation failed.");
      }
    } catch {
      toast.error("Server submission failure.");
    } finally {
      setFormLoading(false);
    }
  };

  // ==================== 🎨 INDEPENDENT SPLIT AI GENERATOR ENGINE ====================

  const generateAiIcons = () => {
    if (!categoryName || categoryName.trim() === "") {
      toast.error("Please fill the name input before invoking AI core.");
      return;
    }
    
    // Dynamic Split Load Allocation Started
    setAiLoading1(true);
    setAiLoading2(true);
    setUploadMode("ai");
    
    // Spaces ko single string block me normalize kiya
    const cleanTerm = categoryName.trim().toLowerCase().replace(/\s+/g, "-");
    const promptCore = `cute clean vector flat illustration of ${cleanTerm} item, minimalist stationery design concept, vibrant friendly colors, isolated on solid pure white background, digital 2d art style, smooth clipart asset`;
    
    // Unique Independent Seeds for Distinct Graphics
    const seed1 = Math.floor(Math.random() * 2000) + 1;
    const seed2 = Math.floor(Math.random() * 2000) + 2500;

    const optionOne = `https://image.pollinations.ai/p/${encodeURIComponent(promptCore + " primary colors")}?width=300&height=300&seed=${seed1}&nologo=true`;
    const optionTwo = `https://image.pollinations.ai/p/${encodeURIComponent(promptCore + " pastel colors")}?width=300&height=300&seed=${seed2}&nologo=true`;

    setAiOptions({ optionOne, optionTwo });
    setSelectedImage(optionOne); // Default Selector focus

    // Option 1 Rendering Offset Release Timeline
    setTimeout(() => {
      setAiLoading1(false);
    }, 2000);

    // Option 2 Parallel Scheduling Bridge (Bypasses caching locks)
    setTimeout(() => {
      setAiLoading2(false);
    }, 3500);
  };

  // Active Update State Bridge Hook
  const triggerEditFlow = (category) => {
    setIsEditing(true);
    setEditingCategoryId(category._id);
    setCategoryName(category.name);
    setSelectedImage(category.image);
    setAiOptions({ optionOne: category.image, optionTwo: category.image });
    setIsModalOpen(true);
  };

  const closeAndResetModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingCategoryId(null);
    setCategoryName("");
    setAiOptions(null);
    setSelectedImage("");
    setUploadMode("ai");
    setAiLoading1(false);
    setAiLoading2(false);
  };

  // Data Filtering Node Configurations
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 1. Naya State Suggestion Track Karne Ke Liye (Top Par Add Karein)
  const [spellingSuggestion, setSpellingSuggestion] = useState(null);

  // 2. Levenshtein Distance Algorithm (Spelling check karne ka engine)
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

// 3. Search input change hone par spelling check karne wala framework
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSpellingSuggestion(null);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    
    // 1. Agar direct match ho raha hai, toh suggestion chhupao
    const directMatchExists = categories.some(cat => 
      cat.name.toLowerCase().includes(lowerQuery)
    );
    if (directMatchExists) {
      setSpellingSuggestion(null);
      return;
    }

    let bestMatch = null;
    let minDistance = 999; // Isko bada rakhenge taaki door ke words bhi map ho sakein

    categories.forEach((cat) => {
      const catName = cat.name.toLowerCase();
      
      // Feature A: Substring/Words Split Matching (For 'beg' -> 'bag pack')
      const words = catName.split(/\s+/); // ['bag', 'pack']
      let closestWordDistance = 999;

      words.forEach((word) => {
        const wordDist = getLevenshteinDistance(lowerQuery, word);
        if (wordDist < closestWordDistance) {
          closestWordDistance = wordDist;
        }
      });

      // Feature B: Global string distance checking
      const globalDistance = getLevenshteinDistance(lowerQuery, catName);

      // Dono distances me se jo sabse chhota (best) ho use lein
      const finalDistance = Math.min(closestWordDistance, globalDistance);

      // Baseline threshold check: Agar input chhota hai aur match mil raha hai
      if (finalDistance < minDistance && finalDistance <= 2) { 
        minDistance = finalDistance;
        bestMatch = cat.name;
      }
    });

    setSpellingSuggestion(bestMatch);
  };

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
          onClick={() => { setIsEditing(false); setIsModalOpen(true); }}
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
              onChange={(e) => handleSearchChange(e.target.value)} // 🔥 Trigger fuzzy checker
              placeholder="Search Category with AI search features..."
              className="w-full bg-[#141416] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-center text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
            />
          </div>

          {/* ✨ Smart Did You Mean Ribbon Suggestion Box */}
          {spellingSuggestion && (
            <div className="text-xs text-zinc-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg animate-fadeIn">
              Did you mean:{" "}
              <button
                type="button"
                onClick={() => {
                  setSearchQuery(spellingSuggestion);
                  setSpellingSuggestion(null); // Click karte hi suggestion off!
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
              {loading ? (
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
                      {actionId === category._id ? (
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
                          onClick={() => triggerEditFlow(category)}
                          className="text-zinc-400 hover:text-white transition-colors p-1"
                          title="Modify Asset Document"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => triggerDeleteCheck(category._id)}
                          className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                          title="Purge Document Node"
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

      {/* 🔲 COMPOSITE MULTI-OPERATIONAL DIALOG BOX FORMS (SHADCN OVERLAY NODE) */}
      <Dialog open={isModalOpen} onOpenChange={closeAndResetModal}>
        <DialogContent className="w-full max-w-md border border-zinc-800 bg-zinc-900 p-6 text-white rounded-2xl shadow-2xl">
          <DialogHeader className="border-b border-zinc-800 pb-4 mb-4">
            <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-400" /> {isEditing ? "Edit Category Details" : "New Category"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleMasterSubmit} className="space-y-5">
            {/* Context Input Name Block */}
            <div className="space-y-2">
              <Label htmlFor="catName" className="text-zinc-400 text-xs font-semibold tracking-wider uppercase">Category Name</Label>
              <div className="flex gap-2">
                <Input
                  id="catName"
                  type="text"
                  required
                  placeholder="Enter Category name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
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
            </div>

            {/* Split UI Card Render Selector Logic Panels */}
            {aiOptions && uploadMode === "ai" && (
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs font-semibold tracking-wider uppercase">Choose Brand Icon Options</Label>
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* --- CONTAINER CARD 1 --- */}
                  <div 
                    onClick={() => !aiLoading1 && setSelectedImage(aiOptions.optionOne)}
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

                  {/* --- CONTAINER CARD 2 --- */}
                  <div 
                    onClick={() => !aiLoading2 && setSelectedImage(aiOptions.optionTwo)}
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

            {/* Manual Fallback Device Node */}
            {uploadMode === "manual" && (
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs font-semibold tracking-wider uppercase">Local Storage File Uploader</Label>
                <div className="border border-dashed border-zinc-700 rounded-xl p-6 bg-zinc-950/40 text-center flex flex-col items-center justify-center gap-2 hover:bg-zinc-950/80 transition-all cursor-pointer">
                  <UploadCloud className="h-6 w-6 text-zinc-500" />
                  <span className="text-xs text-zinc-400">Click to pick physical layout icon asset</span>
                </div>
              </div>
            )}

            {/* Inline Routing Controller Toggle Option Text */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setUploadMode(uploadMode === "ai" ? "manual" : "ai")}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline"
              >
                {uploadMode === "ai" ? "Or upload manually from browser file system" : "Back to AI illustration options panel"}
              </button>
            </div>

            {/* Submit Injector Trigger Button */}
            <Button 
              type="submit" 
              disabled={formLoading} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 shadow-lg shadow-blue-600/10"
            >
              {formLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transmitting Document...</>
              ) : isEditing ? (
                "Save Operational Changes"
              ) : (
                "Add Category"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* 🛡️ STRICT PRODUCT BLOCK GUARD SHIELD (ALERT DIALOG CONTEXT BOX) */}
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