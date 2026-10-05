import React, { useState, useEffect } from "react";
import { User, Lock, Eye, EyeOff, Sun, Moon, ArrowRight, Loader2, X } from "lucide-react";
import { AuthResponse } from "./types";
import { API_BASE_URL } from "@/lib/api";
import { persistAuthSession } from "@/lib/session";
import { useTheme } from "@/context/ThemeContext";
import logoImg from "@/assets/logo.png";
import brandHeroImg from "@/assets/brand-hero.jpg";

export interface SignInPageProps {
  onSignInSuccess: (response: AuthResponse) => void;
}

interface ParsedError {
  message: string;
  code?: string;
  field?: "identifier" | "password" | "general";
}

/** Extract error message and code from backend response shape */
function parseErrorMessage(data: Record<string, unknown>): ParsedError {
  const detail = data?.detail as Record<string, unknown> | undefined;
  if (detail?.error) {
    const err = detail.error as Record<string, unknown>;
    return {
      message: (err.message as string) || "Authentication failed.",
      code: (err.code as string) || undefined,
      field: "general",
    };
  }
  if (typeof detail === "string") return { message: detail, field: "general" };
  return {
    message: (data?.message as string) || "Invalid credentials. Please verify username and password.",
    code: (data?.code as string) || undefined,
    field: "general",
  };
}

export const SignInPage: React.FC<SignInPageProps> = ({ onSignInSuccess }) => {
  const { theme, toggleTheme } = useTheme();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<ParsedError | null>(null);

  // Auto-dismiss floating toast notification after 5.5 seconds
  useEffect(() => {
    if (!errorInfo) return;
    const timer = setTimeout(() => {
      setErrorInfo(null);
    }, 5500);
    return () => clearTimeout(timer);
  }, [errorInfo]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();

    if (!cleanId) {
      setErrorInfo({
        message: "Please enter your username or email.",
        code: "REQUIRED_FIELD",
        field: "identifier",
      });
      return;
    }
    if (!password) {
      setErrorInfo({
        message: "Please enter your password.",
        code: "REQUIRED_FIELD",
        field: "password",
      });
      return;
    }

    setIsLoading(true);
    setErrorInfo(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          identifier: cleanId,
          userid: cleanId,
          username: cleanId,
          email: cleanId,
          password,
          remember_me: rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorInfo(parseErrorMessage(data));
        return;
      }

      const token = data.access_token || data.token || "";
      const user = data.user;

      if (!token || !user) {
        setErrorInfo({
          message: "Unexpected response from authentication service. Please try again.",
          code: "INVALID_SERVER_RESPONSE",
          field: "general",
        });
        return;
      }

      const authData: AuthResponse = {
        access_token: token,
        refresh_token: data.refresh_token,
        token_type: "bearer",
        expires_in: data.expires_in,
        user,
      };

      persistAuthSession(token, user, rememberMe, data.refresh_token);
      onSignInSuccess(authData);
    } catch {
      setErrorInfo({
        message: "Unable to reach authentication server. Please check your network connection.",
        code: "NETWORK_ERROR",
        field: "general",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-center items-center p-4 sm:p-6 select-none overflow-hidden font-sans">
      {/* Brand Hero Background with warm dark atmosphere */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={brandHeroImg}
          alt=""
          className="h-full w-full object-cover object-center scale-105 transition-transform duration-1000"
        />
        {/* Dual overlay: deep dark gradient for text contrast & subtle brand tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/70 to-zinc-950/90" />
        <div className="absolute inset-0 bg-[#714b67]/10 mix-blend-overlay" />
      </div>

      {/* Top Bar: Discreet Theme Switcher */}
      <header className="absolute top-5 right-5 sm:top-6 sm:right-7 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/90 bg-black/40 hover:bg-black/60 border border-white/20 shadow-md transition-colors duration-150 cursor-pointer"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-purple-300" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </header>

      {/* Floating Notification Toast for Exceptions */}
      {errorInfo && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 max-w-sm w-[calc(100vw-2.5rem)] animate-smooth-toast"
        >
          <div className="bg-[#1e293b] text-white px-4 py-3 rounded-md shadow-xl border border-white/15 flex items-start gap-3 text-xs">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse mt-1.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-rose-400 tracking-wide uppercase text-[10px] font-mono">
                  {errorInfo.code ? errorInfo.code.replace(/_/g, " ") : "Access Alert"}
                </span>
              </div>
              <p className="text-zinc-200 text-xs leading-relaxed">
                {errorInfo.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setErrorInfo(null)}
              className="text-zinc-400 hover:text-white p-0.5 rounded transition-colors shrink-0 cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sign-In Card Container */}
      <main className="relative z-10 w-full max-w-[420px]">
        {/* Form Sheet Card */}
        <div className="bg-white dark:bg-[#12141d] rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-2xl p-6 sm:p-8 transition-colors duration-150 animate-smooth-modal">
          
          {/* Brand Logo - Bold, Crisp & Prominent inside the card */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="h-16 flex items-center justify-center mb-3">
              <img
                src={logoImg}
                alt="Navneet"
                className="h-14 sm:h-16 w-auto object-contain drop-shadow-xs"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1e293b] dark:text-zinc-50">
              Sign In
            </h1>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Sampling Management & Planning System
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
            {/* Username / Email */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-semibold text-[#1e293b] dark:text-zinc-200 mb-1.5"
              >
                Username or Email
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-zinc-400 dark:text-zinc-500 pointer-events-none">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorInfo) setErrorInfo(null);
                  }}
                  placeholder="Enter your username"
                  autoFocus
                  required
                  className={`w-full h-10 pl-9 pr-3 text-xs sm:text-[13px] rounded bg-white dark:bg-[#1a1e2c] text-[#1e293b] dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 border transition-colors duration-100 outline-none ${
                    errorInfo?.field === "identifier"
                      ? "border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/15"
                      : "border-[#ced4da] dark:border-white/15 focus:border-[#714b67] dark:focus:border-[#9d6b91] focus:ring-2 focus:ring-[#714b67]/15 dark:focus:ring-[#9d6b91]/25"
                  }`}
                />
              </div>
              {errorInfo?.field === "identifier" && (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  {errorInfo.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-[#1e293b] dark:text-zinc-200 mb-1.5"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-zinc-400 dark:text-zinc-500 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorInfo) setErrorInfo(null);
                  }}
                  placeholder="••••••••••••"
                  required
                  className={`w-full h-10 pl-9 pr-10 text-xs sm:text-[13px] rounded bg-white dark:bg-[#1a1e2c] text-[#1e293b] dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 border transition-colors duration-100 outline-none font-mono ${
                    errorInfo?.field === "password"
                      ? "border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/15"
                      : "border-[#ced4da] dark:border-white/15 focus:border-[#714b67] dark:focus:border-[#9d6b91] focus:ring-2 focus:ring-[#714b67]/15 dark:focus:ring-[#9d6b91]/25"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-0.5 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errorInfo?.field === "password" && (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  {errorInfo.message}
                </p>
              )}
            </div>

            {/* Keep me signed in */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#ced4da] dark:border-zinc-700 text-[#714b67] focus:ring-[#714b67]/20 cursor-pointer"
                />
                <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                  Keep me signed in
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 mt-2 rounded bg-[#714b67] hover:bg-[#5b3c53] active:bg-[#3e2938] text-white text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors duration-140 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>


          </form>
        </div>

        {/* Minimal clean footer */}
        <p className="mt-6 text-center text-[11px] text-white/70 font-medium drop-shadow-xs">
          Navneet Education Limited
        </p>
      </main>
    </div>
  );
};
