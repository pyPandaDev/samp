import React, { useState, useEffect, useRef, useMemo } from "react";
import { UserProfile } from "@/features/auth";
import { Sidebar } from "./Sidebar";
import { getNavigationTitle } from "./navigation";
import { useTheme } from "@/context/ThemeContext";
import { useBusinessYear } from "@/context/BusinessYearContext";
import { usePlant } from "@/context/PlantContext";
import {
  Menu,
  Sun,
  Moon,
  Calendar,
  Clock,
  RefreshCw,
  Search,
  X,
  ChevronDown,
  LogOut,
  Settings,
} from "lucide-react";

export interface AppShellProps {
  user: UserProfile;
  onLogout: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

interface GlobalToast {
  id: string;
  message: string;
  tone: "success" | "error" | "info";
}

export const AppShell: React.FC<AppShellProps> = ({
  user,
  onLogout,
  currentPath,
  onNavigate,
  children,
}) => {
  const { theme, toggleTheme } = useTheme();
  const {
    selectedYear,
    setSelectedYear,
    yearsList,
    totalRecords,
  } = useBusinessYear();

  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  const [isPlantDropdownOpen, setIsPlantDropdownOpen] = useState(false);
  const plantDropdownRef = useRef<HTMLDivElement>(null);

  const {
    selectedPlant,
    setSelectedPlant,
    plantOptions,
    activePlantLabel,
  } = usePlant();

  const plantsList = useMemo(() => [
    { code: "ALL", name: "Consolidated (All Plants)", label: "Consolidated (All Plants)" },
    ...plantOptions.map((p) => ({
      code: p.code,
      name: p.name,
      label: p.displayName,
    })),
  ], [plantOptions]);

  const handleSelectPlant = (plantCode: string, plantLabel: string) => {
    setSelectedPlant(plantCode);
    setIsPlantDropdownOpen(false);
    window.dispatchEvent(
      new CustomEvent("app:plant-changed", {
        detail: { plant: plantCode, label: plantLabel },
      })
    );
    window.dispatchEvent(
      new CustomEvent("app:show-toast", {
        detail: {
          message: `Fulfillment plant scope updated: ${plantLabel}`,
          tone: "info",
        },
      })
    );
  };

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(target)) {
        setIsYearDropdownOpen(false);
      }
      if (plantDropdownRef.current && !plantDropdownRef.current.contains(target)) {
        setIsPlantDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [globalToast, setGlobalToast] = useState<GlobalToast | null>(null);

  // Global Toast event listener
  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; tone?: "success" | "error" | "info" }>;
      if (customEvent.detail?.message) {
        setGlobalToast({
          id: `toast-${Date.now()}`,
          message: customEvent.detail.message,
          tone: customEvent.detail.tone || "success",
        });
      }
    };

    window.addEventListener("app:show-toast", handleToastEvent);
    return () => window.removeEventListener("app:show-toast", handleToastEvent);
  }, []);

  useEffect(() => {
    if (!globalToast) return;
    const timer = setTimeout(() => {
      setGlobalToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [globalToast]);

  useEffect(() => {
    const handleRefreshComplete = () => setIsRefreshing(false);
    window.addEventListener("app:refresh-complete", handleRefreshComplete);
    return () => window.removeEventListener("app:refresh-complete", handleRefreshComplete);
  }, []);

  const handlePageRefresh = () => {
    setIsRefreshing(true);
    const refreshEvent = new Event("app:refresh-requested", { cancelable: true });
    if (window.dispatchEvent(refreshEvent)) {
      window.location.reload();
    }
  };

  // Live system date & time sync
  const [currentDateTime, setCurrentDateTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const formattedTime = currentDateTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Global Ctrl+K / Cmd+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleGlobalSearchFocus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPath]);

  const handleGlobalSearchFocus = () => {
    const el = document.getElementById("global-search-input") as HTMLInputElement | null;
    if (el) {
      el.focus();
      el.select();
    } else {
      onNavigate("/sample-requests");
      setTimeout(() => {
        const input = document.getElementById("global-search-input") as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.select();
        }
      }, 100);
    }
  };

  // User initials (up to 2 chars)
  const initials = (user?.name || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const activeTitle = getNavigationTitle(currentPath);
  const plantDisplayLabel = activePlantLabel;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f1f3f5] dark:bg-[#0c0d12] text-[#1e293b] dark:text-zinc-100 font-sans transition-colors duration-150 select-none">
      {/* Primary Navigation Sidebar */}
      <Sidebar
        user={user}
        onLogout={onLogout}
        selectedPath={currentPath}
        onSelectPath={onNavigate}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* ========================================================================= */}
        {/* CLEAN UTILITY TOP BAR (No Redundant Department Tabs)                      */}
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* ENTERPRISE UTILITY TOP BAR                                                */}
        {/* ========================================================================= */}
        <header className="h-10 bg-[#714B67] dark:bg-[#3E2938] text-white flex items-center justify-between px-3 sm:px-5 border-b border-[#5B3C53] dark:border-[#2A1B26] shrink-0 z-40 shadow-xs gap-3">
          
          {/* Left: Mobile Menu Toggle & Current Workspace Breadcrumb */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden p-1 rounded hover:bg-white/10 text-white/80 transition focus:outline-none cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Current Active Workspace Indicator */}
            <div className="flex items-center text-xs font-semibold">
              <span className="text-white/60 font-normal">Workspace</span>
              <span className="mx-1.5 text-white/30">/</span>
              <span className="text-white font-bold truncate">
                {activeTitle}
              </span>
              <span className="hidden sm:inline-block ml-2 text-[9px] bg-white/20 text-white px-1.5 py-0.2 rounded font-mono font-bold tracking-wider">
                SAMP ERP
              </span>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="flex-1 max-w-md mx-2 hidden sm:block">
            <div
              onClick={handleGlobalSearchFocus}
              className="flex items-center bg-black/20 hover:bg-black/30 border border-white/15 focus-within:border-white focus-within:bg-black/35 rounded px-2.5 py-1 text-xs text-white/80 transition cursor-text"
            >
              <Search className="w-3.5 h-3.5 text-white/60 mr-2 shrink-0" />
              <input
                id="global-search-input"
                type="text"
                placeholder="Search requests, materials, customers... (Ctrl+K)"
                className="bg-transparent border-none text-xs w-full focus:outline-none text-white placeholder:text-white/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onNavigate("/sample-requests");
                  }
                }}
              />
              <kbd className="font-mono text-[9px] bg-white/20 px-1 py-0.5 rounded text-white shrink-0">
                Ctrl+K
              </kbd>
            </div>
          </div>

          {/* Right: Multi-Plant Selector, Live Date/Time & BY, Theme Toggle, Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Multi-Plant Scope Selector */}
            <div className="relative" ref={plantDropdownRef}>
              <button
                type="button"
                onClick={() => setIsPlantDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 bg-black/20 hover:bg-black/30 px-2.5 py-1 rounded border border-white/15 text-xs text-white cursor-pointer transition select-none"
                title="Select Active Fulfillment Plant"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[10px] text-white/70 uppercase font-mono hidden md:inline">Plant:</span>
                <span className="font-semibold text-xs truncate max-w-[130px] sm:max-w-none text-white">
                  {plantDisplayLabel}
                </span>
                <ChevronDown className="w-3 h-3 text-white/60 ml-0.5" />
              </button>

              {isPlantDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 rounded-md bg-white dark:bg-[#141722] text-[#1e293b] dark:text-zinc-100 border border-[#ced4da] dark:border-white/15 shadow-2xl z-50 p-1 text-xs select-none animate-in fade-in duration-100">
                  <div className="px-2 py-1.5 text-[10px] font-mono uppercase text-zinc-400 font-bold border-b border-zinc-100 dark:border-white/[0.06] mb-1">
                    Select Plant Scope
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-0.5">
                    {plantsList.map((opt) => (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => handleSelectPlant(opt.code, opt.label)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition cursor-pointer ${
                          selectedPlant === opt.code
                            ? "bg-[#714b67]/10 dark:bg-[#714b67]/25 text-[#714b67] dark:text-purple-300 font-semibold"
                            : "hover:bg-zinc-50 dark:hover:bg-white/[0.04] text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {selectedPlant === opt.code && <span className="text-emerald-600 font-bold ml-1">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Live Clock & Date Badge */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded bg-black/20 border border-white/15 text-xs text-white/90">
              <div className="flex items-center gap-1.5 text-white/70">
                <Calendar className="w-3 h-3 text-white/60" />
                <span>{formattedDate}</span>
              </div>
              <span className="text-white/30">|</span>
              <div className="flex items-center gap-1.5 font-mono font-semibold text-white">
                <Clock className="w-3 h-3 text-white/80" />
                <span>{formattedTime}</span>
              </div>
            </div>

            {/* Business Year Selector */}
            <div className="relative hidden sm:inline-block" ref={yearDropdownRef}>
              <button
                type="button"
                onClick={() => setIsYearDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/25 px-2.5 py-1 rounded border border-white/25 text-white font-mono text-xs font-semibold cursor-pointer select-none"
                title="Business Year (October to September)"
              >
                <span>{selectedYear === "ALL" ? "All Years" : `BY ${selectedYear}`}</span>
                <ChevronDown className="w-3 h-3 text-white/70" />
              </button>

              {isYearDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 rounded-md bg-white dark:bg-[#141722] text-[#1e293b] dark:text-zinc-100 border border-[#ced4da] dark:border-white/15 shadow-2xl z-50 p-1 text-xs select-none animate-in fade-in duration-100 max-h-72 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedYear("ALL");
                      setIsYearDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded font-mono transition cursor-pointer ${
                      selectedYear === "ALL"
                        ? "bg-[#714b67]/10 dark:bg-[#714b67]/25 text-[#714b67] dark:text-purple-300 font-semibold"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <span>All Business Years</span>
                    <span className="text-[11px] text-zinc-400">{totalRecords.toLocaleString()}</span>
                  </button>

                  {yearsList.map((y) => {
                    const isSelected = selectedYear === y.year;
                    return (
                      <button
                        key={y.year}
                        type="button"
                        onClick={() => {
                          setSelectedYear(y.year);
                          setIsYearDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded font-mono transition cursor-pointer ${
                          isSelected
                            ? "bg-[#714b67]/10 dark:bg-[#714b67]/25 text-[#714b67] dark:text-purple-300 font-semibold"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>BY {y.year}</span>
                          {y.is_current && <span className="text-[10px] text-emerald-600 font-sans">(Current)</span>}
                        </span>
                        <span className="text-[11px] text-zinc-400 tabular-nums">{y.count.toLocaleString()}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Refresh Action */}
            <button
              type="button"
              onClick={handlePageRefresh}
              title="Refresh Workspace"
              className={`p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer ${
                isRefreshing ? "animate-spin text-white" : ""
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title="Toggle Theme"
              className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-white" />}
            </button>

            {/* User Profile Pill & Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-2 border-l border-white/20 cursor-pointer select-none group"
              >
                <span className="w-6 h-6 rounded bg-white text-[#714B67] font-bold flex items-center justify-center text-[10px] shadow-xs">
                  {initials}
                </span>
                <span className="hidden xl:inline text-xs font-semibold text-white truncate max-w-[120px]">
                  {user?.name || "Admin"}
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-48 rounded bg-white dark:bg-[#141722] text-[#1e293b] dark:text-zinc-100 border border-[#ced4da] dark:border-white/15 shadow-xl z-50 p-1 text-xs select-none animate-in fade-in duration-100">
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-white/[0.06]">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user?.name}</p>
                    <p className="text-[10px] text-zinc-400 font-mono">{user?.role || "Global Admin"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onNavigate("/settings");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.04] rounded transition text-left cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Workspace Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition text-left cursor-pointer font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Global Toast Alert */}
        {globalToast && (
          <div className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="bg-[#1e293b] text-white px-4 py-2.5 rounded shadow-xl border border-white/10 flex items-center gap-2.5 text-xs">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  globalToast.tone === "error"
                    ? "bg-rose-500"
                    : globalToast.tone === "info"
                    ? "bg-blue-400"
                    : "bg-[#017e84]"
                }`}
              />
              <span className="flex-1 leading-snug">{globalToast.message}</span>
              <button
                type="button"
                onClick={() => setGlobalToast(null)}
                className="text-zinc-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Main Routed View */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
};
