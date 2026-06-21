/**
 * Auth.tsx
 * 
 * This is the authentication page for the Purplexity application.
 * It provides a fully custom, premium, and glassmorphic user interface
 * that integrates with Supabase Authentication.
 * 
 * Features implemented:
 * 1. Email & Password Log In
 * 2. Email & Password Sign Up (with Name and Confirm Password)
 * 3. Password Reset Request (Forgot Password)
 * 4. Password Update (Recovery flow triggered via email redirect)
 * 5. OAuth Sign In (Google & GitHub)
 * 6. Responsive UI with absolute glowing gradients and clean transitions
 * 7. Live client-side validation and rich error/success alert states
 */

import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardFooter, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { 
    Mail, 
    Lock, 
    User, 
    Eye, 
    EyeOff, 
    AlertCircle, 
    CheckCircle2, 
    ArrowRight, 
    Loader2, 
    Sparkles 
} from "lucide-react";

// Types of views/forms the user can toggle between
type AuthView = "login" | "register" | "forgot" | "update-password";

export default function Auth() {
    const navigate = useNavigate();

    // --- State Variables ---
    const [view, setView] = useState<AuthView>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    
    // Feedback and loading indicators
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Live validation states
    const [validationError, setValidationError] = useState<string | null>(null);

    // --- Hooks & Lifecycle ---
    /**
     * Check if user is already authenticated or if they arrived via a password-recovery redirect.
     * Supabase redirects recovery links back to the site, passing access tokens in the URL hash.
     */
    useEffect(() => {
        // Clear alerts when switching views
        setError(null);
        setSuccess(null);
        setValidationError(null);

        // Check if the current URL contains a recovery flow trigger
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;
        
        if (params.get("type") === "recovery" || hash.includes("type=recovery") || hash.includes("access_token")) {
            setView("update-password");
        } else {
            // Check if user is already signed in
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    navigate("/");
                }
            });
        }
    }, [navigate, view]);

    // --- Validation Logic ---
    /**
     * Validates email format and password matching / length before sending to backend.
     */
    const validateForm = (): boolean => {
        setValidationError(null);

        // Email regex check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setValidationError("Please enter a valid email address.");
            return false;
        }

        if (view === "login") {
            if (password.length < 6) {
                setValidationError("Password must be at least 6 characters.");
                return false;
            }
        }

        if (view === "register") {
            if (!fullName.trim()) {
                setValidationError("Name is required.");
                return false;
            }
            if (password.length < 6) {
                setValidationError("Password must be at least 6 characters.");
                return false;
            }
            if (password !== confirmPassword) {
                setValidationError("Passwords do not match.");
                return false;
            }
        }

        if (view === "update-password") {
            if (password.length < 6) {
                setValidationError("New password must be at least 6 characters.");
                return false;
            }
            if (password !== confirmPassword) {
                setValidationError("Passwords do not match.");
                return false;
            }
        }

        return true;
    };

    // --- Auth API Actions ---

    /**
     * Handle OAuth Sign In via Supabase.
     * Supported providers: "google" | "github"
     */
    async function handleOAuthLogin(provider: "google" | "github") {
        setLoading(true);
        setError(null);
        
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: window.location.origin // Redirect back to this app after OAuth login
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || "Failed to initiate OAuth login.");
            setLoading(false);
        }
    }

    /**
     * Submit handler for Credential authentication.
     */
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        if (!validateForm()) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (view === "login") {
                // Supabase Sign In with Password
                const { data, error: authError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                
                if (authError) throw authError;
                
                if (data.session) {
                    navigate("/");
                }
            } else if (view === "register") {
                // Supabase Sign Up with metadata (fullName)
                const { data, error: authError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name: fullName,
                        },
                        emailRedirectTo: window.location.origin
                    }
                });

                if (authError) throw authError;

                // Check if email confirmation is required or if we are immediately logged in
                if (data.session) {
                    navigate("/");
                } else {
                    setSuccess("Account created! Please check your email inbox to verify your account.");
                    // Reset input states
                    setEmail("");
                    setPassword("");
                    setConfirmPassword("");
                    setFullName("");
                }
            } else if (view === "forgot") {
                // Supabase Password Reset Request
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth?type=recovery`,
                });

                if (resetError) throw resetError;

                setSuccess("Password reset link sent! Please check your email.");
                setEmail("");
            } else if (view === "update-password") {
                // Supabase Update User Password (for recovery flows)
                const { error: updateError } = await supabase.auth.updateUser({
                    password: password
                });

                if (updateError) throw updateError;

                setSuccess("Password updated successfully! You can now log in.");
                setTimeout(() => {
                    setView("login");
                    setPassword("");
                    setConfirmPassword("");
                }, 2000);
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during authentication.");
        } finally {
            setLoading(false);
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
                        Purplexity
                    </h1>
                    <p className="text-sm text-zinc-400 mt-2">
                        Where knowledge begins.
                    </p>
                </div>

                {/* Glassmorphic Auth Card container */}
                <Card className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden transition-all duration-300 hover:border-zinc-700/50">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl font-semibold text-zinc-100">
                            {view === "login" && "Welcome Back"}
                            {view === "register" && "Create an Account"}
                            {view === "forgot" && "Reset Password"}
                            {view === "update-password" && "Update Password"}
                        </CardTitle>
                        <CardDescription className="text-zinc-400 text-sm">
                            {view === "login" && "Enter your credentials or use a social provider"}
                            {view === "register" && "Get started by creating your account"}
                            {view === "forgot" && "We'll send you instructions to reset your password"}
                            {view === "update-password" && "Set a new, secure password for your account"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Error Alert Display */}
                        {error && (
                            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm transition-all duration-300 animate-slide-in">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-medium text-red-300">Authentication Error:</span>
                                    <p className="mt-0.5 opacity-90">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Success Alert Display */}
                        {success && (
                            <div className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm transition-all duration-300 animate-slide-in">
                                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-medium text-emerald-300">Success:</span>
                                    <p className="mt-0.5 opacity-90">{success}</p>
                                </div>
                            </div>
                        )}

                        {/* Live Validation Alert Display */}
                        {validationError && (
                            <div className="flex items-center gap-2.5 p-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg text-xs transition-all duration-300 animate-slide-in">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{validationError}</span>
                            </div>
                        )}

                        {/* Traditional Email/Password Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Full Name input for registration */}
                            {view === "register" && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="fullName" className="text-xs text-zinc-300 font-medium">Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                        <Input
                                            id="fullName"
                                            type="text"
                                            placeholder="John Doe"
                                            required
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="pl-10 bg-zinc-950/40 border-zinc-800 text-zinc-200 placeholder-zinc-600 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Email input field - not visible in update-password mode */}
                            {view !== "update-password" && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-xs text-zinc-300 font-medium">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10 bg-zinc-950/40 border-zinc-800 text-zinc-200 placeholder-zinc-600 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Password input fields */}
                            {view !== "forgot" && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-xs text-zinc-300 font-medium">
                                            {view === "update-password" ? "New Password" : "Password"}
                                        </Label>
                                        
                                        {/* Forgot Password link (login view only) */}
                                        {view === "login" && (
                                            <button
                                                type="button"
                                                onClick={() => setView("forgot")}
                                                className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline transition-colors focus:outline-none"
                                            >
                                                Forgot password?
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 pr-10 bg-zinc-950/40 border-zinc-800 text-zinc-200 placeholder-zinc-600 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all"
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Confirm Password input (register or update password only) */}
                            {(view === "register" || view === "update-password") && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="confirmPassword" className="text-xs text-zinc-300 font-medium">
                                        Confirm Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                        <Input
                                            id="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-10 pr-10 bg-zinc-950/40 border-zinc-800 text-zinc-200 placeholder-zinc-600 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Main CTA Submission Button */}
                            <Button 
                                type="submit" 
                                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-semibold py-2.5 h-auto rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        {view === "login" && "Sign In"}
                                        {view === "register" && "Create Account"}
                                        {view === "forgot" && "Send Reset Link"}
                                        {view === "update-password" && "Reset Password"}
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Social Provider Buttons (only for Login and Register states) */}
                        {(view === "login" || view === "register") && (
                            <>
                                <div className="relative py-2 flex items-center justify-center">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-zinc-800" />
                                    </div>
                                    <span className="relative px-3 bg-zinc-900/60 text-xs text-zinc-500 backdrop-blur-md">
                                        or continue with
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Google OAuth Button */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleOAuthLogin("google")}
                                        className="h-10 cursor-pointer border-zinc-800 bg-zinc-900/20 hover:bg-zinc-800/50 hover:text-zinc-100 flex items-center justify-center gap-2 rounded-xl transition-all"
                                        disabled={loading}
                                    >
                                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                                        Google
                                    </Button>

                                    {/* GitHub OAuth Button */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleOAuthLogin("github")}
                                        className="h-10 cursor-pointer border-zinc-800 bg-zinc-900/20 hover:bg-zinc-800/50 hover:text-zinc-100 flex items-center justify-center gap-2 rounded-xl transition-all"
                                        disabled={loading}
                                    >
                                        <svg className="w-4 h-4 text-zinc-100 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                                        </svg>
                                        GitHub
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>

                    {/* Footer for navigation toggles */}
                    <CardFooter className="bg-zinc-950/20 border-t border-zinc-900 py-4 px-6 flex justify-center">
                        {view === "login" && (
                            <p className="text-xs text-zinc-500">
                                Don't have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => setView("register")}
                                    className="text-emerald-400 hover:text-emerald-300 font-semibold focus:outline-none transition-colors"
                                >
                                    Sign Up
                                </button>
                            </p>
                        )}

                        {view === "register" && (
                            <p className="text-xs text-zinc-500">
                                Already have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => setView("login")}
                                    className="text-emerald-400 hover:text-emerald-300 font-semibold focus:outline-none transition-colors"
                                >
                                    Sign In
                                </button>
                            </p>
                        )}

                        {(view === "forgot" || view === "update-password") && (
                            <button
                                type="button"
                                onClick={() => setView("login")}
                                className="text-xs text-zinc-500 hover:text-zinc-300 font-medium flex items-center gap-1.5 focus:outline-none transition-colors"
                            >
                                Back to Sign In
                            </button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}