"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Building2, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

export default function BrandFormModal({
  isOpen,
  onClose,
  editingBrand,
  onSuccess,
  categories = []
}) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    logoUrl: "",
    website: "",
    primaryContact: "",
    supportEmail: "",
    description: "",
    isActive: true,
  });

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiDescriptions, setAiDescriptions] = useState([]);

  useEffect(() => {
    if (editingBrand) {
      setForm({
        name: editingBrand.name || "",
        slug: editingBrand.slug || "",
        logoUrl: editingBrand.logoUrl || "",
        website: editingBrand.website || "",
        primaryContact: editingBrand.primaryContact || "",
        supportEmail: editingBrand.supportEmail || "",
        description: editingBrand.description || "",
        isActive: editingBrand.isActive !== undefined ? editingBrand.isActive : true,
      });
      setSelectedCategories(
        editingBrand.categories ? editingBrand.categories.map(c => typeof c === "object" ? c._id : c) : []
      );
    } else {
      setForm({
        name: "",
        slug: "",
        logoUrl: "",
        website: "",
        primaryContact: "",
        supportEmail: "",
        description: "",
        isActive: true,
      });
      setSelectedCategories([]);
    }
    setAiDescriptions([]);
  }, [editingBrand, isOpen]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNameChange = (val) => {
    const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    setForm(prev => ({
      ...prev,
      name: val,
      slug: editingBrand ? prev.slug : generatedSlug
    }));
  };

  const generateAiDescription = async () => {
    if (!form.name.trim()) {
      return toast.error("Please enter a brand name first.");
    }
    setIsGeneratingAi(true);
    try {
      const res = await axios.post("/api/admin/brands/ai-suggest", { brandName: form.name });
      if (res.data?.success && res.data?.data?.suggestions) {
        setAiDescriptions(res.data.data.suggestions);
        toast.success("AI generated brand profile descriptions!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate AI brand overview.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Brand name is required.");

    setIsSaving(true);
    const payload = {
      ...form,
      categories: selectedCategories,
    };

    try {
      if (editingBrand) {
        await axios.patch(`/api/admin/brands/${editingBrand._id}`, payload);
        toast.success("Brand profile updated successfully!");
      } else {
        await axios.post("/api/admin/brands", payload);
        toast.success("New brand profile published!");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save brand details.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCategory = (id) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-[95vw] w-full sm:max-w-4xl lg:max-w-6xl max-h-[92vh] overflow-y-auto bg-white/95 backdrop-blur-2xl text-gray-900 rounded-2xl sm:rounded-[28px] border border-border-subtle shadow-2xl p-0 font-sans custom-scrollbar">
        <DialogHeader className="p-4 sm:p-5 border-b border-border-subtle bg-primary-50/80 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-gray-900 flex items-center gap-2 sm:gap-2.5">
            <Building2 className="text-primary-600 w-4.5 h-4.5 sm:w-5 sm:h-5" /> 
            {editingBrand ? "Edit Brand Profile" : "Add New Brand Profile"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row min-h-0">
          {/* Left Layout Pane (Standard Inputs) */}
          <div className="lg:w-[60%] overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[65vh] lg:max-h-[70vh] custom-scrollbar">
            <div className="rounded-2xl sm:rounded-[24px] border border-border-subtle bg-bg-surface p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-xs">
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
                    placeholder="+91 98765 43210" 
                    className="bg-white border border-border-subtle rounded-2xl h-11 text-xs font-semibold text-gray-900 placeholder-zinc-400 focus-visible:ring-1 focus-visible:ring-primary-400 font-mono shadow-2xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-gray-900">Support Email</Label>
                  <Input 
                    value={form.supportEmail} 
                    onChange={(e) => updateField("supportEmail", e.target.value)}
                    placeholder="support@doms.com" 
                    type="email"
                    className="bg-white border border-border-subtle rounded-2xl h-11 text-xs font-semibold text-gray-900 placeholder-zinc-400 focus-visible:ring-1 focus-visible:ring-primary-400 font-mono shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-gray-900">Brand Logo URL</Label>
                  <Input 
                    value={form.logoUrl} 
                    onChange={(e) => updateField("logoUrl", e.target.value)}
                    placeholder="https://images.com/logo.png" 
                    className="bg-white border border-border-subtle rounded-2xl h-11 text-xs font-semibold text-gray-900 placeholder-zinc-400 focus-visible:ring-1 focus-visible:ring-primary-400 font-mono shadow-2xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-gray-900">Official Website URL</Label>
                  <Input 
                    value={form.website} 
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="https://domsindia.com" 
                    className="bg-white border border-border-subtle rounded-2xl h-11 text-xs font-semibold text-gray-900 placeholder-zinc-400 focus-visible:ring-1 focus-visible:ring-primary-400 font-mono shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Category Association Grid */}
            <div className="rounded-[24px] border border-border-subtle bg-bg-surface p-6 space-y-3 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-primary-700">Associated Categories ({selectedCategories.length})</h3>
              <p className="text-[11px] text-zinc-500 font-medium">Link this brand to relevant store catalog categories:</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 max-h-48 overflow-y-auto custom-scrollbar">
                {categories.map((cat) => {
                  const isChecked = selectedCategories.includes(cat._id);
                  return (
                    <div 
                      key={cat._id} 
                      onClick={() => toggleCategory(cat._id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked 
                          ? "bg-primary-50 border-primary-300 text-primary-900 font-black shadow-2xs" 
                          : "bg-white border-border-subtle text-zinc-700 font-bold hover:bg-primary-50/40"
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => {}} 
                        className="w-4 h-4 rounded border-border-subtle text-primary-600 focus:ring-primary-400 cursor-pointer accent-primary-600" 
                      />
                      <span className="truncate">{cat.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Layout Pane (AI Bio Generator & Final Actions) */}
          <div className="lg:w-[40%] bg-primary-50/50 border-l border-border-subtle p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-primary-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" /> AI Bio Synthesizer
                </span>
                <Button 
                  type="button" 
                  onClick={generateAiDescription} 
                  disabled={isGeneratingAi}
                  className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl h-8 text-[11px] font-black px-3 cursor-pointer shadow-xs btn-modern"
                >
                  {isGeneratingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "✨ Auto-Suggest AI Overview"}
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
            <div className="flex flex-col gap-2.5 pt-2">
              <Button type="submit" disabled={isSaving} className="w-full btn-pill-gradient h-11 text-xs font-black cursor-pointer">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingBrand ? "Save profile changes" : "Publish brand profile"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="w-full rounded-full border border-border-subtle bg-white text-xs font-bold text-gray-900 h-11 hover:bg-primary-50 cursor-pointer shadow-2xs">Cancel</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}