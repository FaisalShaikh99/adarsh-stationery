"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";
import { Loader2, Sparkles, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function BrandFormModal({ isOpen, onClose, editingBrand, categories }) {
  const queryClient = useQueryClient();

  // 🌟 Clean Code: Saari local states ko ek single object state mein lock kar diya!
  const [form, setForm] = useState({
    name: "",
    primaryContact: "",
    websiteURL: "",
    logo: "",
    description: ""
  });
  const [selectedCategories, setSelectedCategories] = useState([]);

  // AI Content Generator & Enhancer States
  const [aiDescriptions, setAiDescriptions] = useState([]); // 3 Variations array
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isEnhancingImage, setIsEnhancingImage] = useState(false);

  // Sync Form State jab Edit/Create mode switch ho
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
      // Reset Form Matrix
      setForm({ name: "", primaryContact: "", websiteURL: "", logo: "", description: "" });
      setSelectedCategories([]);
      setAiDescriptions([]);
    }
  }, [editingBrand, isOpen]);

  // Helper to dynamically update form object fields
  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // ⚡ 1. Automatic Category Selector (Keyword Match Pattern)
  const handleNameChange = (value) => {
    updateField("name", value);
    const lowerVal = value.toLowerCase();

    // Dukan ke common business keywords mapping layers
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

  // 🤖 2. AI Description Generator Service (Gemini Variant Array Builder)
  const generateAIDescription = async () => {
    if (!form.name.trim()) return toast.error("Please fill Brand Name first to assist AI context.");
    
    setIsAiLoading(true);
    try {
      const res = await axiosClient.post("/api/admin/ai-generate", { productName: form.name });
      if (res.success) {
        setAiDescriptions(res.options); // Load 3 variations directly
        toast.success("AI Content variations generated successfully!");
      }
    } catch (err) {
      toast.error(err.message || "AI Engine Timeout");
    } finally {
      setIsAiLoading(false);
    }
  };

  // 🪄 3. AI Image Enhancer Service (Cloudinary URL Transformer Node)
  const handleImageEnhance = () => {
    if (!form.logo.trim()) return toast.error("Please add a raw image URL first to enhance.");
    
    setIsEnhancingImage(true);
    if (form.logo.includes("res.cloudinary.com")) {
      // Auto inject clean background removal with 3D drop shadow parameter mapping
      const enhancedUrl = form.logo.replace("/upload/", "/upload/e_bgremoval/e_enhance/e_shadow:40/");
      updateField("logo", enhancedUrl);
      toast.success("AI Image Layer Applied: Background removed with 3D drop shadow!");
    } else {
      toast.warning("URL manipulation targeted outside cloud storage nodes. Finish manually.");
    }
    setIsEnhancingImage(false);
  };

  // 📥 4. TanStack useMutation Data Safe Handler
  const { mutate: saveBrand, isLoading: isSaving } = useMutation({
    mutationFn: async (payload) => {
      const url = editingBrand ? `/api/admin/brands?id=${editingBrand._id}` : "/api/admin/brands";
      const method = editingBrand ? "put" : "post";
      return axiosClient[method](url, payload);
    },
    onSuccess: (res) => {
      toast.success(res.message || "Database entry committed successfully!");
      queryClient.invalidateQueries({ queryKey: ["brands"] }); // Real-time table automatic refresh!
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
      <DialogContent className="max-w-[92vw] w-full sm:max-w-6xl bg-slate-950 text-white rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl">
        <DialogHeader className="p-5 border-b border-slate-800 bg-slate-950 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold tracking-wide flex items-center gap-2">
            <Sparkles className="text-blue-400 w-4 h-4" /> {editingBrand ? "Modify Brand Identity" : "Register Brand Profile Node"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row min-h-[65vh]">
          {/* Left Layout Pane (Standard Inputs) */}
          <div className="lg:w-[60%] overflow-y-auto p-6 space-y-6 max-h-[70vh] custom-scrollbar">
            <div className="rounded-[28px] border border-slate-800 bg-slate-900/40 p-6 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Core Parameters</h3>
              
              <div className="space-y-2">
                <Label className="text-slate-300 font-semibold">Brand / Manufacturer Name</Label>
                <Input 
                  value={form.name} 
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. DOMS, Classmate" 
                  required
                  className="bg-slate-950 border-slate-800 rounded-3xl h-12 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 font-semibold">Contact Number</Label>
                  <Input value={form.primaryContact} onChange={(e) => updateField("primaryContact", e.target.value)} placeholder="e.g. +91 98765..." className="bg-slate-950 border-slate-800 rounded-3xl h-12 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 font-semibold">Official Website URL</Label>
                  <Input type="url" value={form.websiteURL} onChange={(e) => updateField("websiteURL", e.target.value)} placeholder="https://..." className="bg-slate-950 border-slate-800 rounded-3xl h-12 text-sm" />
                </div>
              </div>
            </div>

            {/* Bind Categories Grid */}
            <div className="rounded-[28px] border border-slate-800 bg-slate-900/40 p-6 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Associated Category Chains</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                {categories.map((cat) => {
                  const isChecked = selectedCategories.includes(cat._id);
                  return (
                    <button
                      type="button"
                      key={cat._id}
                      onClick={() => toggleCategory(cat._id)}
                      className={`rounded-2xl border p-3 text-left text-xs capitalize transition ${isChecked ? "border-blue-500 bg-blue-500/10 text-blue-300 font-medium" : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"}`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{cat.name}</span>
                        {isChecked && <span className="text-blue-400">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Layout Pane (AI Engine Modules) */}
          <div className="lg:w-[40%] overflow-y-auto p-6 space-y-6 max-h-[70vh] bg-slate-950 border-l border-slate-900 custom-scrollbar">
            {/* AI Image Node */}
            <div className="rounded-[28px] border border-slate-800 bg-slate-900/40 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Logo Identity Asset</h3>
                <Button type="button" size="sm" onClick={handleImageEnhance} disabled={isEnhancingImage} className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl text-[10px] h-7 px-3 font-semibold">
                  ✨ AI Auto-Enhance & Shadow
                </Button>
              </div>
              <Input value={form.logo} onChange={(e) => updateField("logo", e.target.value)} placeholder="Paste cloud image hosting link path URL" className="bg-slate-950 border-slate-800 rounded-3xl h-11 text-xs" />
              
              {form.logo && (
                <div className="relative w-20 h-20 mx-auto rounded-2xl bg-white p-2 border border-slate-800 flex items-center justify-center shadow-inner">
                  <img src={form.logo} alt="Preview Asset" className="w-full h-full object-contain" />
                  <button type="button" onClick={() => updateField("logo", "")} className="absolute -top-1 -right-1 bg-slate-950 text-white rounded-full p-1 border border-slate-800"><X className="w-3 h-3" /></button>
                </div>
              )}
            </div>

            {/* AI Text Content Engine */}
            <div className="rounded-[28px] border border-slate-800 bg-slate-900/40 p-6 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Summary Copywriting</h3>
                <Button type="button" size="sm" onClick={generateAIDescription} disabled={isAiLoading} variant="outline" className="border-blue-500 text-blue-400 rounded-2xl text-[10px] h-7 px-3 font-semibold hover:bg-blue-950/30 transition-all">
                  {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "🤖 Ask AI to Write"}
                </Button>
              </div>

              {aiDescriptions.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 border border-dashed border-slate-800 rounded-2xl bg-slate-950 custom-scrollbar">
                  <p className="text-[10px] text-zinc-500 font-medium mb-1">Select a configuration variant below:</p>
                  {aiDescriptions.map((opt, i) => (
                    <div 
                      key={i} 
                      onClick={() => { updateField("description", opt); setAiDescriptions([]); }}
                      className="text-[11px] p-2 bg-slate-900 rounded-xl cursor-pointer hover:bg-slate-800 border border-slate-800 transition-colors text-slate-300 leading-relaxed"
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Provide factory profiles or manufacture summary specs..." className="min-h-24 bg-slate-950 border-slate-800 rounded-2xl text-xs resize-none leading-relaxed" />
            </div>

            {/* Core Mutation Trigger Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" disabled={isSaving} className="w-full rounded-3xl bg-blue-600 font-semibold text-sm h-12 hover:bg-blue-700 shadow-lg shadow-blue-950/20 transition-all">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingBrand ? "Save Changes" : "Register Brand Flag"}
              </Button>
              <Button type="button" variant="ghost" onClick={onClose} className="w-full rounded-3xl border border-slate-800 bg-slate-950 text-xs text-slate-400 h-11 hover:bg-slate-900 transition-colors">Cancel Sequence</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}