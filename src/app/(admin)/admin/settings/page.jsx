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
  Moon, 
  Sun, 
  Monitor,
  Mail,
  Phone,
  MapPin,
  Lock,
  Sparkles
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
    <div className="space-y-6 max-w-6xl mx-auto font-sans animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Store className="h-5 w-5 text-blue-400" /> Store Settings
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Manage your store details, security credentials, appearance themes, and operational preferences.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        
        {/* Left Navigation Rail */}
        <div className="md:col-span-1 space-y-1.5 bg-zinc-900/40 p-2 border border-zinc-800/60 rounded-2xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-3.5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
                  isActive
                    ? "bg-blue-600/15 text-blue-400 font-bold border-l-4 border-blue-500 shadow-sm shadow-blue-500/10"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-400" : "text-zinc-500"}`} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{item.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Content Panel */}
        <div className="md:col-span-3">

          {/* 1. GENERAL STORE SECTION */}
          {activeTab === "general" && (
            <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-6 shadow-xl">
              <div className="border-b border-zinc-800/60 pb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Store className="h-4 w-4 text-blue-400" /> General Store Information
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Configure public store branding, contact information, and business location address.
                </p>
              </div>

              {isStoreLoading ? (
                <div className="flex justify-center items-center py-12 text-zinc-500 text-xs">
                  <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-500" /> Loading store settings...
                </div>
              ) : (
                <form onSubmit={handleSubmitStore(onSaveStore)} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="store-name" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Store Name
                    </Label>
                    <Input
                      id="store-name"
                      type="text"
                      placeholder="e.g. Adarsh Stationery"
                      {...registerStore("storeName")}
                      className="bg-zinc-950 border-zinc-800 text-white rounded-xl text-xs h-11 focus-visible:ring-blue-500"
                    />
                    {storeErrors.storeName && (
                      <p className="text-xs text-rose-400 mt-1">{storeErrors.storeName.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-email" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                        Support / Contact Email
                      </Label>
                      <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3 h-11 focus-within:border-blue-500">
                        <Mail className="h-4 w-4 text-zinc-500 mr-2 shrink-0" />
                        <Input
                          id="contact-email"
                          type="email"
                          placeholder="support@adarsh.com"
                          {...registerStore("contactEmail")}
                          className="bg-transparent border-none text-white text-xs placeholder-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-full p-0 shadow-none"
                        />
                      </div>
                      {storeErrors.contactEmail && (
                        <p className="text-xs text-rose-400 mt-1">{storeErrors.contactEmail.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="contact-phone" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                        Customer Support Phone
                      </Label>
                      <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3 h-11 focus-within:border-blue-500">
                        <Phone className="h-4 w-4 text-zinc-500 mr-2 shrink-0" />
                        <Input
                          id="contact-phone"
                          type="text"
                          placeholder="+91 98765 43210"
                          {...registerStore("contactPhone")}
                          className="bg-transparent border-none text-white text-xs font-mono placeholder-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-full p-0 shadow-none"
                        />
                      </div>
                      {storeErrors.contactPhone && (
                        <p className="text-xs text-rose-400 mt-1">{storeErrors.contactPhone.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="store-address" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Physical Store / Billing Address
                    </Label>
                    <Textarea
                      id="store-address"
                      rows={3}
                      placeholder="Enter full store address"
                      {...registerStore("storeAddress")}
                      className="bg-zinc-950 border-zinc-800 text-white rounded-xl text-xs resize-none focus-visible:ring-blue-500"
                    />
                    {storeErrors.storeAddress && (
                      <p className="text-xs text-rose-400 mt-1">{storeErrors.storeAddress.message}</p>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={isStoreSaving}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs px-5 h-10 shadow-lg shadow-blue-500/20 cursor-pointer"
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
            <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-6 shadow-xl">
              <div className="border-b border-zinc-800/60 pb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-400" /> Account Security & Password
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Change your admin account password and manage security access credentials.
                </p>
              </div>

              <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="current-password" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Current Password
                  </Label>
                  <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3 h-11 focus-within:border-blue-500">
                    <Lock className="h-4 w-4 text-zinc-500 mr-2 shrink-0" />
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Enter current password"
                      {...registerPassword("currentPassword")}
                      className="bg-transparent border-none text-white text-xs placeholder-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-full p-0 shadow-none"
                    />
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-xs text-rose-400 mt-1">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      New Password
                    </Label>
                    <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3 h-11 focus-within:border-blue-500">
                      <Key className="h-4 w-4 text-zinc-500 mr-2 shrink-0" />
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="At least 6 characters"
                        {...registerPassword("newPassword")}
                        className="bg-transparent border-none text-white text-xs placeholder-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-full p-0 shadow-none"
                      />
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="text-xs text-rose-400 mt-1">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Confirm New Password
                    </Label>
                    <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3 h-11 focus-within:border-blue-500">
                      <Key className="h-4 w-4 text-zinc-500 mr-2 shrink-0" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Re-enter new password"
                        {...registerPassword("confirmPassword")}
                        className="bg-transparent border-none text-white text-xs placeholder-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-full p-0 shadow-none"
                      />
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-xs text-rose-400 mt-1">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isPasswordSaving}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs px-5 h-10 shadow-lg shadow-blue-500/20 cursor-pointer"
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
            <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-6 shadow-xl">
              <div className="border-b border-zinc-800/60 pb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Palette className="h-4 w-4 text-purple-400" /> Interface Appearance & Theme
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Select your preferred color mode for the administrative dashboard workspace.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Dark Theme Option */}
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-3 relative group ${
                    (mounted && theme === "dark") || (!mounted)
                      ? "bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10"
                      : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-blue-400">
                      <Moon className="h-5 w-5" />
                    </div>
                    {mounted && theme === "dark" && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Dark Theme</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">High-contrast dark mode tailored for low-light environments.</p>
                  </div>
                </button>

                {/* Light Theme Option */}
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-3 relative group ${
                    mounted && theme === "light"
                      ? "bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10"
                      : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400">
                      <Sun className="h-5 w-5" />
                    </div>
                    {mounted && theme === "light" && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Light Theme</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Clean, bright mode ideal for well-lit daytime workspaces.</p>
                  </div>
                </button>

                {/* System Default Option */}
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-3 relative group ${
                    mounted && theme === "system"
                      ? "bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10"
                      : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-purple-400">
                      <Monitor className="h-5 w-5" />
                    </div>
                    {mounted && theme === "system" && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">System Sync</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Automatically match your operating system theme settings.</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* 4. NOTIFICATIONS SECTION */}
          {activeTab === "notifications" && (
            <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-6 shadow-xl">
              <div className="border-b border-zinc-800/60 pb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Bell className="h-4 w-4 text-emerald-400" /> Email Notification Preferences
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Manage automatic email alerts sent to your admin email address.
                </p>
              </div>

              {isNotificationsLoading ? (
                <div className="flex justify-center items-center py-12 text-zinc-500 text-xs">
                  <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-500" /> Loading notification preferences...
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Toggle 1: New Orders */}
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-bold text-white">New Order Placed Alert</h3>
                      <p className="text-[11px] text-zinc-400">
                        Receive instant email notification whenever a customer completes a checkout order.
                      </p>
                    </div>
                    <Switch
                      checked={notifyNewOrder}
                      onCheckedChange={(val) => handleToggleNotification("notifyNewOrder", val)}
                      className="data-[state=checked]:bg-emerald-600 scale-90"
                    />
                  </div>

                  {/* Toggle 2: Low Stock */}
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-bold text-white">Low Stock Warning Alert</h3>
                      <p className="text-[11px] text-zinc-400">
                        Receive email notification when inventory stock for any stationery item drops below minimum threshold.
                      </p>
                    </div>
                    <Switch
                      checked={notifyLowStock}
                      onCheckedChange={(val) => handleToggleNotification("notifyLowStock", val)}
                      className="data-[state=checked]:bg-emerald-600 scale-90"
                    />
                  </div>

                  {/* Toggle 3: New Team Member */}
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-bold text-white">New Team Member Invitation Alert</h3>
                      <p className="text-[11px] text-zinc-400">
                        Receive email notification when a new staff member accepts an invite to join the admin workspace.
                      </p>
                    </div>
                    <Switch
                      checked={notifyNewTeamMember}
                      onCheckedChange={(val) => handleToggleNotification("notifyNewTeamMember", val)}
                      className="data-[state=checked]:bg-emerald-600 scale-90"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      onClick={handleSubmitNotifications(onSaveNotifications)}
                      disabled={isNotificationsSaving}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs px-5 h-10 shadow-lg shadow-blue-500/20 cursor-pointer"
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
            <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-6 shadow-xl">
              <div className="border-b border-zinc-800/60 pb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" /> Team & Staff Management
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Manage team member profiles, assign workspace roles, and send invitations.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Team Directory & Access Roles</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Review active workers, suspend or invite members, and adjust system permissions.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/admin/team-members">
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs px-5 h-10 shadow-lg shadow-blue-500/20 cursor-pointer flex items-center gap-2">
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
