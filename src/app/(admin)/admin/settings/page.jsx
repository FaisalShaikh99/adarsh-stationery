"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import axios from "axios";
import { toast } from "sonner";
import { 
  Store, 
  Shield, 
  Palette, 
  Bell, 
  Users, 
  Save, 
  Loader2, 
  Key, 
  Check, 
  ArrowRight, 
  Sun, 
  Mail,
  Phone,
  MapPin,
  Lock,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  storeSettingsSchema, 
  changePasswordSchema, 
  notificationsSchema 
} from "@/schemas/settings.schema";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // States
  const [isStoreLoading, setIsStoreLoading] = useState(true);
  const [isStoreSaving, setIsStoreSaving] = useState(false);

  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);
  const [isNotificationsSaving, setIsNotificationsSaving] = useState(false);

  // 1. General Store Form
  const {
    register: registerStore,
    handleSubmit: handleSubmitStore,
    reset: resetStore,
    formState: { errors: storeErrors },
  } = useForm({
    resolver: zodResolver(storeSettingsSchema),
    mode: "onBlur",
    defaultValues: {
      storeName: "",
      contactEmail: "",
      contactPhone: "",
      storeAddress: "",
    },
  });

  // 2. Security (Change Password) Form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    mode: "onBlur",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // 4. Notifications Form
  const {
    watch: watchNotifications,
    setValue: setNotificationValue,
    handleSubmit: handleSubmitNotifications,
    reset: resetNotifications,
  } = useForm({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      notifyNewOrder: true,
      notifyLowStock: true,
      notifyNewTeamMember: true,
    },
  });

  const notifyNewOrder = watchNotifications("notifyNewOrder");
  const notifyLowStock = watchNotifications("notifyLowStock");
  const notifyNewTeamMember = watchNotifications("notifyNewTeamMember");

  useEffect(() => {
    setMounted(true);
    fetchStoreSettings();
    fetchNotificationPreferences();
  }, []);

  const fetchStoreSettings = async () => {
    setIsStoreLoading(true);
    try {
      const res = await axios.get("/api/admin/settings/store");
      if (res.data?.data) {
        resetStore({
          storeName: res.data.data.storeName || "",
          contactEmail: res.data.data.contactEmail || "",
          contactPhone: res.data.data.contactPhone || "",
          storeAddress: res.data.data.storeAddress || "",
        });
      }
    } catch (error) {
      toast.error("Failed to load store settings.");
    } finally {
      setIsStoreLoading(false);
    }
  };

  const fetchNotificationPreferences = async () => {
    setIsNotificationsLoading(true);
    try {
      const res = await axios.get("/api/admin/settings/notifications");
      if (res.data?.data) {
        resetNotifications({
          notifyNewOrder: res.data.data.notifyNewOrder ?? true,
          notifyLowStock: res.data.data.notifyLowStock ?? true,
          notifyNewTeamMember: res.data.data.notifyNewTeamMember ?? true,
        });
      }
    } catch (error) {
      console.warn("Failed to load notification preferences", error);
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  const onSaveStore = async (data) => {
    setIsStoreSaving(true);
    try {
      const res = await axios.patch("/api/admin/settings/store", data);
      if (res.data?.success) {
        toast.success(res.data.message || "Store settings saved successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save store settings.");
    } finally {
      setIsStoreSaving(false);
    }
  };

  const onChangePassword = async (data) => {
    setIsPasswordSaving(true);
    try {
      const res = await axios.patch("/api/admin/settings/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Password changed successfully!");
        resetPassword();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password.");
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const onSaveNotifications = async (data) => {
    setIsNotificationsSaving(true);
    try {
      const res = await axios.patch("/api/admin/settings/notifications", data);
      if (res.data?.success) {
        toast.success(res.data.message || "Notification preferences saved!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save preferences.");
    } finally {
      setIsNotificationsSaving(false);
    }
  };

  const handleToggleNotification = (field, value) => {
    setNotificationValue(field, value);
    handleSubmitNotifications(onSaveNotifications)();
  };

  const navItems = [
    { id: "general", name: "General Store", icon: Store, desc: "Store name & contact details" },
    { id: "security", name: "Security", icon: Shield, desc: "Password & access controls" },
    { id: "appearance", name: "Appearance", icon: Palette, desc: "Theme & display modes" },
    { id: "notifications", name: "Notifications", icon: Bell, desc: "Email alert preferences" },
    { id: "team", name: "Team Management", icon: Users, desc: "Staff access & roles" },
  ];

  return (
    <div className="space-y-6 w-full max-w-full font-sans animate-in fade-in duration-300 overflow-x-hidden pb-12 text-gray-900">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-wrap gap-4 justify-between items-center border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary-600 text-white shadow-md ring-4 ring-primary-100">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">Store Administrative Settings</h1>
              <p className="text-xs sm:text-sm text-zinc-600 font-medium">
                Configure store business details, security authentication, notification preferences, and team roles.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        
        {/* LEFT NAVIGATION RAIL */}
        <div className="md:col-span-1 space-y-2 bg-white p-3 border border-border-subtle rounded-[26px] shadow-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer flex items-center gap-3.5 border ${
                  isActive
                    ? "bg-primary-600 text-white font-black border-primary-600 shadow-md"
                    : "bg-white text-gray-900 font-bold border-transparent hover:bg-primary-50/60 hover:border-primary-200"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${isActive ? "bg-white/20 text-white" : "bg-primary-50 text-primary-600 border border-primary-100"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs sm:text-sm font-black truncate ${isActive ? "text-white" : "text-gray-900"}`}>{item.name}</p>
                  <p className={`text-[11px] truncate mt-0.5 ${isActive ? "text-purple-100 font-bold" : "text-zinc-500 font-medium"}`}>{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT CONTENT PANEL */}
        <div className="md:col-span-3">

          {/* 1. GENERAL STORE SECTION */}
          {activeTab === "general" && (
            <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-border-subtle space-y-6 shadow-xs text-gray-900">
              <div className="border-b border-border-subtle pb-4">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2.5">
                  <Store className="h-5 w-5 text-primary-600" /> General Store Information
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 font-medium mt-1">
                  Configure public store branding, contact information, and physical business location address.
                </p>
              </div>

              {isStoreLoading ? (
                <div className="flex justify-center items-center py-12 text-zinc-600 font-bold text-xs">
                  <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary-600" /> Loading store settings...
                </div>
              ) : (
                <form onSubmit={handleSubmitStore(onSaveStore)} className="space-y-6">
                  
                  <div className="space-y-2">
                    <Label htmlFor="store-name" className="text-xs font-black text-gray-900 uppercase tracking-wider block">
                      Store Name
                    </Label>
                    <Input
                      id="store-name"
                      type="text"
                      placeholder="e.g. Adarsh Stationery"
                      {...registerStore("storeName")}
                      className="bg-white border-border-subtle text-gray-900 font-bold rounded-2xl text-xs sm:text-sm h-12 px-4 focus-visible:ring-primary-400 shadow-2xs"
                    />
                    {storeErrors.storeName && (
                      <p className="text-xs text-rose-600 font-bold mt-1">{storeErrors.storeName.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="contact-email" className="text-xs font-black text-gray-900 uppercase tracking-wider block">
                        Support / Contact Email
                      </Label>
                      <div className="flex items-center bg-white border border-border-subtle rounded-2xl px-4 h-12 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 shadow-2xs">
                        <Mail className="h-4 w-4 text-zinc-400 mr-2.5 shrink-0" />
                        <Input
                          id="contact-email"
                          type="email"
                          placeholder="support@adarshstationery.com"
                          {...registerStore("contactEmail")}
                          className="bg-transparent border-none text-gray-900 font-bold text-xs sm:text-sm placeholder-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-full p-0 shadow-none"
                        />
                      </div>
                      {storeErrors.contactEmail && (
                        <p className="text-xs text-rose-600 font-bold mt-1">{storeErrors.contactEmail.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-phone" className="text-xs font-black text-gray-900 uppercase tracking-wider block">
                        Customer Support Phone
                      </Label>
                      <div className="flex items-center bg-white border border-border-subtle rounded-2xl px-4 h-12 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 shadow-2xs">
                        <Phone className="h-4 w-4 text-zinc-400 mr-2.5 shrink-0" />
                        <Input
                          id="contact-phone"
                          type="text"
                          placeholder="+91 98765 43210"
                          {...registerStore("contactPhone")}
                          className="bg-transparent border-none text-gray-900 font-bold text-xs sm:text-sm font-mono placeholder-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-full p-0 shadow-none"
                        />
                      </div>
                      {storeErrors.contactPhone && (
                        <p className="text-xs text-rose-600 font-bold mt-1">{storeErrors.contactPhone.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="store-address" className="text-xs font-black text-gray-900 uppercase tracking-wider block">
                      Physical Store / Billing Address
                    </Label>
                    <Textarea
                      id="store-address"
                      rows={3}
                      placeholder="Enter full store billing and dispatch address"
                      {...registerStore("storeAddress")}
                      className="bg-white border-border-subtle text-gray-900 font-medium rounded-2xl text-xs sm:text-sm resize-none focus-visible:ring-primary-400 shadow-2xs p-4"
                    />
                    {storeErrors.storeAddress && (
                      <p className="text-xs text-rose-600 font-bold mt-1">{storeErrors.storeAddress.message}</p>
                    )}
                  </div>

                  <div className="pt-3 flex justify-end border-t border-border-subtle">
                    <Button
                      type="submit"
                      disabled={isStoreSaving}
                      className="bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl text-xs sm:text-sm px-6 h-12 shadow-md cursor-pointer btn-modern"
                    >
                      {isStoreSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" /> Save Store Settings
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 2. SECURITY SECTION */}
          {activeTab === "security" && (
            <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-border-subtle space-y-6 shadow-xs text-gray-900">
              <div className="border-b border-border-subtle pb-4">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2.5">
                  <Shield className="h-5 w-5 text-primary-600" /> Account Security & Password Access
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 font-medium mt-1">
                  Change your administrative account password and update security credentials.
                </p>
              </div>

              <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-xs font-black text-gray-900 uppercase tracking-wider block">
                    Current Password
                  </Label>
                  <div className="flex items-center bg-white border border-border-subtle rounded-2xl px-4 h-12 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 shadow-2xs">
                    <Lock className="h-4 w-4 text-zinc-400 mr-2.5 shrink-0" />
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Enter current password"
                      {...registerPassword("currentPassword")}
                      className="bg-transparent border-none text-gray-900 font-bold text-xs sm:text-sm placeholder-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-full p-0 shadow-none"
                    />
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-xs text-rose-600 font-bold mt-1">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-xs font-black text-gray-900 uppercase tracking-wider block">
                      New Password
                    </Label>
                    <div className="flex items-center bg-white border border-border-subtle rounded-2xl px-4 h-12 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 shadow-2xs">
                      <Key className="h-4 w-4 text-zinc-400 mr-2.5 shrink-0" />
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="At least 6 characters"
                        {...registerPassword("newPassword")}
                        className="bg-transparent border-none text-gray-900 font-bold text-xs sm:text-sm placeholder-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-full p-0 shadow-none"
                      />
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="text-xs text-rose-600 font-bold mt-1">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-xs font-black text-gray-900 uppercase tracking-wider block">
                      Confirm New Password
                    </Label>
                    <div className="flex items-center bg-white border border-border-subtle rounded-2xl px-4 h-12 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 shadow-2xs">
                      <Key className="h-4 w-4 text-zinc-400 mr-2.5 shrink-0" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Re-enter new password"
                        {...registerPassword("confirmPassword")}
                        className="bg-transparent border-none text-gray-900 font-bold text-xs sm:text-sm placeholder-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-full p-0 shadow-none"
                      />
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-xs text-rose-600 font-bold mt-1">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 flex justify-end border-t border-border-subtle">
                  <Button
                    type="submit"
                    disabled={isPasswordSaving}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl text-xs sm:text-sm px-6 h-12 shadow-md cursor-pointer btn-modern"
                  >
                    {isPasswordSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" /> Change Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* 3. APPEARANCE SECTION */}
          {activeTab === "appearance" && (
            <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-border-subtle space-y-6 shadow-xs text-gray-900">
              <div className="border-b border-border-subtle pb-4">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2.5">
                  <Palette className="h-5 w-5 text-primary-600" /> Interface Appearance & Theme
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 font-medium mt-1">
                  This administrative workspace is optimized for high contrast legibility using our clean Light SaaS Purple theme.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-primary-50 border border-primary-200 flex items-center gap-4 shadow-2xs">
                <div className="p-3 rounded-2xl bg-primary-600 text-white shadow-md">
                  <Sun className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Light SaaS Theme Active</h3>
                  <p className="text-xs text-zinc-600 font-medium mt-0.5">
                    Light mode is active across all workspace modules for optimal readability and high-contrast text.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. NOTIFICATIONS SECTION */}
          {activeTab === "notifications" && (
            <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-border-subtle space-y-6 shadow-xs text-gray-900">
              <div className="border-b border-border-subtle pb-4">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2.5">
                  <Bell className="h-5 w-5 text-primary-600" /> Email Notification Preferences
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 font-medium mt-1">
                  Manage automatic email alerts sent to your admin email address.
                </p>
              </div>

              {isNotificationsLoading ? (
                <div className="flex justify-center items-center py-12 text-zinc-600 font-bold text-xs">
                  <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary-600" /> Loading notification preferences...
                </div>
              ) : (
                <div className="space-y-4 font-sans">
                  
                  {/* Toggle 1: New Orders */}
                  <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle flex items-center justify-between gap-4 shadow-2xs">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-gray-900">New Order Placed Alert</h3>
                      <p className="text-xs text-zinc-600 font-medium">
                        Receive instant email notification whenever a customer completes a checkout order.
                      </p>
                    </div>
                    <Switch
                      checked={notifyNewOrder}
                      onCheckedChange={(val) => handleToggleNotification("notifyNewOrder", val)}
                      className="data-[state=checked]:bg-emerald-600 scale-90 cursor-pointer"
                    />
                  </div>

                  {/* Toggle 2: Low Stock */}
                  <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle flex items-center justify-between gap-4 shadow-2xs">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-gray-900">Low Stock Warning Alert</h3>
                      <p className="text-xs text-zinc-600 font-medium">
                        Receive email notification when inventory stock for any stationery item drops below minimum threshold.
                      </p>
                    </div>
                    <Switch
                      checked={notifyLowStock}
                      onCheckedChange={(val) => handleToggleNotification("notifyLowStock", val)}
                      className="data-[state=checked]:bg-emerald-600 scale-90 cursor-pointer"
                    />
                  </div>

                  {/* Toggle 3: New Team Member */}
                  <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle flex items-center justify-between gap-4 shadow-2xs">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-gray-900">New Team Member Invitation Alert</h3>
                      <p className="text-xs text-zinc-600 font-medium">
                        Receive email notification when a new staff member accepts an invite to join the admin workspace.
                      </p>
                    </div>
                    <Switch
                      checked={notifyNewTeamMember}
                      onCheckedChange={(val) => handleToggleNotification("notifyNewTeamMember", val)}
                      className="data-[state=checked]:bg-emerald-600 scale-90 cursor-pointer"
                    />
                  </div>

                  <div className="pt-3 flex justify-end border-t border-border-subtle">
                    <Button
                      onClick={handleSubmitNotifications(onSaveNotifications)}
                      disabled={isNotificationsSaving}
                      className="bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl text-xs sm:text-sm px-6 h-12 shadow-md cursor-pointer btn-modern"
                    >
                      {isNotificationsSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" /> Save Notification Preferences
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. TEAM MANAGEMENT SHORTCUT SECTION */}
          {activeTab === "team" && (
            <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-border-subtle space-y-6 shadow-xs text-gray-900">
              <div className="border-b border-border-subtle pb-4">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2.5">
                  <Users className="h-5 w-5 text-primary-600" /> Team & Staff Management
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 font-medium mt-1">
                  Manage team member profiles, assign workspace roles, and send invitations.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-4 shadow-2xs">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-2xl bg-primary-600 text-white shadow-md">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-gray-900">Team Directory & Access Roles</h3>
                    <p className="text-xs text-zinc-600 font-medium mt-0.5">
                      Review active workers, suspend or invite members, and adjust system permissions.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/admin/team-members">
                    <Button className="bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl text-xs sm:text-sm px-6 h-11 shadow-md cursor-pointer flex items-center gap-2 btn-modern">
                      Manage Team Members <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
