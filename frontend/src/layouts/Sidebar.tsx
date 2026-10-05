import React, { useEffect, useState } from "react";
import { UserProfile } from "@/features/auth";
import {
  NAVIGATION_GROUPS,
  NavigationItem,
} from "./navigation";
import {
  BarChart3,
  Calculator,
  CircleHelp,
  ClipboardList,
  Factory,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Palette,
  Ruler,
  Settings,
  Users,
  X,
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import {
  fetchAllMarketingRequestsApi,
  fetchCreativeBriefsApi,
  fetchStudioDielinesApi,
  fetchCostingEstimationsApi,
} from "@/infrastructure/api";
import { useBusinessYear } from "@/context/BusinessYearContext";
import { getRequestTrackType } from "@/features/sample-requests/utils/trackTypes";

export interface SidebarProps {
  user?: UserProfile | null;
  onLogout?: () => void;
  selectedPath: string;
  onSelectPath: (path: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const ACTIVE_ACCENT = "bg-[#714b67] dark:bg-purple-400";

const NAV_ICONS = {
  dashboard: LayoutDashboard,
  marketing: ClipboardList,
  creative: Palette,
  studio: Ruler,
  samp: FlaskConical,
  costing: Calculator,
  plant: Factory,
  analytics: BarChart3,
  members: Users,
  settings: Settings,
  help: CircleHelp,
} as const;

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  onLogout,
  selectedPath,
  onSelectPath,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { selectedYear } = useBusinessYear();
  const [dynamicBadges, setDynamicBadges] = useState<Record<string, number | string>>({});
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Live real-time sync with database events and window focus
  useEffect(() => {
    const handleRequestsChanged = () => {
      setReloadTrigger((prev) => prev + 1);
    };

    window.addEventListener("samp:requests-changed", handleRequestsChanged);
    window.addEventListener("focus", handleRequestsChanged);

    // Background polling fallback every 60 seconds (event-driven updates handle instant changes)
    const timer = setInterval(() => {
      setReloadTrigger((prev) => prev + 1);
    }, 60000);

    return () => {
      window.removeEventListener("samp:requests-changed", handleRequestsChanged);
      window.removeEventListener("focus", handleRequestsChanged);
      clearInterval(timer);
    };
  }, []);

  // Sync live operational counts directly from database
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetchAllMarketingRequestsApi(selectedYear).catch(() => []),
      fetchCreativeBriefsApi().catch(() => []),
      fetchStudioDielinesApi().catch(() => []),
      fetchCostingEstimationsApi().catch(() => []),
    ]).then(([requests, briefs, dielines, costings]) => {
      if (!isMounted) return;

      // 1. Commercial Sample Requests (Strict separation: Only marketing_request track)
      const sampleRequests = requests.filter((r) => {
        const track = getRequestTrackType(r);
        if (track !== "marketing_request") return false;
        const s = String(r.status || "").toLowerCase().trim();
        return !(
          s.includes("dispatch") ||
          s.includes("close") ||
          s.includes("complete") ||
          s.includes("deal") ||
          s.includes("actual")
        );
      });

      // 2. Feasibility Checks (Strict separation: Only feasibility_check track)
      const feasRequests = requests.filter((r) => {
        const track = getRequestTrackType(r);
        if (track !== "feasibility_check") return false;
        const s = String(r.status || "").toLowerCase().trim();
        return !(s.includes("close") || s.includes("reject") || s.includes("complete"));
      });

      // 3. Program Planning (Strict separation: Only program_planning track)
      const programRequests = requests.filter((r) => {
        const track = getRequestTrackType(r);
        if (track !== "program_planning") return false;
        const s = String(r.status || "").toLowerCase().trim();
        return !(s.includes("close") || s.includes("dispatch"));
      });

      const inSampling = requests.filter((r) => {
        const track = getRequestTrackType(r);
        if (track !== "marketing_request") return false;
        const s = String(r.status || "").toLowerCase().trim();
        return (
          s === "in_sampling" ||
          s === "sampling_completed" ||
          s.includes("sampling review") ||
          s.includes("in fabrication") ||
          s.includes("in sampling")
        );
      }).length;

      // Real live DB counts (no artificial hardcoded Math.max)
      const samplingCount = sampleRequests.length;
      const pendingFeasCount = feasRequests.length;
      const programCount = programRequests.length;
      const totalMarketingCount = samplingCount + pendingFeasCount + programCount;

      // SAMP Lab workload breakdown:
      const sampFeasPending = feasRequests.filter((r) => !r.samplingFeasibilityResponse).length;
      const sampTotalActive = inSampling + sampFeasPending + programCount;

      // Creative & Studio workload breakdown:
      const creativeDesignCount = requests.filter((r) =>
        (r.requestTypes || []).includes("design") || String(r.status || "").toLowerCase().includes("creative")
      ).length + briefs.length;
      const creativeSamplingCount = requests.filter((r) =>
        (r.requestTypes || []).includes("sample") || (r.requestTypes || []).includes("mockup") || r.mockupRequired === "Yes"
      ).length;

      setDynamicBadges({
        marketing: totalMarketingCount,
        sampling: samplingCount,
        pendingFeas: pendingFeasCount,
        programs: programCount,
        creative: briefs.length + creativeDesignCount,
        creativeDesign: creativeDesignCount,
        creativeSampling: creativeSamplingCount,
        studio: dielines.length,
        studioArtwork: dielines.length,
        samp: sampTotalActive,
        sampOverview: sampTotalActive,
        sampSampling: inSampling,
        sampFeasibility: sampFeasPending,
        sampPrograms: programCount,
        costing: costings.length,
      });
    });
    return () => { isMounted = false; };
  }, [selectedPath, selectedYear, reloadTrigger]);

  // Escape to close mobile
  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onCloseMobile) onCloseMobile();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileOpen]);

  const handleItemClick = (item: NavigationItem) => {
    onSelectPath(item.path);
    if (onCloseMobile) onCloseMobile();
  };

  const isItemActive = (item: NavigationItem) => {
    if (selectedPath === item.path) return true;
    if (selectedPath.startsWith(`${item.path}/`)) return true;
    if (
      item.aliases &&
      item.aliases.some(
        (alias) => selectedPath === alias || selectedPath.startsWith(`${alias}/`)
      )
    ) return true;
    return false;
  };

  const initials = (user?.name || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel = user?.sub_role || user?.role || "Global Admin";

  const renderNavContent = (isDrawer = false) => (
    <div className="flex flex-col h-full select-none bg-white dark:bg-[#12141d] border-r border-[#e2e8f0] dark:border-white/[0.08]">

      {/* ── Brand Header ─────────────────────────────── */}
      <div className="flex items-center justify-between h-[60px] px-5 shrink-0 border-b border-[#e2e8f0] dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <img
            src={logoImg}
            alt="Navneet"
            className="h-9 w-auto max-w-[155px] object-contain object-left"
          />
        </div>
        {isDrawer && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="h-8 w-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.07] transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Navigation Groups ─────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-3.5 space-y-5 px-3">
        {NAVIGATION_GROUPS.map((group, gIdx) => (
          <div key={group.groupTitle}>
            {/* Inter-group divider */}
            {gIdx > 0 && (
              <div className="mx-2 mb-3 h-px bg-zinc-200/80 dark:bg-white/[0.06]" />
            )}

            {/* Group label */}
            <div className="px-3 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
                {group.groupTitle}
              </span>
            </div>

            {/* Nav items */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isItemActive(item);
                const badgeValue =
                  dynamicBadges[item.id] !== undefined
                    ? String(dynamicBadges[item.id])
                    : item.badge;

                const Icon = NAV_ICONS[item.id as keyof typeof NAV_ICONS] || ClipboardList;

                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`group relative w-full flex items-center h-10 px-3 rounded-lg text-[13px] transition-colors duration-150 cursor-pointer text-left gap-3 focus-visible:outline-none ${
                        active
                          ? "bg-[#714b67]/10 dark:bg-[#714b67]/25 text-[#714b67] dark:text-purple-300 font-semibold shadow-2xs"
                          : "text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100/90 font-medium dark:text-zinc-300 dark:hover:text-white dark:hover:bg-white/[0.05]"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      {/* Active indicator bar */}
                      <span
                        className={`absolute left-0 inset-y-2 w-[3.5px] rounded-r-full transition-opacity duration-150 ${
                          active ? `${ACTIVE_ACCENT} opacity-100` : "opacity-0"
                        }`}
                      />

                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          active ? "text-[#714b67] dark:text-purple-300" : "text-zinc-400 dark:text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200"
                        }`}
                        strokeWidth={active ? 2.2 : 1.9}
                      />

                      {/* Title */}
                      <span className="flex-1 truncate">{item.title}</span>

                      {/* Badge */}
                      {badgeValue !== undefined && Number(badgeValue) > 0 && (
                        <span
                          className={`shrink-0 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full tabular-nums ${
                            active
                              ? "bg-[#714b67]/20 text-[#714b67] dark:bg-purple-500/25 dark:text-purple-200"
                              : "bg-zinc-100 text-zinc-600 dark:bg-white/[0.08] dark:text-zinc-300"
                          }`}
                        >
                          {badgeValue}
                        </span>
                      )}
                    </button>

                    {/* Interactive Sub-options when subItems are defined */}
                    {active && item.subItems && item.subItems.length > 0 ? (
                      <div className="pl-8 pr-2 py-1 space-y-1 animate-in fade-in duration-100">
                        {item.subItems.map((sub) => {
                          const isSubActive =
                            selectedPath === sub.path ||
                            (sub.path !== item.path && selectedPath.startsWith(sub.path));
                          const subBadge = sub.badgeKey ? dynamicBadges[sub.badgeKey] : undefined;

                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                onSelectPath(sub.path);
                                if (onCloseMobile) onCloseMobile();
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left ${
                                isSubActive
                                  ? "bg-[#714b67]/15 dark:bg-[#714b67]/30 text-[#714b67] dark:text-purple-300 font-semibold"
                                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/[0.04]"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                                    isSubActive ? "bg-[#714b67] dark:bg-purple-400" : "bg-zinc-300 dark:bg-zinc-600"
                                  }`}
                                />
                                <span className="truncate">{sub.title}</span>
                              </div>
                              {subBadge !== undefined && Number(subBadge) > 0 && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300">
                                  {subBadge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      active && item.subTeams && item.subTeams.length > 0 && (
                        <div className="pl-9 pr-2 py-1 space-y-1 animate-in fade-in duration-100">
                          {item.subTeams.map((sub, sIdx) => (
                            <div
                              key={sIdx}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-zinc-500 dark:text-zinc-400 hover:text-[#714b67] dark:hover:text-purple-300 hover:bg-zinc-100/70 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 shrink-0" />
                              <span className="truncate">{sub}</span>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom Operator Identity Card ───────────── */}
      <div className="p-3.5 px-4 border-t border-[#e2e8f0] dark:border-white/[0.06] shrink-0 bg-zinc-50/50 dark:bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#714b67] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
              {user?.name || "Parin D"}
            </span>
            <span className="block text-[11px] text-zinc-400 dark:text-zinc-500 truncate leading-tight font-mono mt-0.5">
              {roleLabel}
            </span>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Sign Out"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (Width: 268px - Ergonomic, spacious & readable) */}
      <aside className="hidden md:flex flex-col sticky top-0 h-screen shrink-0 z-30 w-[268px]">
        {renderNavContent(false)}
      </aside>

      {/* Mobile Off-Canvas Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 animate-smooth-backdrop"
            onClick={onCloseMobile}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[276px] shadow-xl flex flex-col animate-smooth-drawer">
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
