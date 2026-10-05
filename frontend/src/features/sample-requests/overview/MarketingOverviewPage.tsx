import React, { useMemo, useState } from "react";
import { SampleRequestItem } from "../types";
import {
  getRequestTrackType,
  getRequestTrackBadge,
  isOpenFeasibilityReview,
} from "../utils/trackTypes";
import { formatErpDate } from "../utils/dateUtils";
import {
  ClipboardList,
  ClipboardCheck,
  FolderGit2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  Download,
  Plus,
  ChevronRight,
  TrendingUp,
  Megaphone,
  Activity,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface MarketingOverviewPageProps {
  requests: SampleRequestItem[];
  isLoading: boolean;
  selectedYear: string;
  selectedPlant?: string;
  onOpenNewModal: (track?: "marketing_request" | "feasibility_check" | "program_planning") => void;
  onInspectRequest: (req: SampleRequestItem) => void;
  onExportCSV: () => void;
}

export const MarketingOverviewPage: React.FC<MarketingOverviewPageProps> = ({
  requests,
  isLoading,
  selectedYear,
  selectedPlant,
  onOpenNewModal,
  onInspectRequest,
  onExportCSV,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTrack, setFilterTrack] = useState<"all" | "marketing_request" | "feasibility_check" | "program_planning">("all");

  // Telemetry
  const stats = useMemo(() => {
    let samplingCount = 0;
    let feasibilityCount = 0;
    let pendingFeasAction = 0;
    let programCount = 0;
    let completedCount = 0;

    let activeTotal = 0;
    requests.forEach((r) => {
      const status = String(r.status || "").toLowerCase();
      if (status.includes("sampling requested") || status.includes("converted to sampling") || r.convertedSampleRequestId) {
        return;
      }
      activeTotal++;
      const track = getRequestTrackType(r);
      if (track === "marketing_request") samplingCount++;
      if (track === "feasibility_check") {
        feasibilityCount++;
        if (isOpenFeasibilityReview(r)) pendingFeasAction++;
      }
      if (track === "program_planning") programCount++;
      if (status.includes("dispatch") || status.includes("deal") || status.includes("close") || status.includes("approved")) {
        completedCount++;
      }
    });

    return { total: activeTotal, samplingCount, feasibilityCount, pendingFeasAction, programCount, completedCount };
  }, [requests]);

  // Recent activity feed
  const filteredFeed = useMemo(() => {
    return requests.filter((r) => {
      const status = String(r.status || "").toLowerCase();
      if (status.includes("sampling requested") || status.includes("converted to sampling") || r.convertedSampleRequestId) {
        return false;
      }
      if (filterTrack !== "all" && getRequestTrackType(r) !== filterTrack) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        return (
          (r.srNumber || "").toLowerCase().includes(q) ||
          (r.materialCode || "").toLowerCase().includes(q) ||
          (r.productDescription || "").toLowerCase().includes(q) ||
          (r.customer || "").toLowerCase().includes(q) ||
          (r.programName || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requests, filterTrack, searchTerm]);

  // Pending feasibility decisions (needs marketing action)
  const pendingDecisions = useMemo(() =>
    requests.filter((r) =>
      getRequestTrackType(r) === "feasibility_check" &&
      r.samplingFeasibilityResponse &&
      !r.marketingDecision
    ).slice(0, 4)
  , [requests]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8F9FA] dark:bg-[#0b0c10] p-6 space-y-5">

      {/* ── Identity Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Megaphone className="w-4 h-4 text-[#714B67]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#714B67]">
              Marketing HQ — Sample Intake Command
            </span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded bg-[#714B67]/10 text-[#714B67] border border-[#714B67]/20">
              FY {selectedYear}
            </span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Overview Dashboard
          </h1>
          <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-0.5">
            Sampling, Feasibility NPD, and Seasonal Program requests across all customer accounts.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenNewModal("feasibility_check")}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#714B67] hover:bg-[#5a3a52] text-white text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Request</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">

        {/* Total */}
        <button
          type="button"
          onClick={() => setFilterTrack("all")}
          className={`p-4 rounded-xl border text-left transition cursor-pointer shadow-2xs ${
            filterTrack === "all"
              ? "bg-white dark:bg-[#12141d] border-[#714B67] ring-1 ring-[#714B67]/20"
              : "bg-white dark:bg-[#12141d] border-[#CED4DA] dark:border-white/[0.08] hover:border-neutral-300"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Total Intake</span>
            <Activity className="w-3.5 h-3.5 text-[#714B67]" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {isLoading ? "—" : stats.total}
          </div>
          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">All streams</div>
        </button>

        {/* Sampling */}
        <button
          type="button"
          onClick={() => navigate("/sample-requests/sampling")}
          className="p-4 rounded-xl border border-[#CED4DA] dark:border-white/[0.08] bg-white dark:bg-[#12141d] hover:border-[#017E84] text-left transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Sampling</span>
            <ClipboardList className="w-3.5 h-3.5 text-[#017E84] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {isLoading ? "—" : stats.samplingCount}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[10px] text-neutral-400 font-mono">Notebooks & paper</span>
            <ChevronRight className="w-3 h-3 text-neutral-300 group-hover:text-[#017E84] transition-colors" />
          </div>
        </button>

        {/* Feasibility */}
        <button
          type="button"
          onClick={() => navigate("/sample-requests/feasibility")}
          className="p-4 rounded-xl border border-[#CED4DA] dark:border-white/[0.08] bg-white dark:bg-[#12141d] hover:border-amber-500 text-left transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Feasibility</span>
            <ClipboardCheck className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {isLoading ? "—" : stats.feasibilityCount}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className={`text-[10px] font-mono font-semibold ${stats.pendingFeasAction > 0 ? "text-amber-600 dark:text-amber-400" : "text-neutral-400"}`}>
              {stats.pendingFeasAction} pending
            </span>
            <ChevronRight className="w-3 h-3 text-neutral-300 group-hover:text-amber-500 transition-colors" />
          </div>
        </button>

        {/* Programs */}
        <button
          type="button"
          onClick={() => navigate("/sample-requests/programs")}
          className="p-4 rounded-xl border border-[#CED4DA] dark:border-white/[0.08] bg-white dark:bg-[#12141d] hover:border-indigo-500 text-left transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Programs</span>
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {isLoading ? "—" : stats.programCount}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[10px] text-neutral-400 font-mono">BTS / Retail</span>
            <ChevronRight className="w-3 h-3 text-neutral-300 group-hover:text-indigo-500 transition-colors" />
          </div>
        </button>

        {/* Completed */}
        <div className="p-4 rounded-xl border border-[#CED4DA] dark:border-white/[0.08] bg-white dark:bg-[#12141d] shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {isLoading ? "—" : stats.completedCount}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            Dispatched & approved
          </div>
        </div>
      </div>

      {/* ── Two-column: Workstreams + Pending Decisions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Workstreams (3/5) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-zinc-300 font-mono">
              Dedicated Workstreams
            </span>
          </div>

          {/* Sampling */}
          <div
            onClick={() => navigate("/sample-requests/sampling")}
            className="group flex items-center justify-between p-4 bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] hover:border-[#017E84] hover:shadow-sm transition cursor-pointer overflow-hidden relative"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#017E84] rounded-l-xl" />
            <div className="pl-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-teal-50 dark:bg-teal-950/40 text-[#017E84] dark:text-teal-300 uppercase">
                  Stream 1
                </span>
                <span className="text-[10px] font-mono text-neutral-400">{stats.samplingCount} requests</span>
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-[#017E84] transition-colors">
                Sample Requests Pipeline
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                Notebooks, office stationery, books — Creative, CAD Dieline, Costing, and Plant staging.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 pl-4">
              <span className="text-xs font-semibold text-[#017E84] font-mono whitespace-nowrap">Open Desk</span>
              <ArrowRight className="w-4 h-4 text-[#017E84] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Feasibility */}
          <div
            onClick={() => navigate("/sample-requests/feasibility")}
            className="group flex items-center justify-between p-4 bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] hover:border-amber-500 hover:shadow-sm transition cursor-pointer overflow-hidden relative"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-xl" />
            <div className="pl-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 uppercase">
                  Stream 2
                </span>
                {stats.pendingFeasAction > 0 && (
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                    {stats.pendingFeasAction} Pending Verdict
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-amber-600 transition-colors">
                Technical Feasibility Checks
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                Custom categories, unusual GSM, specialty binding. Track SAMP Lab sign-offs and finalize commercial approval.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 pl-4">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-mono whitespace-nowrap">Open Desk</span>
              <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Programs */}
          <div
            onClick={() => navigate("/sample-requests/programs")}
            className="group flex items-center justify-between p-4 bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] hover:border-indigo-500 hover:shadow-sm transition cursor-pointer overflow-hidden relative"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-xl" />
            <div className="pl-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 uppercase">
                  Stream 3
                </span>
                <span className="text-[10px] font-mono text-neutral-400">{stats.programCount} campaigns</span>
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                Seasonal Program Planning
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                BTS, Corporate Retail, Export — multi-SKU matrices with automated batching and plant capacity routing.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 pl-4">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 font-mono whitespace-nowrap">Open Desk</span>
              <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Pending Marketing Decisions (2/5) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#F1F5F9] dark:border-white/[0.05]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-bold text-neutral-900 dark:text-white">Needs Your Decision</span>
              {pendingDecisions.length > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                  {pendingDecisions.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate("/sample-requests/feasibility")}
              className="text-xs font-mono font-semibold text-[#714B67] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-12 rounded-lg bg-neutral-100 dark:bg-zinc-800/60 animate-pulse" />)}
            </div>
          ) : pendingDecisions.length === 0 ? (
            <div className="p-8 flex flex-col items-center text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
              <p className="text-xs text-neutral-500 dark:text-zinc-400 font-mono">
                No pending decisions! All SAMP verdicts have been reviewed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9] dark:divide-white/[0.04]">
              {pendingDecisions.map((req) => {
                const verdict = req.samplingFeasibilityResponse;
                return (
                  <div
                    key={req.id}
                    onClick={() => onInspectRequest(req)}
                    className="flex items-center justify-between px-5 py-3 hover:bg-amber-50/40 dark:hover:bg-amber-950/10 transition cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[11px] text-[#017E84]">
                          {req.materialCode || req.srNumber}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          verdict === "Yes"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : verdict === "No"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}>
                          SAMP: {verdict}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-500 dark:text-zinc-400 truncate mt-0.5">
                        {req.customer}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40">
                        Decide
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && stats.pendingFeasAction > pendingDecisions.length && (
            <div
              onClick={() => navigate("/sample-requests/feasibility")}
              className="flex items-center justify-between px-5 py-2.5 bg-amber-50/60 dark:bg-amber-950/20 border-t border-amber-200 dark:border-amber-900/30 cursor-pointer hover:bg-amber-50 transition"
            >
              <span className="text-xs text-amber-800 dark:text-amber-300 font-mono font-semibold">
                +{stats.pendingFeasAction - pendingDecisions.length} more pending
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
          )}
        </div>
      </div>

      {/* ── Live Intake Feed ── */}
      <div className="bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs overflow-hidden">

        {/* Feed Header */}
        <div className="px-5 py-3 border-b border-[#F1F5F9] dark:border-white/[0.05] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#714B67]" />
            <span className="text-xs font-bold text-neutral-900 dark:text-white">Live Intake Feed</span>
            <span className="text-[10px] text-neutral-400 font-mono">({filteredFeed.length})</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Track filter chips */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-white/[0.05] p-0.5 rounded-lg text-[11px]">
              {(["all", "marketing_request", "feasibility_check", "program_planning"] as const).map((track) => (
                <button
                  key={track}
                  type="button"
                  onClick={() => setFilterTrack(track)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    filterTrack === track
                      ? "bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-2xs"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  {track === "all" ? "All" : track === "marketing_request" ? "Sampling" : track === "feasibility_check" ? "Feasibility" : "Programs"}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="SR#, SKU, Customer…"
                className="w-48 pl-8 pr-3 py-1.5 rounded-lg border border-[#CED4DA] dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-900 text-xs text-neutral-800 dark:text-zinc-200 focus:outline-none focus:border-[#714B67]"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[460px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-neutral-50 dark:bg-zinc-900/60 text-neutral-500 dark:text-zinc-400 font-mono uppercase text-[10.5px] sticky top-0 z-10 border-b border-neutral-200 dark:border-white/[0.06]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Stream</th>
                <th className="py-2.5 px-4 font-semibold">Code</th>
                <th className="py-2.5 px-4 font-semibold">Customer</th>
                <th className="py-2.5 px-4 font-semibold">Description</th>
                <th className="py-2.5 px-4 font-semibold">Target Date</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/70 dark:divide-white/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400 font-mono text-xs">
                    Loading…
                  </td>
                </tr>
              ) : filteredFeed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400 font-mono text-xs">
                    No requests match the active filter.
                  </td>
                </tr>
              ) : (
                filteredFeed.slice(0, 30).map((r) => {
                  const trackBadge = getRequestTrackBadge(r);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => onInspectRequest(r)}
                      className="hover:bg-neutral-50/80 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${trackBadge.className}`}>
                          {trackBadge.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#017E84]">
                        {r.srNumber}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-neutral-800 dark:text-zinc-200">
                        {r.customer || "—"}
                      </td>
                      <td className="py-2.5 px-4 text-neutral-600 dark:text-zinc-300 max-w-[240px] truncate">
                        {r.productDescription || r.programName || "—"}
                      </td>
                      <td className="py-2.5 px-4 text-neutral-500 font-mono text-[10.5px]">
                        {r.sampleRequiredDate ? formatErpDate(r.sampleRequiredDate) : (r.dateRequestCreated ? formatErpDate(r.dateRequestCreated) : "—")}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300">
                          {r.status || "Draft"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="text-xs font-semibold text-[#714B67] dark:text-purple-300 hover:underline cursor-pointer">
                          Inspect →
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredFeed.length > 30 && (
          <div className="px-5 py-2.5 border-t border-neutral-200 dark:border-white/[0.06] bg-neutral-50/50 dark:bg-white/[0.01] text-center">
            <span className="text-[10.5px] text-neutral-400 font-mono">
              Showing first 30 of {filteredFeed.length}. Open dedicated stream desks for full views & bulk actions.
            </span>
          </div>
        )}
      </div>

    </div>
  );
};

export default MarketingOverviewPage;
