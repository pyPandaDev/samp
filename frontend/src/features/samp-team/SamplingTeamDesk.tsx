import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { UserProfile } from "@/features/auth";
import { useBusinessYear } from "@/context/BusinessYearContext";
import { SampleRequestItem } from "@/features/sample-requests/types";
import { fetchAllMarketingRequestsApi } from "@/features/sample-requests/api";
import { SampFeasibilityReviewPage } from "./feasibility/SampFeasibilityReviewPage";
import { SamplingProgramPlanningView } from "./programs/SamplingProgramPlanningView";
import { ProgramPlanningInspectorModal } from "@/features/sample-requests/programs/components/ProgramPlanningInspectorModal";
import { formatErpDate } from "@/features/sample-requests/utils/dateUtils";
import {
  FlaskConical,
  CheckCircle2,
  ArrowRight,
  ClipboardCheck,
  Layers,
  Clock,
  XCircle,
  AlertTriangle,
  User,
  Zap,
  TrendingUp,
  Activity,
  Beaker,
  BadgeCheck,
  Package,
} from "lucide-react";

export type SampSubView = "overview" | "sampling" | "feasibility" | "programs";

export interface SamplingTeamDeskProps {
  user?: UserProfile | null;
}



export const SamplingTeamDesk: React.FC<SamplingTeamDeskProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isAdmin =
    String(user?.role || "").toLowerCase() === "admin" ||
    user?.userid === "admin" ||
    user?.role === "Administrator";

  const { selectedYear } = useBusinessYear();

  const [selectedPlant, setSelectedPlant] = useState<string>(() => {
    try {
      return localStorage.getItem("samp_active_plant") || "ALL";
    } catch {
      return "ALL";
    }
  });

  useEffect(() => {
    const handlePlantChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ plant: string; label?: string }>;
      if (customEvent.detail?.plant) {
        setSelectedPlant(customEvent.detail.plant);
      }
    };
    window.addEventListener("app:plant-changed", handlePlantChanged);
    return () => window.removeEventListener("app:plant-changed", handlePlantChanged);
  }, []);

  const [requests, setRequests] = useState<SampleRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProgramForReview, setSelectedProgramForReview] = useState<SampleRequestItem | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const activeView: SampSubView = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes("/feasibility")) return "feasibility";
    if (path.includes("/sampling")) return "sampling";
    if (path.includes("/programs")) return "programs";

    const queryView = searchParams.get("view")?.toLowerCase();
    if (queryView === "feasibility") return "feasibility";
    if (queryView === "sampling") return "sampling";
    if (queryView === "programs") return "programs";

    return "overview";
  }, [location.pathname, searchParams]);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const merged = await fetchAllMarketingRequestsApi(selectedYear);
      setRequests(merged);
    } catch (err) {
      console.error("Failed to load sampling team data:", err);
      showToast("Failed to fetch sampling work data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, showToast]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  useEffect(() => {
    const handleChange = () => loadRequests();
    const handleRefresh = () => void loadRequests().finally(() => window.dispatchEvent(new Event("app:refresh-complete")));
    window.addEventListener("samp:requests-changed", handleChange);
    window.addEventListener("app:refresh-requested", handleRefresh);
    return () => {
      window.removeEventListener("samp:requests-changed", handleChange);
      window.removeEventListener("app:refresh-requested", handleRefresh);
    };
  }, [loadRequests]);

  const uniquePlants = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => { if (r.targetPlant?.trim()) set.add(r.targetPlant.trim()); });
    return Array.from(set).sort();
  }, [requests]);

  const uniqueCustomers = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => { if (r.customer?.trim()) set.add(r.customer.trim()); });
    return Array.from(set).sort();
  }, [requests]);

  // All feasibility requests
  const feasibilityReqs = useMemo(() => requests.filter((r) => {
    const mode = String(r.creationMode || "").toLowerCase();
    const kind = String(r.requestKind || "").toLowerCase();
    const idStr = String(r.id || "");
    const status = String(r.status || "").toLowerCase();
    const isConverted = status.includes("sampling requested") || status.includes("converted to sampling") || r.convertedSampleRequestId;

    if (isConverted) return false;

    return kind === "feasibility" || idStr.startsWith("feasibility-") || mode === "feasibility_check" || Boolean(r.feasibilityType);
  }), [requests]);

  // Derived counts for sub-tab badges
  const pendingFeasibilityCount = useMemo(() =>
    feasibilityReqs.filter((r) => !r.samplingFeasibilityResponse).length
  , [feasibilityReqs]);

  // Overview metrics
  const metrics = useMemo(() => {
    const unclaimed = feasibilityReqs.filter((r) => !r.takenBySamp && !r.samplingFeasibilityResponse).length;
    const myActive = feasibilityReqs.filter((r) =>
      r.takenBySamp && user?.name &&
      r.takenBySamp.toLowerCase() === user.name.toLowerCase() &&
      !r.samplingFeasibilityResponse
    ).length;
    const evaluated = feasibilityReqs.filter((r) => Boolean(r.samplingFeasibilityResponse)).length;
    const awaitingMarketing = feasibilityReqs.filter((r) =>
      r.samplingFeasibilityResponse && !r.marketingDecision
    ).length;
    return { unclaimed, myActive, evaluated, awaitingMarketing, total: feasibilityReqs.length };
  }, [feasibilityReqs, user?.name]);

  // Recent verdicts (last 5)
  const recentVerdicts = useMemo(() =>
    feasibilityReqs
      .filter((r) => r.samplingFeasibilityResponse)
      .slice(0, 6)
  , [feasibilityReqs]);

  // Active tasks (claimed, no verdict yet)
  const activeTasks = useMemo(() =>
    feasibilityReqs.filter((r) => r.takenBySamp && !r.samplingFeasibilityResponse).slice(0, 5)
  , [feasibilityReqs]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FA] dark:bg-[#0b0c10] select-text">
      {/* ── Toast ── */}
      {toastMessage && (
        <div className="fixed top-16 right-5 z-[70] flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xl text-xs font-semibold border border-zinc-800 dark:border-zinc-200/80 max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}


      {/* ── Active View Body ── */}

      {activeView === "feasibility" ? (
        <SampFeasibilityReviewPage
          requests={requests}
          isLoading={isLoading}
          selectedYear={selectedYear}
          selectedPlant={selectedPlant}
          uniquePlants={uniquePlants}
          uniqueCustomers={uniqueCustomers}
          user={user}
          isAdmin={isAdmin}
          onRefresh={loadRequests}
          showToast={showToast}
        />
      ) : activeView === "sampling" ? (
        /* ── Sampling Review Placeholder ── */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F8F9FA] dark:bg-[#0b0c10]">
          <div className="max-w-md p-6 bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-[#714B67] dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Sampling Review</h2>
              <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-1 leading-relaxed">
                PMT sampling queue — fabrication, die-cutting, wiro binding, and customer proofing — is being modularized.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/samp-team-work/feasibility")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#714B67] hover:bg-[#5a3a52] text-white text-xs font-bold font-mono transition cursor-pointer shadow-xs"
            >
              <span>Open Feasibility Review</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : activeView === "programs" ? (
        <SamplingProgramPlanningView
          requests={requests}
          isLoading={isLoading}
          selectedPlant={selectedPlant}
          uniquePlants={uniquePlants}
          user={user}
          isAdmin={isAdmin}
          onInspectRequest={(req) => setSelectedProgramForReview(req)}
          onRefresh={loadRequests}
          showToast={showToast}
        />
      ) : (
        /* ══════════════════════════════════════════════════════════════════
           OVERVIEW — SAMPLING LAB WORKBENCH DASHBOARD
           Sampling-specific: no marketing patterns. Shows lab state only.
        ══════════════════════════════════════════════════════════════════ */
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ── Lab Identity Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Beaker className="w-4 h-4 text-[#017E84]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#017E84]">
                  SAMP Lab — Technical Evaluation Workbench
                </span>
                <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300/40">Live</span>
              </div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                {user?.name ? `Welcome, ${user.name.split(" ")[0]}` : "Sampling Operations"}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-0.5">
                Claim tasks from Marketing, evaluate technical feasibility, and submit Yes / No / Maybe verdicts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/samp-team-work/feasibility")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#714B67] hover:bg-[#5a3a52] text-white text-xs font-bold font-mono transition cursor-pointer shadow-xs shrink-0"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Open Evaluation Queue</span>
            </button>
          </div>

          {/* ── KPI Stat Ribbon (Lab Context) ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Unclaimed Tasks */}
            <button
              type="button"
              onClick={() => navigate("/samp-team-work/feasibility")}
              className="bg-white dark:bg-[#12141d] rounded-xl border border-amber-200 dark:border-amber-900/40 p-4 text-left hover:border-amber-400 transition shadow-2xs group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Needs Claim</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-amber-900 dark:text-amber-200">
                {isLoading ? "—" : metrics.unclaimed}
              </div>
              <div className="text-[10px] text-amber-700/80 dark:text-amber-400/60 font-mono mt-0.5">
                Unclaimed from Marketing
              </div>
            </button>

            {/* My Active */}
            <button
              type="button"
              onClick={() => navigate("/samp-team-work/feasibility")}
              className="bg-white dark:bg-[#12141d] rounded-xl border border-sky-200 dark:border-sky-900/40 p-4 text-left hover:border-sky-400 transition shadow-2xs cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">My Tasks</span>
                <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-sky-900 dark:text-sky-200">
                {isLoading ? "—" : metrics.myActive}
              </div>
              <div className="text-[10px] text-sky-700/80 dark:text-sky-400/60 font-mono mt-0.5">
                Claimed, pending verdict
              </div>
            </button>

            {/* Evaluated */}
            <div className="bg-white dark:bg-[#12141d] rounded-xl border border-emerald-200 dark:border-emerald-900/40 p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Evaluated</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-900 dark:text-emerald-200">
                {isLoading ? "—" : metrics.evaluated}
              </div>
              <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/60 font-mono mt-0.5">
                Verdict submitted
              </div>
            </div>

            {/* Awaiting Marketing Decision */}
            <div className="bg-white dark:bg-[#12141d] rounded-xl border border-[#714B67]/25 dark:border-purple-900/40 p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#714B67] dark:text-purple-400">Awaiting MKT</span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-[#714B67] dark:text-purple-400" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-[#714B67] dark:text-purple-300">
                {isLoading ? "—" : metrics.awaitingMarketing}
              </div>
              <div className="text-[10px] text-[#714B67]/70 dark:text-purple-400/60 font-mono mt-0.5">
                Marketing sign-off needed
              </div>
            </div>
          </div>

          {/* ── Main Two-Column Content ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* Active Tasks in Lab (3/5 width) */}
            <div className="lg:col-span-3 bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#F1F5F9] dark:border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-[#017E84]" />
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">Active Lab Evaluations</span>
                  {activeTasks.length > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                      {activeTasks.length}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/samp-team-work/feasibility")}
                  className="text-xs font-mono font-semibold text-[#017E84] hover:underline flex items-center gap-1"
                >
                  <span>Full Queue</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {isLoading ? (
                <div className="p-5 space-y-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-12 rounded-lg bg-neutral-100 dark:bg-zinc-800/60 animate-pulse" />
                  ))}
                </div>
              ) : activeTasks.length === 0 ? (
                <div className="p-8 flex flex-col items-center text-center">
                  <ClipboardCheck className="w-8 h-8 text-neutral-300 dark:text-zinc-600 mb-2" />
                  <p className="text-xs text-neutral-500 dark:text-zinc-400 font-mono">
                    {metrics.unclaimed > 0
                      ? `${metrics.unclaimed} unclaimed task${metrics.unclaimed > 1 ? "s" : ""} waiting in the queue`
                      : "No active evaluations. All tasks evaluated!"}
                  </p>
                  {metrics.unclaimed > 0 && (
                    <button
                      type="button"
                      onClick={() => navigate("/samp-team-work/feasibility")}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-[#714B67] text-white text-xs font-bold font-mono hover:bg-[#5a3a52] transition"
                    >
                      Claim a Task
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[#F1F5F9] dark:divide-white/[0.04]">
                  {activeTasks.map((req) => {
                    const isMyTask = req.takenBySamp && user?.name &&
                      req.takenBySamp.toLowerCase() === user.name.toLowerCase();
                    const category = req.customFeasibilityType ||
                      (req.feasibilityType ? req.feasibilityType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Evaluation");

                    return (
                      <div
                        key={req.id}
                        onClick={() => navigate("/samp-team-work/feasibility")}
                        className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isMyTask ? "bg-purple-50 dark:bg-purple-950/50" : "bg-sky-50 dark:bg-sky-950/50"
                          }`}>
                            <FlaskConical className={`w-4 h-4 ${isMyTask ? "text-[#714B67]" : "text-sky-600 dark:text-sky-400"}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-[#017E84]">
                                {req.materialCode || req.srNumber}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400">
                                {category}
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-600 dark:text-zinc-400 truncate">
                              {req.customer} · by <span className={isMyTask ? "text-[#714B67] font-semibold" : "text-neutral-500"}>{req.takenBySamp}</span>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {req.sampleRequiredDate && (
                            <span className="text-[10px] font-mono text-neutral-400 hidden sm:block">
                              Due: {formatErpDate(req.sampleRequiredDate)}
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900/40">
                            In Review
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Unclaimed queue banner */}
              {!isLoading && metrics.unclaimed > 0 && (
                <div
                  onClick={() => navigate("/samp-team-work/feasibility")}
                  className="flex items-center justify-between px-5 py-2.5 bg-amber-50/60 dark:bg-amber-950/20 border-t border-amber-200 dark:border-amber-900/30 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/30 transition"
                >
                  <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 font-mono font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{metrics.unclaimed} task{metrics.unclaimed > 1 ? "s" : ""} waiting to be claimed</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
              )}
            </div>

            {/* Recent Verdicts Panel (2/5 width) */}
            <div className="lg:col-span-2 bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#F1F5F9] dark:border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-[#714B67]" />
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">Recent Verdicts</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">{recentVerdicts.length} shown</span>
              </div>

              {isLoading ? (
                <div className="p-4 space-y-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-10 rounded-lg bg-neutral-100 dark:bg-zinc-800/60 animate-pulse" />
                  ))}
                </div>
              ) : recentVerdicts.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-xs text-neutral-400 font-mono">No verdicts submitted yet this session.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#F1F5F9] dark:divide-white/[0.04]">
                  {recentVerdicts.map((req) => {
                    const verdict = req.samplingFeasibilityResponse;
                    return (
                      <div
                        key={req.id}
                        onClick={() => navigate("/samp-team-work/feasibility")}
                        className="flex items-center justify-between px-5 py-2.5 hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-[11px] text-[#017E84] truncate">
                            {req.materialCode || req.srNumber}
                          </div>
                          <div className="text-[10px] text-neutral-500 dark:text-zinc-400 truncate">
                            {req.customer}
                          </div>
                        </div>
                        <div className="shrink-0 ml-2">
                          {verdict === "Yes" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-900/40">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Yes
                            </span>
                          ) : verdict === "No" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-300 dark:border-rose-900/40">
                              <XCircle className="w-2.5 h-2.5" /> No
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-900/40">
                              <AlertTriangle className="w-2.5 h-2.5" /> Maybe
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Workflow Guide Strip ── */}
          <div className="bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs p-5">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-xs font-bold text-neutral-700 dark:text-zinc-300 uppercase tracking-wider font-mono">
                Sampling Team Workflow
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                {
                  step: "01",
                  title: "Marketing Requests",
                  desc: "Marketing submits a feasibility check with product specs, reference images, and target date.",
                  color: "text-neutral-600 dark:text-zinc-400",
                  bg: "bg-neutral-50 dark:bg-zinc-900/60",
                  border: "border-neutral-200 dark:border-zinc-700",
                },
                {
                  step: "02",
                  title: "SAMP Claims Task",
                  desc: "A SAMP engineer claims the task from the queue and begins technical evaluation in the lab.",
                  color: "text-sky-700 dark:text-sky-400",
                  bg: "bg-sky-50/50 dark:bg-sky-950/20",
                  border: "border-sky-200 dark:border-sky-900/40",
                },
                {
                  step: "03",
                  title: "Submit Verdict",
                  desc: "Engineer submits Yes / Maybe / No with a detailed technical assessment remark.",
                  color: "text-[#017E84] dark:text-teal-400",
                  bg: "bg-teal-50/50 dark:bg-teal-950/20",
                  border: "border-teal-200 dark:border-teal-900/40",
                },
                {
                  step: "04",
                  title: "Marketing Decides",
                  desc: "Marketing reviews the verdict and either accepts (converting to sample) or drops the request.",
                  color: "text-[#714B67] dark:text-purple-400",
                  bg: "bg-purple-50/50 dark:bg-purple-950/20",
                  border: "border-purple-200 dark:border-purple-900/40",
                },
              ].map((item) => (
                <div key={item.step} className={`p-3.5 rounded-lg border ${item.bg} ${item.border}`}>
                  <div className={`text-[11px] font-mono font-bold mb-1.5 ${item.color}`}>
                    Step {item.step} · {item.title}
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Sampling Team Program Planning Review Matrix Inspector Modal */}
      <ProgramPlanningInspectorModal
        request={selectedProgramForReview}
        isOpen={Boolean(selectedProgramForReview)}
        onClose={() => setSelectedProgramForReview(null)}
        onRefresh={loadRequests}
        mode="sampling"
        userRole={user?.role || "Sampling Specialist"}
        currentUser={user}
      />
    </div>
  );

};

export default SamplingTeamDesk;
