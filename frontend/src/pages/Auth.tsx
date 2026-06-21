/**
 * Auth.tsx
 * 
 * This is the authentication page for the DeepFind application.
 * It provides a fully custom, premium, and glassmorphic user interface
 * that integrates with Supabase Authentication.
 * 
 * Restrictions implemented:
 * 1. ONLY Google and GitHub OAuth sign-in options are available.
 * 2. Branding renamed to "DeepFind".
 * 3. Self-contained validation, loading feedback, and error handling.
 */

import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { 
    AlertCircle, 
    Loader2, 
    Sparkles 
} from "lucide-react";

export default function Auth() {
    const navigate = useNavigate();

    // --- State Variables ---
    // tracks which provider is currently executing a loading request ("google", "github", or null)
    const [loading, setLoading] = useState<"google" | "github" | null>(null);
    // stores any OAuth or connection errors returned from Supabase
    const [error, setError] = useState<string | null>(null);

    // --- Hooks & Lifecycle ---
    /**
     * Check if user is already authenticated on initial page load.
     * If they are already authenticated, redirect them to the home page.
     */
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                navigate("/");
            }
        });
    }, [navigate]);

    // --- OAuth Auth API Actions ---
    /**
     * Handle OAuth Sign In via Supabase.
     * Supported providers: "google" | "github"
     */
    async function handleOAuthLogin(provider: "google" | "github") {
        setLoading(provider);
        setError(null);
        
        try {
            const { error: authError } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: window.location.origin // Redirect back to this app after OAuth login
                }
            });
            if (authError) throw authError;
        } catch (err: any) {
            setError(err.message || "Failed to initiate OAuth login.");
            setLoading(null);
        }
    }

    // --- Component JSX ---
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#090B11] text-zinc-100 p-4 relative overflow-hidden font-sans select-none">
            {/* Ambient Background glows to achieve premium, state-of-the-art aesthetics */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
            <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[140px] pointer-events-none" />
            
            {/* Subtle background grid pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#090B11_80%),linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:100%_100%,32px_32px,32px_32px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                {/* Brand Logo & Slogan Header */}
                <div className="flex flex-col items-center mb-8 animate-fade-in duration-700">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-2.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] mb-4">
                        <Sparkles className="w-full h-full text-zinc-950" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                        DeepFind
                    </h1>
                    <p className="text-sm text-zinc-400 mt-2">
                        Where knowledge begins.
                    </p>
                </div>

                {/* Glassmorphic Auth Card container */}
                <Card className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden transition-all duration-300 hover:border-zinc-700/50">
                    <CardHeader className="space-y-1 pb-4 text-center">
                        <CardTitle className="text-xl font-semibold text-zinc-100">
                            Sign In / Sign Up
                        </CardTitle>
                        <CardDescription className="text-zinc-400 text-sm">
                            Connect with one of our supported social providers to continue
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-2">
                        {/* Error Alert Display */}
                        {error && (
                            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm transition-all duration-300 animate-slide-in">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-medium text-red-300">Connection Error:</span>
                                    <p className="mt-0.5 opacity-90">{error}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-4">
                            {/* Google OAuth Button */}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOAuthLogin("google")}
                                className="w-full h-12 cursor-pointer border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/80 hover:text-zinc-100 flex items-center justify-center gap-3 rounded-xl transition-all duration-200 text-base font-medium shadow-md shadow-black/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                                disabled={loading !== null}
                            >
                                {loading === "google" ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                                        <path
                                            fill="#EA4335"
                                            d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.642 1.09 14.99 0 12 0 7.354 0 3.307 2.67 1.242 6.577l4.024 3.188z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M16.04 15.345c-1.07.727-2.455 1.164-4.04 1.164-2.955 0-5.464-1.99-6.355-4.664L1.62 15.033C3.686 19.141 7.9 22 12.8 22c2.955 0 5.673-1.027 7.7-2.791l-4.46-3.864z"
                                        />
                                        <path
                                            fill="#4285F4"
                                            d="M23.49 12.273c0-.818-.073-1.609-.209-2.373H12v4.582h6.445c-.277 1.482-1.118 2.736-2.372 3.582l4.46 3.864C23.136 19.345 23.49 16.036 23.49 12.273z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.645 11.845a7.03 7.03 0 0 1 0-2.08L1.62 6.577a11.978 11.978 0 0 0 0 8.455l4.025-3.187z"
                                        />
                                    </svg>
                                )}
                                <span>{loading === "google" ? "Connecting to Google..." : "Continue with Google"}</span>
                            </Button>

                            {/* GitHub OAuth Button */}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOAuthLogin("github")}
                                className="w-full h-12 cursor-pointer border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/80 hover:text-zinc-100 flex items-center justify-center gap-3 rounded-xl transition-all duration-200 text-base font-medium shadow-md shadow-black/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                                disabled={loading !== null}
                            >
                                {loading === "github" ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <svg className="w-5 h-5 text-zinc-100 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                                    </svg>
                                )}
                                <span>{loading === "github" ? "Connecting to GitHub..." : "Continue with GitHub"}</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}