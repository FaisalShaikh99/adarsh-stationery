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
                {/* Official Multi-colored SVG Logo for Google */}
                <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1?? 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
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