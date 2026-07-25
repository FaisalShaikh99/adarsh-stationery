"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PenTool } from "lucide-react";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);

  // Google Login Handler function
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/admin/dashboard" });
    } catch (error) {
      console.error("Login Error:", error);
      toast.error("Something went wrong during Google Sign-In.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 font-sans text-gray-900">
      
      {/* Shadcn Card Component with Translucent Glass Styling */}
      <Card className="w-full max-w-md border-border-subtle bg-white/90 backdrop-blur-md shadow-xl rounded-2xl animate-in fade-in zoom-in-95 duration-200">
        <CardHeader className="space-y-2 text-center pb-6 border-b border-border-subtle">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-xs mb-1">
            <PenTool className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight text-gray-900">
            Adarsh Stationery
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs">
            Admin & Staff Control Panel Access
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-8 space-y-6">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-primary-700">
            Secure Authentication Required
          </p>

          {/* Google Login Button */}
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold h-12 rounded-xl transition-all flex items-center justify-center gap-3 shadow-xs btn-modern cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-white" />
                Connecting Securely...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 512 512">
                  <path d="M0 0h512v512H0z" fill="none" />
                  <path fill="#fc4c53" d="M502.2 209.5H261.1v99.1h137.8c-6.1 31.9-24.2 58.9-51.4 77c-22.8 15.4-51.9 24.7-86.3 24.7c-66.6 0-123.1-44.9-143.4-105.4h-.3l.3-.2c-5.1-15.4-8.1-31.7-8.1-48.6s3-33.3 8.1-48.6C138 147 194.6 102.1 261.2 102.1c37.7 0 71.2 13 98 38.2L432.5 67C388 25.4 330.2 0 261.1 0C161 0 74.7 57.5 32.6 141.3C15.1 175.7 5.1 214.6 5.1 256s10 80.3 27.5 114.7v.2C74.7 454.5 161 512 261.1 512c69.1 0 127.1-22.8 169.4-61.9c48.4-44.7 76.3-110.3 76.3-188.3c.1-18.1-1.5-35.6-4.6-52.3" />
                  <radialGradient id="SVGlCFn0bxH" cx="91.998" cy="254.653" r="224.709" gradientTransform="matrix(.8032 0 0 -1.0842 -7.184 568.69)" gradientUnits="userSpaceOnUse">
                    <stop offset=".368" stopColor="#ffcf09" />
                    <stop offset=".718" stopColor="#ffcf09" stopOpacity=".7" />
                    <stop offset="1" stopColor="#ffcf09" stopOpacity="0" />
                  </radialGradient>
                  <path fill="url(#SVGlCFn0bxH)" d="M117.8 304.9h-.3l.3-.2c-5.1-15.4-8.1-31.7-8.1-48.6c0-17 3-33.3 8.1-48.6c12.8-38.3 40.2-70.2 75.3-88.6C169 86.9 138.3 64 104 54.2c-29.7 23.3-54.3 52.9-71.5 87C15.1 175.7 5.1 214.6 5.1 256s10 80.3 27.5 114.7v.2c28.3 56 76.5 100.3 135.3 123.4c24.6-22.5 44.7-53 58.6-88.7c-50.9-12.4-92.1-51.1-108.7-100.7" />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <p className="text-center text-[11px] text-zinc-500 mt-4">
            Authorized personnel only. All access attempts are monitored and logged.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}