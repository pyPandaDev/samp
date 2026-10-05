import React, { useState, useMemo, useCallback } from "react";
import { UserProfile } from "@/features/auth";
import { SampleRequestItem } from "@/features/sample-requests/types";
import {
  cleanFeasibilityDescription,
  claimFeasibilityTaskApi,
  recordFeasibilitySampVerdictApi,
  recordFeasibilityViewedApi,
} from "@/features/sample-requests/api";
import { FeasibilityInspectorModal } from "@/features/sample-requests/components/FeasibilityInspectorModal";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatErpDate, formatLogDate } from "@/features/sample-requests/utils/dateUtils";
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ClipboardCheck,
  ExternalLink,
  RefreshCw,
  Check,
  UserCheck,
  ShieldCheck,
  LayoutGrid,
  List as ListIcon,
  Download,
  Copy,
  Eye,
  Filter,
  Sparkles,
  ChevronRight,
  User,
  ArrowUpRight,
  Building2,
  Star,
  ThumbsUp,
  Send,
} from "lucide-react";

export interface SampFeasibilityReviewPageProps {
  requests: SampleRequestItem[];
  isLoading: boolean;
  selectedYear: string;
  selectedPlant: string;
  uniquePlants: string[];
  uniqueCustomers: string[];
  user?: UserProfile | null;
  isAdmin: boolean;
  onRefresh: () => Promise<void>;
  showToast: (msg: string) => void;
}

type FeasibilityFilterTab =
  | "all"
  | "awaiting_claim"
  | "in_review"
  | "my_claimed"
  | "feasible"
  | "conditional"
  | "rejected"
  | "finalized";

export const SAMP_FEASIBILITY_KANBAN_COLUMNS: {
  id: string;
  label: string;
  bgTone: string;
  borderTone: string;
  accentTone: string;
}[] = [
  {
    id: "unclaimed",
    label: "1. Awaiting Claim",
    bgTone: "bg-amber-50/40 dark:bg-amber-950/20",
    borderTone: "border-amber-200/80 dark:border-amber-900/40",
    accentTone: "text-amber-700 dark:text-amber-400",
  },
  {
    id: "in_review",
    label: "2. Under Review (Lab)",
    bgTone: "bg-sky-50/40 dark:bg-sky-950/20",
    borderTone: "border-sky-200/80 dark:border-sky-900/40",
    accentTone: "text-sky-700 dark:text-sky-400",
  },
  {
    id: "verdict_rendered",
    label: "3. Verdict Rendered",
    bgTone: "bg-purple-50/40 dark:bg-purple-950/20",
    borderTone: "border-purple-200/80 dark:border-purple-900/40",
    accentTone: "text-[#714B67] dark:text-purple-300",
  },
  {
    id: "approved",
    label: "4. Feasible (Approved)",
    bgTone: "bg-emerald-50/40 dark:bg-emerald-950/20",
    borderTone: "border-emerald-200/80 dark:border-emerald-900/40",
    accentTone: "text-emerald-700 dark:text-emerald-400",
  },
  {
    id: "converted",
    label: "5. In Sampling Pipeline",
    bgTone: "bg-teal-50/40 dark:bg-teal-950/20",
    borderTone: "border-teal-200/80 dark:border-teal-900/40",
    accentTone: "text-teal-700 dark:text-teal-400",
  },
  {
    id: "rejected",
    label: "6. Dropped / Closed",
    bgTone: "bg-neutral-50 dark:bg-zinc-900/60",
    borderTone: "border-neutral-200 dark:border-zinc-800",
    accentTone: "text-neutral-700 dark:text-zinc-300",
  },
];

export const getSampFeasibilityKanbanColumn = (r: SampleRequestItem): string => {
  const hasVerdict = Boolean(r.samplingFeasibilityResponse);
  const dec = (r.marketingDecision || "").toLowerCase();
  const status = (r.status || "").toLowerCase();
  const isConverted =
    Boolean(r.convertedSrNumber || r.convertedSampleRequestId) ||
    status.includes("sampling requested") ||
    status.includes("converted to sampling");

  if (isConverted) return "converted";
  if (dec === "rejected" || status.includes("rejected") || status.includes("closed")) return "rejected";
  if (dec === "accepted" || status.includes("approved")) return "approved";
  if (hasVerdict) return "verdict_rendered";
  if (r.takenBySamp) return "in_review";
  return "unclaimed";
};

export const SampFeasibilityReviewPage: React.FC<SampFeasibilityReviewPageProps> = ({
  requests,
  isLoading,
  selectedYear,
  selectedPlant,
  uniquePlants,
  uniqueCustomers,
  user,
  isAdmin,
  onRefresh,
  showToast,
}) => {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [filterTab, setFilterTab] = useState<FeasibilityFilterTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [plantFilter, setPlantFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<SampleRequestItem | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [claimingId, setClaimingId] = useState<string | number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter requests to only feasibility checks
  const feasibilityRequests = useMemo(() => {
    return requests.filter((r) => {
      const mode = String(r.creationMode || "").toLowerCase();
      const kind = String(r.requestKind || "").toLowerCase();
      const mat = String(r.materialCode || "").toLowerCase();
      const sr = String(r.srNumber || "").toLowerCase();
      const idStr = String(r.id || "");
      return (
        kind === "feasibility" ||
        idStr.startsWith("feasibility-") ||
        mode === "feasibility_check" ||
        mode === "feasibility" ||
        mat.startsWith("fc-") ||
        sr.startsWith("fc-") ||
        sr.startsWith("fs-") ||
        Boolean(r.feasibilityType) ||
        Boolean(r.customFeasibilityType)
      );
    });
  }, [requests]);

  // Metric Ribbon Calculations (Enterprise Live KPI Counters)
  const metrics = useMemo(() => {
    const total = feasibilityRequests.length;
    const awaitingClaim = feasibilityRequests.filter(
      (r) => !r.takenBySamp && !r.samplingFeasibilityResponse
    ).length;
    const inReview = feasibilityRequests.filter(
      (r) => r.takenBySamp && !r.samplingFeasibilityResponse
    ).length;
    const myClaimed = feasibilityRequests.filter(
      (r) =>
        r.takenBySamp &&
        user?.name &&
        r.takenBySamp.toLowerCase() === user.name.toLowerCase() &&
        !r.samplingFeasibilityResponse
    ).length;
    const feasible = feasibilityRequests.filter(
      (r) => r.samplingFeasibilityResponse === "Yes"
    ).length;
    const conditional = feasibilityRequests.filter(
      (r) => r.samplingFeasibilityResponse === "Maybe"
    ).length;
    const rejected = feasibilityRequests.filter(
      (r) => r.samplingFeasibilityResponse === "No"
    ).length;

    // SLA On-time rate
    const evaluatedWithSla = feasibilityRequests.filter(
      (r) => Boolean(r.samplingFeasibilityResponse) && r.isRespondedOnTime !== null && r.isRespondedOnTime !== undefined
    );
    const onTimeCount = evaluatedWithSla.filter((r) => r.isRespondedOnTime === true).length;
    const slaPercent = evaluatedWithSla.length > 0 ? Math.round((onTimeCount / evaluatedWithSla.length) * 100) : 100;

    return {
      total,
      awaitingClaim,
      inReview,
      myClaimed,
      feasible,
      conditional,
      rejected,
      slaPercent,
    };
  }, [feasibilityRequests, user?.name]);

  // Tab count helper
  const tabCounts = useMemo(() => {
    return {
      all: feasibilityRequests.length,
      awaiting_claim: metrics.awaitingClaim,
      in_review: metrics.inReview,
      my_claimed: metrics.myClaimed,
      feasible: metrics.feasible,
      conditional: metrics.conditional,
      rejected: metrics.rejected,
      finalized: feasibilityRequests.filter((r) => Boolean(r.marketingDecision)).length,
    };
  }, [feasibilityRequests, metrics]);

  // Filtered requests based on active tab, search, and filters
  const filteredRequests = useMemo(() => {
    return feasibilityRequests.filter((r) => {
      // Tab filter
      if (filterTab === "awaiting_claim" && (r.takenBySamp || r.samplingFeasibilityResponse)) return false;
      if (filterTab === "in_review" && (!r.takenBySamp || r.samplingFeasibilityResponse)) return false;
      if (filterTab === "my_claimed") {
        if (!r.takenBySamp || r.samplingFeasibilityResponse) return false;
        if (!user?.name || r.takenBySamp.toLowerCase() !== user.name.toLowerCase()) return false;
      }
      if (filterTab === "feasible" && r.samplingFeasibilityResponse !== "Yes") return false;
      if (filterTab === "conditional" && r.samplingFeasibilityResponse !== "Maybe") return false;
      if (filterTab === "rejected" && r.samplingFeasibilityResponse !== "No") return false;
      if (filterTab === "finalized" && !r.marketingDecision) return false;

      // Customer filter
      if (customerFilter !== "all" && r.customer !== customerFilter) return false;

      // Plant filter
      if (plantFilter !== "all" && r.targetPlant !== plantFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesCode = (r.materialCode || "").toLowerCase().includes(term);
        const matchesSr = (r.srNumber || "").toLowerCase().includes(term);
        const matchesCust = (r.customer || "").toLowerCase().includes(term);
        const matchesDesc = (r.productDescription || "").toLowerCase().includes(term);
        const matchesEng = (r.takenBySamp || "").toLowerCase().includes(term);
        const matchesType = (r.customFeasibilityType || r.feasibilityType || "").toLowerCase().includes(term);
        return matchesCode || matchesSr || matchesCust || matchesDesc || matchesEng || matchesType;
      }

      return true;
    });
  }, [feasibilityRequests, filterTab, customerFilter, plantFilter, searchTerm, user?.name]);

  // Full Pipeline Requests for Kanban (unconstrained by stage filter tab)
  const kanbanRequests = useMemo(() => {
    return feasibilityRequests.filter((r) => {
      if (plantFilter !== "all") {
        const p = (r.targetPlant || "").toLowerCase();
        if (!p.includes(plantFilter.toLowerCase())) return false;
      }
      if (customerFilter !== "all" && r.customer !== customerFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesCode = (r.materialCode || "").toLowerCase().includes(term);
        const matchesSr = (r.srNumber || "").toLowerCase().includes(term);
        const matchesCust = (r.customer || "").toLowerCase().includes(term);
        const matchesDesc = (r.productDescription || "").toLowerCase().includes(term);
        const matchesEng = (r.takenBySamp || "").toLowerCase().includes(term);
        const matchesType = (r.customFeasibilityType || r.feasibilityType || "").toLowerCase().includes(term);
        return matchesCode || matchesSr || matchesCust || matchesDesc || matchesEng || matchesType;
      }
      return true;
    });
  }, [feasibilityRequests, customerFilter, plantFilter, searchTerm]);

  // Copy SR Number / Code
  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Inspect Request
  const handleOpenInspect = (req: SampleRequestItem) => {
    recordFeasibilityViewedApi(req.id).catch(() => {});
    setSelectedRequest(req);
    setIsInspectorOpen(true);
  };

  // 1-Click Inline Claim Task
  const handleInlineClaim = async (req: SampleRequestItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (claimingId) return;
    setClaimingId(req.id);
    try {
      const updated = await claimFeasibilityTaskApi(req.id);
      showToast(`Task ${req.materialCode || req.srNumber} claimed by ${user?.name || "you"}.`);
      await onRefresh();
    } catch (err) {
      console.error("Failed to claim task:", err);
      showToast(err instanceof Error ? err.message : "Failed to claim task");
    } finally {
      setClaimingId(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Request Code",
      "SR Number",
      "Customer",
      "Feasibility Category",
      "Target Date",
      "Claimed By (SAMP)",
      "Technical Verdict",
      "Verdict Remark",
      "Marketing Decision",
      "Created Date",
    ];

    const rows = filteredRequests.map((r) => [
      r.materialCode || "",
      r.srNumber || "",
      `"${(r.customer || "").replace(/"/g, '""')}"`,
      `"${(r.customFeasibilityType || r.feasibilityType || "New Category").replace(/"/g, '""')}"`,
      r.sampleRequiredDate || "",
      `"${(r.takenBySamp || "Unclaimed").replace(/"/g, '""')}"`,
      r.samplingFeasibilityResponse || "Pending",
      `"${(r.samplingFeasibilityRemark || "").replace(/"/g, '""')}"`,
      r.marketingDecision || "Pending",
      r.dateRequestCreated || r.createdAt || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `SAMP_Feasibility_Review_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FA] dark:bg-[#0b0c10] select-text">
      {/* ── Compact Page Header ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* Title + badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
              Technical Feasibility Evaluation Workbench
            </h1>
            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#017E84]/10 text-[#017E84] dark:bg-teal-950/40 dark:text-teal-300 border border-[#017E84]/20">
              SAMP Lab
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#017E84]" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredRequests.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* View Mode Toggle */}
            <div className="inline-flex rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-2 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "list"
                    ? "bg-[#714B67] text-white shadow-2xs font-bold"
                    : "text-neutral-500 hover:text-neutral-800 dark:text-zinc-400"
                }`}
                title="Table View"
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`px-2 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "kanban"
                    ? "bg-[#714B67] text-white shadow-2xs font-bold"
                    : "text-neutral-500 hover:text-neutral-800 dark:text-zinc-400"
                }`}
                title="Kanban Pipeline Swimlanes"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">Kanban</span>
              </button>
            </div>
          </div>
        </div>


        {/* ── KPI Metric Cards Ribbon ── */}

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 mt-3 pt-3 border-t border-[#F1F5F9] dark:border-white/[0.05]">
          {/* Card 1: Total Queue */}
          <div
            onClick={() => setFilterTab("all")}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${
              filterTab === "all"
                ? "border-[#714B67] bg-[#714B67]/5 dark:bg-[#714B67]/20 shadow-2xs"
                : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-neutral-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-neutral-500 dark:text-zinc-400 font-mono tracking-wider">
                Total Intake
              </span>
              <ClipboardCheck className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-zinc-100 mt-0.5">
              {metrics.total}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">From Marketing</div>
          </div>

          {/* Card 2: Awaiting SAMP Claim */}
          <div
            onClick={() => setFilterTab("awaiting_claim")}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${
              filterTab === "awaiting_claim"
                ? "border-amber-400 bg-amber-500/10 dark:bg-amber-950/30 shadow-2xs"
                : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-amber-700 dark:text-amber-300 font-mono tracking-wider">
                Needs Claim
              </span>
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-900 dark:text-amber-200 mt-0.5">
              {metrics.awaitingClaim}
            </div>
            <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-mono">
              Unclaimed Tasks
            </div>
          </div>

          {/* Card 3: In Technical Review */}
          <div
            onClick={() => setFilterTab("in_review")}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${
              filterTab === "in_review"
                ? "border-sky-400 bg-sky-500/10 dark:bg-sky-950/30 shadow-2xs"
                : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-sky-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-sky-700 dark:text-sky-300 font-mono tracking-wider">
                Under Review
              </span>
              <UserCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-xl font-bold font-mono text-sky-900 dark:text-sky-200 mt-0.5">
              {metrics.inReview}
            </div>
            <div className="text-[10px] text-sky-700/80 dark:text-sky-400/80 font-mono">
              Claimed in Lab
            </div>
          </div>

          {/* Card 4: Feasible (Yes) */}
          <div
            onClick={() => setFilterTab("feasible")}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${
              filterTab === "feasible"
                ? "border-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/30 shadow-2xs"
                : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-emerald-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-emerald-700 dark:text-emerald-300 font-mono tracking-wider">
                Feasible (Yes)
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-900 dark:text-emerald-200 mt-0.5">
              {metrics.feasible}
            </div>
            <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-mono">
              Ready for Sample
            </div>
          </div>

          {/* Card 5: Conditional (Maybe) */}
          <div
            onClick={() => setFilterTab("conditional")}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${
              filterTab === "conditional"
                ? "border-amber-400 bg-amber-500/10 dark:bg-amber-950/30 shadow-2xs"
                : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-amber-700 dark:text-amber-300 font-mono tracking-wider">
                Conditional
              </span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-900 dark:text-amber-200 mt-0.5">
              {metrics.conditional}
            </div>
            <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-mono">
              Remarks Attached
            </div>
          </div>

          {/* Card 6: SLA Response Compliance */}
          <div className="p-2.5 rounded-lg border border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-neutral-500 dark:text-zinc-400 font-mono tracking-wider">
                SLA Compliance
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#017E84]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#017E84] dark:text-teal-400 mt-0.5">
              {metrics.slaPercent}%
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">Evaluated on time</div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Pill Control Strip ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Enterprise Segmented Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {[
            { id: "all", label: "All Feasibility", count: tabCounts.all },
            { id: "awaiting_claim", label: "Awaiting Claim", count: tabCounts.awaiting_claim },
            { id: "in_review", label: "Under Review", count: tabCounts.in_review },
            { id: "my_claimed", label: "Claimed by Me", count: tabCounts.my_claimed },
            { id: "feasible", label: "Feasible", count: tabCounts.feasible },
            { id: "conditional", label: "Conditional", count: tabCounts.conditional },
            { id: "rejected", label: "Rejected", count: tabCounts.rejected },
          ].map((tab) => {
            const isActive = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id as FeasibilityFilterTab)}
                className={`px-3 py-1.5 rounded font-mono text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#714B67] text-white shadow-2xs"
                    : "text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-white/[0.04]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-neutral-200/70 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Search & Dropdown Filters */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          {/* Customer Filter */}
          {uniqueCustomers.length > 0 && (
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="h-8 px-2.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-700 dark:text-zinc-200 focus:outline-none focus:border-[#714B67]"
            >
              <option value="all">All Customers</option>
              {uniqueCustomers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Search Box */}
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search SR, Code, Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-800 dark:text-zinc-200 placeholder:text-neutral-400 focus:outline-none focus:border-[#714B67]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Work Area ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {viewMode === "list" && (
          filteredRequests.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-zinc-800/80 flex items-center justify-center text-neutral-400 mb-3 border border-neutral-200 dark:border-zinc-700">
                <ClipboardCheck className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-neutral-800 dark:text-zinc-200 mb-1">
                No Feasibility Tasks Found
              </h3>
              <p className="text-xs text-neutral-500 dark:text-zinc-400 max-w-md mb-4 font-sans">
                {searchTerm || customerFilter !== "all" || filterTab !== "all"
                  ? "No tasks match your active filter criteria. Try resetting your search or selecting another tab."
                  : "There are currently no feasibility check requests submitted by Marketing in this category."}
              </p>
              {(searchTerm || customerFilter !== "all" || filterTab !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setCustomerFilter("all");
                    setFilterTab("all");
                  }}
                  className="px-3.5 py-1.5 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 font-mono transition"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            /* ── Table View (Authentic Enterprise Master Sheet) ── */
            <div className="bg-white dark:bg-[#12141d] rounded-lg border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-zinc-900/60 text-neutral-500 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider select-none">
                    <th className="py-2.5 px-4 font-semibold">Request / SR</th>
                    <th className="py-2.5 px-4 font-semibold">Product Classification</th>
                    <th className="py-2.5 px-4 font-semibold">Customer</th>
                    <th className="py-2.5 px-4 font-semibold">Target SLA Date</th>
                    <th className="py-2.5 px-4 font-semibold">SAMP Claim Status</th>
                    <th className="py-2.5 px-4 font-semibold">Technical Verdict</th>
                    <th className="py-2.5 px-4 font-semibold">Marketing Decision</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Evaluation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] dark:divide-white/[0.04]">
                  {filteredRequests.map((req) => {
                    const cleanDesc = cleanFeasibilityDescription(
                      req.feasibilityDescription || req.productDescription
                    );
                    const category =
                      req.customFeasibilityType ||
                      (req.feasibilityType
                        ? req.feasibilityType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                        : "New Category");
                    const hasLink =
                      req.referenceLinks && req.referenceLinks.length > 0;
                    const hasPhotos =
                      req.referenceImages && req.referenceImages.length > 0;
                    const isClaimedByMe =
                      req.takenBySamp &&
                      user?.name &&
                      req.takenBySamp.toLowerCase() === user.name.toLowerCase();

                    return (
                      <tr
                        key={req.id}
                        onClick={() => handleOpenInspect(req)}
                        className="hover:bg-neutral-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      >
                        {/* Request Code & SR Number */}
                        <td className="py-3 px-4 font-mono font-bold text-neutral-900 dark:text-zinc-100 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[#017E84] hover:underline">
                              {req.materialCode || req.srNumber}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyCode(req.materialCode || req.srNumber, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-neutral-700 transition"
                              title="Copy Code"
                            >
                              {copiedId === (req.materialCode || req.srNumber) ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          {req.srNumber && req.materialCode && req.srNumber !== req.materialCode && (
                            <div className="text-[10.5px] font-normal text-neutral-400 font-mono">
                              {req.srNumber}
                            </div>
                          )}
                        </td>

                        {/* Product Scope / Classification */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#714B67]/10 text-[#714B67] dark:bg-purple-950/40 dark:text-purple-300 border border-[#714B67]/20">
                              {category}
                            </span>
                            {hasPhotos && (
                              <span className="text-[10px] text-neutral-400 font-mono">
                                📷 {req.referenceImages?.length}
                              </span>
                            )}
                            {hasLink && (
                              <span className="text-[10px] text-[#017E84] font-mono flex items-center gap-0.5">
                                <ExternalLink className="w-2.5 h-2.5" />
                                {req.referenceLinks?.length}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-800 dark:text-zinc-200 truncate font-sans font-medium" title={cleanDesc}>
                            {cleanDesc || "Custom feasibility evaluation requested."}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-zinc-100 whitespace-nowrap">
                          {req.customer || "Unassigned Client"}
                        </td>

                        {/* Target SLA Date */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-xs">
                          <div className="text-neutral-800 dark:text-zinc-200 font-medium">
                            {formatErpDate(req.sampleRequiredDate || req.dateRequestCreated)}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            Raised: {formatErpDate(req.dateRequestCreated || req.createdAt)}
                          </div>
                        </td>

                        {/* SAMP Claim Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {req.takenBySamp ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                                  isClaimedByMe
                                    ? "bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300"
                                    : "bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-zinc-800 dark:text-zinc-300"
                                }`}
                              >
                                <User className="w-3 h-3" />
                                <span>{req.takenBySamp}</span>
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleInlineClaim(req, e)}
                              disabled={claimingId === req.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 text-[11px] font-bold font-mono transition shadow-2xs cursor-pointer active:scale-95"
                              title="Click to claim this task for evaluation"
                            >
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{claimingId === req.id ? "Claiming..." : "Claim Task"}</span>
                            </button>
                          )}
                        </td>

                        {/* Technical Verdict */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {req.samplingFeasibilityResponse === "Yes" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Feasible (Yes)</span>
                            </span>
                          ) : req.samplingFeasibilityResponse === "Maybe" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Conditional (Maybe)</span>
                            </span>
                          ) : req.samplingFeasibilityResponse === "No" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Not Feasible (No)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-neutral-500 bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700">
                              <Clock className="w-3 h-3" />
                              <span>Pending Verdict</span>
                            </span>
                          )}
                        </td>

                        {/* Marketing Decision */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-xs">
                          {req.marketingDecision === "Accepted" ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Marketing Accepted</span>
                            </span>
                          ) : req.marketingDecision === "Rejected" ? (
                            <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              <span>Marketing Rejected</span>
                            </span>
                          ) : (
                            <span className="text-neutral-400">Awaiting Sign-off</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenInspect(req);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-white dark:bg-zinc-800 hover:bg-[#017E84] hover:text-white border border-[#CED4DA] dark:border-zinc-700 hover:border-[#017E84] text-xs font-semibold text-neutral-700 dark:text-zinc-200 transition shadow-2xs cursor-pointer group-hover:border-[#017E84]"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5 text-[#017E84] group-hover:text-white" />
                            <span>{req.samplingFeasibilityResponse ? "View Verdict" : "Inspect & Evaluate"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer info */}
            <div className="px-4 py-2.5 bg-[#F8F9FA] dark:bg-zinc-900/60 border-t border-[#E2E8F0] dark:border-white/[0.08] flex items-center justify-between text-xs text-neutral-500 font-mono">
              <span>Showing {filteredRequests.length} of {feasibilityRequests.length} feasibility tasks</span>
              <span>Sorted by Latest Raised Intake</span>
            </div>
          </div>
        )
      )}

      {viewMode === "kanban" && (
        /* ── Kanban Pipeline Swimlanes View ── */
          <div className="p-4 md:p-6 overflow-x-auto min-h-[500px]">
            <div className="flex space-x-4 min-w-max items-start">
              {SAMP_FEASIBILITY_KANBAN_COLUMNS.map((col) => {
                const itemsInCol = kanbanRequests.filter(
                  (r) => getSampFeasibilityKanbanColumn(r) === col.id
                );

                return (
                  <div
                    key={col.id}
                    className={`w-76 rounded-lg border ${col.borderTone} ${col.bgTone} p-3 flex flex-col space-y-2.5 shadow-2xs`}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#D8DADD] dark:border-white/[0.08]">
                      <span className={`font-bold text-xs ${col.accentTone}`}>
                        {col.label}
                      </span>
                      <span className="bg-white dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 border border-neutral-200 dark:border-zinc-700 font-mono font-bold px-2 py-0.5 rounded-full text-[10px]">
                        {itemsInCol.length}
                      </span>
                    </div>

                    {/* Cards Container */}
                    <div className="space-y-2.5 overflow-y-auto max-h-[620px] pr-0.5">
                      {itemsInCol.length === 0 ? (
                        <div className="p-6 text-center text-[11px] text-neutral-400 font-mono">
                          No tasks in this stage
                        </div>
                      ) : (
                        itemsInCol.map((req) => {
                          const cleanDesc = cleanFeasibilityDescription(
                            req.feasibilityDescription || req.productDescription
                          );
                          const category =
                            req.customFeasibilityType ||
                            (req.feasibilityType
                              ? req.feasibilityType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                              : "New Category");
                          const code = req.materialCode || req.srNumber || `FC-${req.id}`;
                          const isClaimedByMe =
                            Boolean(req.takenBySamp) &&
                            Boolean(user?.name) &&
                            req.takenBySamp?.toLowerCase() === user?.name?.toLowerCase();

                          return (
                            <div
                              key={req.id}
                              onClick={() => {
                                setSelectedRequest(req);
                                setIsInspectorOpen(true);
                              }}
                              className="bg-white dark:bg-[#161822] p-3 rounded-lg border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs hover:border-[#714B67] dark:hover:border-purple-400 hover:shadow-xs cursor-pointer transition group"
                            >
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className="font-bold text-[#714B67] dark:text-purple-300">
                                  {code}
                                </span>
                                <span className="px-1.5 py-0.2 rounded font-bold bg-[#714B67]/10 text-[#714B67] dark:bg-purple-950/40 dark:text-purple-300 border border-[#714B67]/20">
                                  {category}
                                </span>
                              </div>

                              <div className="font-bold text-neutral-900 dark:text-zinc-100 text-xs mt-1.5 line-clamp-1">
                                {req.customer || "General Customer"}
                              </div>

                              <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                                {cleanDesc || "Technical feasibility review request."}
                              </p>

                              {/* Plant & SLA */}
                              <div className="text-[10px] text-neutral-400 dark:text-zinc-500 mt-2 flex items-center justify-between font-mono">
                                <div className="flex items-center gap-1 truncate max-w-[140px]">
                                  <Building2 className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{req.targetPlant || "All Plants"}</span>
                                </div>
                                <span>
                                  Target: {req.sampleRequiredDate ? formatErpDate(req.sampleRequiredDate) : "Flexible"}
                                </span>
                              </div>

                              {/* Card Footer: Claim status + Verdict + Action */}
                              <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-white/[0.06] flex items-center justify-between text-[10px]">
                                <div onClick={(e) => e.stopPropagation()}>
                                  {req.takenBySamp ? (
                                    <span
                                      className={`text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded border ${
                                        isClaimedByMe
                                          ? "bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200"
                                          : "bg-neutral-100 text-neutral-600 dark:bg-zinc-800 dark:text-zinc-300 border-neutral-200"
                                      }`}
                                    >
                                      {req.takenBySamp}
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => handleInlineClaim(req, e)}
                                      disabled={claimingId === req.id}
                                      className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition cursor-pointer"
                                    >
                                      {claimingId === req.id ? "Claiming..." : "Claim Task"}
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {req.samplingFeasibilityResponse === "Yes" ? (
                                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                                      ✓ Feasible
                                    </span>
                                  ) : req.samplingFeasibilityResponse === "Maybe" ? (
                                    <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                                      Conditional
                                    </span>
                                  ) : req.samplingFeasibilityResponse === "No" ? (
                                    <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 px-2 py-0.5 rounded-full border border-rose-300 dark:border-rose-800">
                                      Rejected
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-mono text-neutral-400">
                                      Pending
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedRequest(req);
                                      setIsInspectorOpen(true);
                                    }}
                                    className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-500 hover:text-[#714B67] dark:hover:text-purple-300 cursor-pointer"
                                    title="Open Inspector"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                            </div>
                          );
                        })
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── SAMP Technical Inspector & Verdict Modal ── */}
      {selectedRequest && (
        <FeasibilityInspectorModal
          request={selectedRequest}
          isOpen={isInspectorOpen}
          onClose={() => {
            setIsInspectorOpen(false);
            onRefresh();
          }}
          user={user}
          isAdmin={isAdmin}
          sourceDesk="samp"
        />
      )}
    </div>
  );
};

export default SampFeasibilityReviewPage;
