"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";
import { Loader2, Sparkles, X, Building2, Wand2, UploadCloud } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function BrandFormModal({ isOpen, onClose, editingBrand, categories }) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    primaryContact: "",
    websiteURL: "",
    logo: "",
    description: ""
  });
  const [selectedCategories, setSelectedCategories] = useState([]);

  // AI Content Generator & Enhancer States
  const [aiDescriptions, setAiDescriptions] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isEnhancingImage, setIsEnhancingImage] = useState(false);

  useEffect(() => {
    if (editingBrand) {
      setForm({
        name: editingBrand.name || "",
        primaryContact: editingBrand.primaryContact || "",
        websiteURL: editingBrand.websiteURL || "",
        logo: editingBrand.logo || "",
        description: editingBrand.description || ""
      });
      setSelectedCategories(editingBrand.categories?.map((c) => c._id) || []);
    } else {
      setForm({ name: "", primaryContact: "", websiteURL: "", logo: "", description: "" });
      setSelectedCategories([]);
      setAiDescriptions([]);
    }
  }, [editingBrand, isOpen]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNameChange = (value) => {
    updateField("name", value);
    const lowerVal = value.toLowerCase();

    const commonKeywords = ["bag", "pen", "pencil", "notebook", "register", "eraser", "color"];

    for (let keyword of commonKeywords) {
      if (lowerVal.includes(keyword)) {
        const matchedCat = categories.find(cat => cat.name.toLowerCase().includes(keyword));
        if (matchedCat && !selectedCategories.includes(matchedCat._id)) {
          setSelectedCategories(prev => [...prev, matchedCat._id]);
          toast.info(`Auto-linked category: ${matchedCat.name}`);
          break;
        }
      }
    }
  };

  const generateAIDescription = async () => {
    if (!form.name.trim()) return toast.error("Please fill Brand Name first to assist AI context.");
    
    setIsAiLoading(true);
    try {
      const res = await axiosClient.post("/api/admin/ai-generate", { productName: form.name });
      if (res.success && Array.isArray(res.options)) {
        setAiDescriptions(res.options);
        if (res.fallback) {
          toast.info("Offline fallback descriptions generated successfully.");
        } else {
          toast.success("AI Content variations generated successfully!");
        }
        return;
      }
    } catch (err) {
      console.warn("AI generation endpoint failed, using local generator:", err);
    } finally {
      setIsAiLoading(false);
    }

    const brandName = form.name.trim();
    const adjectives = ["Premium", "Leading", "Innovative", "Trusted", "Global", "Eco-friendly"];
    const descriptions = [
      `${brandName} is a ${adjectives[0].toLowerCase()} name in stationery, committed to delivering ergonomic design and superior reliability for students and professionals alike.`,
      `Discover premium quality with ${brandName}. Specialized in high-quality writing instruments, office supplies, and creative stationery essentials.`,
      `${brandName} is a ${adjectives[3].toLowerCase()} manufacturer, crafting premium school and workspace products engineered for durability, precision, and excellence.`
    ];
    setAiDescriptions(descriptions);
    toast.info("Offline fallback descriptions generated successfully.");
  };

  const handleImageEnhance = () => {
    if (!form.logo.trim()) return toast.error("Please add a raw image URL first to enhance.");
    
    setIsEnhancingImage(true);
    if (form.logo.includes("res.cloudinary.com")) {
      const enhancedUrl = form.logo.replace("/upload/", "/upload/e_bgremoval/e_enhance/e_shadow:40/");
      updateField("logo", enhancedUrl);
      toast.success("AI Image Layer Applied: Background removed with 3D drop shadow!");
    } else {
      toast.warning("URL manipulation targeted outside cloud storage nodes. Finish manually.");
    }
    setIsEnhancingImage(false);
  };

  const { mutate: saveBrand, isLoading: isSaving } = useMutation({
    mutationFn: async (payload) => {
      const url = editingBrand ? `/api/admin/brands?id=${editingBrand._id}` : "/api/admin/brands";
      const method = editingBrand ? "put" : "post";
      return axiosClient[method](url, payload);
    },
    onSuccess: (res) => {
      toast.success(res.message || "Database entry committed successfully!");
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || "Transaction matrix breakdown execution rejected.");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedCategories.length === 0) return toast.error("Select at least one category mapping layer.");
    if (!form.logo.trim()) return toast.error("Brand Logo image url asset is required.");

    saveBrand({
      ...form,
      categories: selectedCategories
    });
  };

  const toggleCategory = (id) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-[92vw] w-full sm:max-w-6xl bg-white/95 backdrop-blur-2xl text-gray-900 rounded-[28px] overflow-hidden border border-border-subtle shadow-2xl p-0 font-sans">
        <DialogHeader className="p-5 border-b border-border-subtle bg-primary-50/80 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-black tracking-tight text-gray-900 flex items-center gap-2.5">
            <Building2 className="text-primary-600 w-5 h-5" /> 
            {editingBrand ? "Edit Brand Profile" : "Add New Brand Profile"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row min-h-[65vh]">
          {/* Left Layout Pane (Standard Inputs) */}
          <div className="lg:w-[60%] overflow-y-auto p-6 space-y-6 max-h-[70vh] custom-scrollbar">
            <div className="rounded-[24px] border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-primary-700">Core Parameters</h3>
              
              <div className="space-y-2">
                <Label className="text-xs font-black text-gray-900">Brand / Manufacturer Name</Label>
                <Input 
                  value={form.name} 
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. DOMS, Classmate, Navneet" 
                  required
                  className="bg-white border border-border-subtle rounded-2xl h-11 text-xs font-semibold text-gray-900 placeholder-zinc-400 focus-visible:ring-1 focus-visible:ring-primary-400 focus-visible:border-primary-400 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-gray-900">Contact Phone</Label>
                  <Input 
                    value={form.primaryContact} 
                    onChange={(e) => updateField("primaryContact", e.target.value)} 
                    placeholder="e.g. +91 98765 43210" 
                    className="bg-white border border-border-subtle rounded-2xl h-11 text-xs font-semibold text-gray-900 placeholder-zinc-400 focus-visible:ring-1 focus-visible:ring-primary-400 focus-visible:border-primary-400 shadow-2xs" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black text-gray-900">Official Website URL</Label>
                  <Input 
                    type="url" 
                    value={form.websiteURL} 
                    onChange={(e) => updateField("websiteURL", e.target.value)} 
                    placeholder="https://domsindia.com" 
                    className="bg-white border border-border-subtle rounded-2xl h-11 text-xs font-semibold text-gray-900 placeholder-zinc-400 focus-visible:ring-1 focus-visible:ring-primary-400 focus-visible:border-primary-400 shadow-2xs" 
                  />
                </div>
              </div>
            </div>

            {/* Associated Categories Grid */}
            <div className="rounded-[24px] border border-border-subtle bg-bg-surface p-6 space-y-3 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-primary-700">Associated Category Chains</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto p-1 custom-scrollbar">
                {categories.map((cat) => {
                  const isChecked = selectedCategories.includes(cat._id);
                  return (
                    <button
                      type="button"
                      key={cat._id}
                      onClick={() => toggleCategory(cat._id)}
                      className={`rounded-2xl border p-3 text-left text-xs capitalize transition-all cursor-pointer ${
                        isChecked 
                          ? "border-primary-600 bg-primary-600 text-white font-black shadow-xs" 
                          : "border-border-subtle bg-white text-gray-900 hover:bg-primary-50 font-bold shadow-2xs"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{cat.name}</span>
                        {isChecked && <span>✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Layout Pane (Logo & AI Generator) */}
          <div className="lg:w-[40%] overflow-y-auto p-6 space-y-6 max-h-[70vh] bg-bg-surface border-l border-border-subtle custom-scrollbar">
            {/* Logo Identity Asset */}
            <div className="rounded-[24px] border border-border-subtle bg-white p-6 space-y-4 shadow-xs">
              <div className="flex justify-between items-center gap-2">
                <h3 className="text-xs uppercase tracking-wider text-primary-700 font-black">Logo Asset</h3>
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={handleImageEnhance} 
                  disabled={isEnhancingImage} 
                  className="bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 rounded-xl text-xs h-8 px-3 font-bold cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5 mr-1" /> AI Enhance
                </Button>
              </div>
              <Input 
                value={form.logo} 
                onChange={(e) => updateField("logo", e.target.value)} 
                placeholder="Paste brand logo image URL..." 
                className="bg-white border border-border-subtle rounded-2xl h-11 text-xs font-semibold text-gray-900 placeholder-zinc-400 focus-visible:ring-1 focus-visible:ring-primary-400 focus-visible:border-primary-400 shadow-2xs" 
              />
              
              {form.logo && (
                <div className="relative w-24 h-24 mx-auto rounded-2xl bg-white p-2 border border-border-subtle flex items-center justify-center shadow-xs">
                  <img src={form.logo} alt="Preview Asset" className="w-full h-full object-contain rounded-xl" />
                  <button 
                    type="button" 
                    onClick={() => updateField("logo", "")} 
                    className="absolute -top-1.5 -right-1.5 bg-white text-gray-900 rounded-full p-1 border border-border-subtle shadow-md hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* AI Text Content Engine */}
            <div className="rounded-[24px] border border-border-subtle bg-white p-6 space-y-3 shadow-xs">
              <div className="flex justify-between items-center gap-2">
                <h3 className="text-xs uppercase tracking-wider text-primary-700 font-black">Brand Summary</h3>
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={generateAIDescription} 
                  disabled={isAiLoading} 
                  className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs h-8 px-3 font-bold cursor-pointer"
                >
                  {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1 inline" />}
                  {isAiLoading ? "Generating..." : "Generate AI Copy"}
                </Button>
              </div>

              {aiDescriptions.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-dashed border-border-subtle rounded-2xl bg-primary-50/40 custom-scrollbar">
                  <p className="text-[10px] text-primary-800 font-bold mb-1">Click a generated summary below:</p>
                  {aiDescriptions.map((opt, i) => (
                    <div 
                      key={i} 
                      onClick={() => { updateField("description", opt); setAiDescriptions([]); }}
                      className="text-xs p-2.5 bg-white rounded-xl cursor-pointer hover:border-primary-400 border border-border-subtle transition-colors text-gray-900 font-medium leading-relaxed shadow-2xs"
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              <Textarea 
                value={form.description} 
                onChange={(e) => updateField("description", e.target.value)} 
                placeholder="Provide manufacturer background, profile summary..." 
                className="min-h-24 bg-white border border-border-subtle rounded-2xl text-xs font-medium text-gray-900 placeholder-zinc-400 focus-visible:border-primary-400 focus-visible:ring-1 focus-visible:ring-primary-400 resize-none leading-relaxed shadow-2xs" 
              />
            </div>

            {/* Core Mutation Trigger Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" disabled={isSaving} className="w-full rounded-2xl bg-primary-600 font-black text-xs h-11 text-white hover:bg-primary-700 shadow-md cursor-pointer btn-modern">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingBrand ? "Save profile changes" : "Publish brand profile"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="w-full rounded-2xl border border-border-subtle bg-white text-xs font-bold text-gray-900 h-11 hover:bg-primary-50 cursor-pointer shadow-2xs">Cancel</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}