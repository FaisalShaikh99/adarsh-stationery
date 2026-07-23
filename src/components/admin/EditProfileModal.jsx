"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, UploadCloud, User, Mail, Shield, X, Pencil, Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminProfileSchema } from "@/schemas/profile.schema";

export default function EditProfileModal({ isOpen, onClose, onSuccess }) {
  const { data: session, update } = useSession();
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(adminProfileSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      image: "",
    },
  });

  const watchImage = watch("image");
  const watchName = watch("name");

  useEffect(() => {
    if (session?.user && isOpen) {
      reset({
        name: session.user.name || "",
        image: session.user.image || "",
      });
    }
  }, [session, isOpen, reset]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    // Limit to 5MB max size for safety
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setValue("image", reader.result, { shouldValidate: true });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    setValue("image", "", { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await axios.patch("/api/admin/profile", {
        name: data.name,
        image: data.image || "",
      });

      if (response.data?.success) {
        toast.success(response.data.message || "Profile updated successfully!");
        
        // Trigger NextAuth session update to re-fetch latest DB data
        await update();
        
        onSuccess?.();
        onClose();
      } else {
        toast.error(response.data?.message || "Failed to update profile.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "An error occurred while saving profile."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="w-full max-w-md border border-zinc-800 bg-zinc-950 p-6 text-white rounded-3xl shadow-2xl">
        <DialogHeader className="border-b border-zinc-800/80 pb-4 mb-2">
          <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Pencil className="h-5 w-5 text-blue-400" /> Edit Admin Profile
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 mt-1">
            Update your personal name and profile picture for the admin workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          {/* Avatar Upload Area */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative group">
              {watchImage ? (
                <img
                  src={watchImage}
                  alt="Profile Preview"
                  className="w-24 h-24 rounded-full border-2 border-zinc-700 object-cover shadow-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-orange-500 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg border-2 border-zinc-700">
                  {watchName ? watchName[0].toUpperCase() : "A"}
                </div>
              )}

              {/* Upload Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full border-2 border-zinc-950 shadow-md transition-transform hover:scale-110 cursor-pointer"
                title="Upload profile picture"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline cursor-pointer"
              >
                {watchImage ? "Change Photo" : "Upload Photo"}
              </button>

              {watchImage && (
                <>
                  <span className="text-zinc-600 text-xs">•</span>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline cursor-pointer"
                  >
                    Remove Photo
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Full Name Input */}
          <div className="space-y-1.5">
            <Label htmlFor="admin-name" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Full Name
            </Label>
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 h-11 focus-within:border-blue-500 transition-colors">
              <User className="h-4 w-4 text-zinc-500 mr-2.5 shrink-0" />
              <Input
                id="admin-name"
                type="text"
                placeholder="Enter your full name"
                {...register("name")}
                className="bg-transparent border-none text-white text-xs placeholder-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-full p-0 shadow-none"
              />
            </div>
            {errors.name && (
              <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email Address (Read-only Login Identifier) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="admin-email" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Email Address
              </Label>
              <span className="text-[10px] text-zinc-500 font-medium">Read-Only</span>
            </div>
            <div className="flex items-center bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-3.5 h-11 cursor-not-allowed opacity-75">
              <Mail className="h-4 w-4 text-zinc-500 mr-2.5 shrink-0" />
              <input
                id="admin-email"
                type="email"
                value={session?.user?.email || ""}
                disabled
                readOnly
                className="bg-transparent border-none text-zinc-400 text-xs h-full w-full outline-none cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-zinc-500 italic mt-1">
              Email is your primary login identifier and cannot be changed.
            </p>
          </div>

          {/* System Role Info */}
          <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-blue-400" /> Admin Role:
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
              {session?.user?.role || "Staff"}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl px-4 h-10 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl px-5 h-10 text-xs shadow-lg shadow-blue-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
