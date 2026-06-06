"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);

  // Google Login Handler function
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // NextAuth ka built-in function jo user ko direct Google page par le jayega
      // Login hone ke baad user automatic admin dashboard par redirect ho jayega
      await signIn("google", { callbackUrl: "/admin/dashboard" });
    } catch (error) {
      console.error("Login Error:", error);
      toast.error("Something went wrong during Google Sign-In.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans">
      
      {/* Shadcn Card Component ka use kiya */}
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
        <CardHeader className="space-y-2 text-center pb-6 border-b border-zinc-800/60">
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Adarsh Stationery
          </CardTitle>
          <CardDescription className="text-zinc-400 text-sm">
            Admin & Staff Control Panel Access
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-8 space-y-6">
          <p className="text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
            Secure Authentication Required
          </p>

          {/* Google Login Button */}
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-200 text-zinc-950 font-bold h-12 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-3 shadow-lg shadow-white/5"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-full animate-spin text-zinc-950" />
                Connecting Securely...
              </>
            ) : (
              <>
                {/* Simple SVG Logo for Google */}
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.18 1 1.25 5.93 1.25 12s4.93 11 10.99 11c6.325 0 10.535-4.44 10.535-10.72 0-.726-.08-1.284-.175-1.695H12.24Z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <p className="text-center text-xs text-zinc-600 mt-4">
            Authorized personnel only. All access attempts are monitored and logged.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}