import React, { useState, useMemo } from "react";
import { UserProfile } from "@/features/auth";
import { SampleRequestItem } from "../types";
import { getRequestTrackType } from "../utils/trackTypes";
import { cleanFeasibilityDescription } from "../api";
import { formatErpDate } from "../utils/dateUtils";
import {
  Search,
  Plus,
  Download,
  Copy,
  Check,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ClipboardCheck,
  ExternalLink,
  Calendar,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  Zap,
  UserCheck,
  ShieldCheck,
  Package,
  Building2,
  Star,
  ThumbsUp,
  Send,
} from "lucide-react";

export interface FeasibilityRequestsPageProps {
  requests: SampleRequestItem[];
  isLoading: boolean;
  selectedYear: string;
  selectedPlant: string;
  uniquePlants: string[];
  uniqueCustomers: string[];
  user?: UserProfile | null;
  isAdmin: boolean;
  onOpenNewModal: () => void;
  onInspectRequest: (req: SampleRequestItem) => void;
  onMarketingApproveFeasibility: (
    requestId: string | number,
    approved: boolean,
    remark?: string
  ) => Promise<void>;
  onDeleteRequest: (req: SampleRequestItem, e?: React.MouseEvent) => Promise<void>;
  onBatchDelete: (selectedIds: Set<string | number>) => Promise<void>;
  onRefresh: () => Promise<void>;
  onExportCSV: () => void;
  onUpdateStatus?: (reqId: string | number, newStatus: string) => Promise<void>;
}

export type MarketingFeasibilityTab =
  | "all"
  | "awaiting_claim"
  | "in_review"
  | "awaiting_decision"
  | "feasible"
  | "conditional"
  | "approved"
  | "converted"
  | "rejected";

export const FEASIBILITY_KANBAN_COLUMNS: {
  id: string;
  label: string;
  bgTone: string;
  borderTone: string;
  accentTone: string;
}[] = [
  {
    id: "unclaimed",
    label: "Awaiting Claim",
    bgTone: "bg-amber-50/40 dark:bg-amber-950/20",
    borderTone: "border-amber-200/80 dark:border-amber-900/40",
    accentTone: "text-amber-700 dark:text-amber-400",
  },
  {
    id: "in_review",
    label: "Under Review in Lab",
    bgTone: "bg-sky-50/40 dark:bg-sky-950/20",
    borderTone: "border-sky-200/80 dark:border-sky-900/40",
    accentTone: "text-sky-700 dark:text-sky-400",
  },
  {
    id: "awaiting_decision",
    label: "Needs Marketing Sign-Off",
    bgTone: "bg-purple-50/40 dark:bg-purple-950/20",
    borderTone: "border-purple-200/80 dark:border-purple-900/40",
    accentTone: "text-[#714B67] dark:text-purple-300",
  },
  {
    id: "approved",
    label: "Feasible (Approved)",
    bgTone: "bg-emerald-50/40 dark:bg-emerald-950/20",
    borderTone: "border-emerald-200/80 dark:border-emerald-900/40",
    accentTone: "text-emerald-700 dark:text-emerald-400",
  },
  {
    id: "converted",
    label: "In Sampling Pipeline",
    bgTone: "bg-teal-50/40 dark:bg-teal-950/20",
    borderTone: "border-teal-200/80 dark:border-teal-900/40",
    accentTone: "text-teal-700 dark:text-teal-400",
  },
  {
    id: "rejected",
    label: "Dropped / Closed",
    bgTone: "bg-neutral-50 dark:bg-zinc-900/60",
    borderTone: "border-neutral-200 dark:border-zinc-800",
    accentTone: "text-neutral-700 dark:text-zinc-300",
  },
];

export const getFeasibilityKanbanColumn = (r: SampleRequestItem): string => {
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
  if (hasVerdict && !r.marketingDecision) return "awaiting_decision";
  if (r.takenBySamp && !hasVerdict) return "in_review";
  return "unclaimed";
};

export const FeasibilityRequestsPage: React.FC<FeasibilityRequestsPageProps> = ({
  requests,
  isLoading,
  selectedYear,
  selectedPlant,
  uniquePlants,
  uniqueCustomers,
  user,
  isAdmin,
  onOpenNewModal,
  onInspectRequest,
  onMarketingApproveFeasibility,
  onDeleteRequest,
  onBatchDelete,
  onRefresh,
  onExportCSV,
  onUpdateStatus,
}) => {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [filterTab, setFilterTab] = useState<MarketingFeasibilityTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Drag & drop state for Kanban
  const [draggedId, setDraggedId] = useState<string | number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string | number) => {
    e.dataTransfer.setData("text/plain", String(id));
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverCol(null);
  };

  const handleColDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleColDrop = async (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    setDragOverCol(null);
    setDraggedId(null);
    const id = e.dataTransfer.getData("text/plain") || draggedId;
    if (!id) return;

    const req = requests.find((r) => String(r.id) === String(id));
    if (!req) return;

    const currentCol = getFeasibilityKanbanColumn(req);
    if (currentCol === targetColId) return;

    if (targetColId === "approved") {
      await onMarketingApproveFeasibility(req.id, true, "Approved via Kanban drag");
    } else if (targetColId === "rejected") {
      await onMarketingApproveFeasibility(req.id, false, "Dropped via Kanban drag");
    } else if (targetColId === "in_review" && onUpdateStatus) {
      await onUpdateStatus(req.id, "In Progress");
    } else if (targetColId === "unclaimed" && onUpdateStatus) {
      await onUpdateStatus(req.id, "Draft");
    }
  };

  // Copy feedback
  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Only consider feasibility requests
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
        Boolean(r.customFeasibilityType) ||
        getRequestTrackType(r) === "feasibility_check"
      );
    });
  }, [requests]);

  // Telemetry metrics
  const metrics = useMemo(() => {
    const total = feasibilityRequests.length;
    let awaitingClaim = 0;
    let inReview = 0;
    let awaitingDecision = 0;
    let feasible = 0;
    let conditional = 0;
    let approved = 0;
    let converted = 0;
    let rejected = 0;

    feasibilityRequests.forEach((r) => {
      const hasSampVerdict = Boolean(r.samplingFeasibilityResponse);
      const dec = (r.marketingDecision || "").toLowerCase();
      const status = (r.status || "").toLowerCase();

      if (!r.takenBySamp && !hasSampVerdict) {
        awaitingClaim++;
      } else if (r.takenBySamp && !hasSampVerdict) {
        inReview++;
      }

      if (hasSampVerdict && !r.marketingDecision) {
        awaitingDecision++;
      }

      if (r.samplingFeasibilityResponse === "Yes") feasible++;
      if (r.samplingFeasibilityResponse === "Maybe") conditional++;

      if (dec === "accepted" || status.includes("approved")) {
        approved++;
      }
      if (dec === "rejected" || status.includes("rejected") || status.includes("closed")) {
        rejected++;
      }
      if (Boolean(r.convertedSrNumber || r.convertedSampleRequestId)) {
        converted++;
      }
    });

    // SLA compliance rate
    const evaluatedWithSla = feasibilityRequests.filter(
      (r) => Boolean(r.samplingFeasibilityResponse) && r.isRespondedOnTime !== null && r.isRespondedOnTime !== undefined
    );
    const onTimeCount = evaluatedWithSla.filter((r) => r.isRespondedOnTime === true).length;
    const slaPercent = evaluatedWithSla.length > 0 ? Math.round((onTimeCount / evaluatedWithSla.length) * 100) : 100;

    return {
      total,
      awaitingClaim,
      inReview,
      awaitingDecision,
      feasible,
      conditional,
      approved,
      converted,
      rejected,
      slaPercent,
    };
  }, [feasibilityRequests]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: feasibilityRequests.length,
      awaiting_claim: metrics.awaitingClaim,
      in_review: metrics.inReview,
      awaiting_decision: metrics.awaitingDecision,
      feasible: metrics.feasible,
      conditional: metrics.conditional,
      approved: metrics.approved,
      converted: metrics.converted,
      rejected: metrics.rejected,
    };
  }, [feasibilityRequests, metrics]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return feasibilityRequests.filter((r) => {
      // Filter tab
      if (filterTab === "awaiting_claim") {
        if (r.takenBySamp || r.samplingFeasibilityResponse) return false;
      } else if (filterTab === "in_review") {
        if (!r.takenBySamp || r.samplingFeasibilityResponse) return false;
      } else if (filterTab === "awaiting_decision") {
        if (!r.samplingFeasibilityResponse || r.marketingDecision) return false;
      } else if (filterTab === "feasible") {
        if (r.samplingFeasibilityResponse !== "Yes") return false;
      } else if (filterTab === "conditional") {
        if (r.samplingFeasibilityResponse !== "Maybe") return false;
      } else if (filterTab === "approved") {
        const dec = (r.marketingDecision || "").toLowerCase();
        const st = (r.status || "").toLowerCase();
        if (dec !== "accepted" && !st.includes("approved")) return false;
      } else if (filterTab === "converted") {
        if (!r.convertedSrNumber && !r.convertedSampleRequestId) return false;
      } else if (filterTab === "rejected") {
        const dec = (r.marketingDecision || "").toLowerCase();
        const st = (r.status || "").toLowerCase();
        if (dec !== "rejected" && !st.includes("rejected") && !st.includes("closed")) return false;
      }

      // Customer filter
      if (customerFilter !== "all" && r.customer !== customerFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const sr = (r.srNumber || "").toLowerCase();
        const mat = (r.materialCode || "").toLowerCase();
        const desc = (r.productDescription || r.feasibilityDescription || "").toLowerCase();
        const cust = (r.customer || "").toLowerCase();
        const samp = (r.takenBySamp || "").toLowerCase();
        return sr.includes(q) || mat.includes(q) || desc.includes(q) || cust.includes(q) || samp.includes(q);
      }

      return true;
    });
  }, [feasibilityRequests, filterTab, customerFilter, searchTerm]);

  // Full Pipeline Requests for Kanban (unconstrained by stage filter tab)
  const kanbanRequests = useMemo(() => {
    return feasibilityRequests.filter((r) => {
      if (customerFilter !== "all" && r.customer !== customerFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const sr = (r.srNumber || "").toLowerCase();
        const mat = (r.materialCode || "").toLowerCase();
        const desc = (r.productDescription || r.feasibilityDescription || "").toLowerCase();
        const cust = (r.customer || "").toLowerCase();
        const samp = (r.takenBySamp || "").toLowerCase();
        return sr.includes(q) || mat.includes(q) || desc.includes(q) || cust.includes(q) || samp.includes(q);
      }
      return true;
    });
  }, [feasibilityRequests, customerFilter, searchTerm]);

  // Row selection
  const handleToggleSelectRow = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRequests.map((r) => r.id)));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FA] dark:bg-[#0b0c10] select-text">
      {/* ── Compact Page Header (Matched to SAMP Workbench) ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* Title + badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
              Technical Feasibility Evaluation Workbench
            </h1>
            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#714B67]/10 text-[#714B67] dark:bg-purple-950/40 dark:text-purple-300 border border-[#714B67]/20">
              Marketing Desk
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* New Feasibility Registration */}
            <button
              type="button"
              onClick={onOpenNewModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
              title="Register New Technical Feasibility Check"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Refresh Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#017E84]" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={onExportCSV}
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

        {/* ── KPI Metric Cards Ribbon (Exact 6 Cards Matching SAMP Workbench) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-3 pt-3 border-t border-[#F1F5F9] dark:border-white/[0.05]">
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
              {isLoading ? "—" : metrics.total}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">From Marketing</div>
          </div>

          {/* Card 2: Needs Claim */}
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
              {isLoading ? "—" : metrics.awaitingClaim}
            </div>
            <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-mono">
              Unclaimed Tasks
            </div>
          </div>

          {/* Card 3: Under Review in Lab */}
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
              {isLoading ? "—" : metrics.inReview}
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
              {isLoading ? "—" : metrics.feasible}
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
              {isLoading ? "—" : metrics.conditional}
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

      {/* ── Search & Filter Pill Control Strip (Exact Matching SAMP Workbench) ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Enterprise Segmented Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {[
            { id: "all", label: "All Feasibility", count: tabCounts.all },
            { id: "awaiting_claim", label: "Awaiting Claim", count: tabCounts.awaiting_claim },
            { id: "in_review", label: "Under Review", count: tabCounts.in_review },
            { id: "awaiting_decision", label: "Needs Decision", count: tabCounts.awaiting_decision },
            { id: "feasible", label: "Feasible", count: tabCounts.feasible },
            { id: "conditional", label: "Conditional", count: tabCounts.conditional },
            { id: "approved", label: "Approved", count: tabCounts.approved },
            { id: "converted", label: "In Sampling", count: tabCounts.converted },
            { id: "rejected", label: "Rejected", count: tabCounts.rejected },
          ].map((tab) => {
            const isActive = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id as MarketingFeasibilityTab)}
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

        {/* Right: Search & Customer Filter */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          {/* Batch delete button if items selected */}
          {selectedIds.size > 0 && isAdmin && (
            <button
              type="button"
              onClick={() => onBatchDelete(selectedIds)}
              className="h-8 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.size})</span>
            </button>
          )}

          {/* Customer Filter Dropdown */}
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
              className="w-full h-8 pl-8 pr-7 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-800 dark:text-zinc-200 placeholder:text-neutral-400 focus:outline-none focus:border-[#714B67]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs cursor-pointer"
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
            /* Exact Matching Empty State from Screenshot */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-zinc-800/80 flex items-center justify-center text-neutral-400 mb-3 border border-neutral-200 dark:border-zinc-700">
                <ClipboardCheck className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-neutral-800 dark:text-zinc-200 mb-1">
                No Feasibility Tasks Found
              </h3>
              <p className="text-xs text-neutral-500 dark:text-zinc-400 max-w-md mb-4 font-sans">
                {searchTerm || customerFilter !== "all" || filterTab !== "all"
                  ? "No feasibility requests match your active filter criteria. Try resetting your search or selecting another tab."
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
                  className="px-3.5 py-1.5 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 font-mono transition cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            /* ── Table View ── */
          <div className="bg-white dark:bg-[#12141d] rounded-lg border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-zinc-900/60 text-neutral-500 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider select-none">
                    <th className="py-2.5 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredRequests.length && filteredRequests.length > 0}
                        onChange={handleToggleSelectAll}
                        className="rounded border-neutral-300 text-[#714B67] focus:ring-[#714B67]"
                      />
                    </th>
                    <th className="py-2.5 px-4 font-semibold">Request / SR</th>
                    <th className="py-2.5 px-4 font-semibold">Product Classification</th>
                    <th className="py-2.5 px-4 font-semibold">Customer</th>
                    <th className="py-2.5 px-4 font-semibold">Target SLA Date</th>
                    <th className="py-2.5 px-4 font-semibold">SAMP Claim Status</th>
                    <th className="py-2.5 px-4 font-semibold">Technical Verdict</th>
                    <th className="py-2.5 px-4 font-semibold">Marketing Decision</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Commercial Action</th>
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
                    const isSelected = selectedIds.has(req.id);

                    return (
                      <tr
                        key={req.id}
                        onClick={() => onInspectRequest(req)}
                        className={`hover:bg-neutral-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group ${
                          isSelected ? "bg-purple-50/40 dark:bg-purple-950/20" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 w-8" onClick={(e) => handleToggleSelectRow(req.id, e)}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-neutral-300 text-[#714B67] focus:ring-[#714B67]"
                          />
                        </td>

                        {/* Request Code & SR Number */}
                        <td className="py-3 px-4 font-mono font-bold text-neutral-900 dark:text-zinc-100 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[#714B67] dark:text-purple-300 hover:underline">
                              {req.materialCode || req.srNumber}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyCode(req.materialCode || req.srNumber, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
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
                          </div>
                          <div className="text-xs text-neutral-600 dark:text-zinc-300 truncate max-w-xs">
                            {cleanDesc || "Technical feasibility review"}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4 font-medium text-neutral-800 dark:text-zinc-200 whitespace-nowrap">
                          {req.customer || "—"}
                        </td>

                        {/* SLA Date */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-neutral-600 dark:text-zinc-300">
                          {req.sampleRequiredDate ? formatErpDate(req.sampleRequiredDate) : "Flexible"}
                        </td>

                        {/* SAMP Claim Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {req.takenBySamp ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-mono font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                              <UserCheck className="w-3 h-3 text-sky-600" />
                              <span>{req.takenBySamp}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-mono font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/80">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>Unclaimed</span>
                            </span>
                          )}
                        </td>

                        {/* Technical Verdict */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {req.samplingFeasibilityResponse === "Yes" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Feasible</span>
                            </span>
                          ) : req.samplingFeasibilityResponse === "Maybe" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/80">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Conditional</span>
                            </span>
                          ) : req.samplingFeasibilityResponse === "No" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300/80">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Rejected</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-neutral-400">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Marketing Decision */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {req.marketingDecision === "Accepted" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300">
                              ✓ Accepted
                            </span>
                          ) : req.marketingDecision === "Rejected" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300">
                              ✕ Dropped
                            </span>
                          ) : req.samplingFeasibilityResponse ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-[#714B67] dark:text-purple-300 border border-purple-300 animate-pulse">
                              Needs Sign-off
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-neutral-400">
                              Awaiting SAMP
                            </span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {req.convertedSrNumber ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-[#714B67] border border-purple-200">
                                {req.convertedSrNumber}
                              </span>
                            ) : req.samplingFeasibilityResponse && !req.marketingDecision ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => onMarketingApproveFeasibility(req.id, true)}
                                  className="px-2 py-0.5 rounded bg-[#017E84] hover:bg-[#00666A] text-white text-[10.5px] font-bold font-mono transition cursor-pointer"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onMarketingApproveFeasibility(req.id, false)}
                                  className="px-2 py-0.5 rounded border border-rose-300 text-rose-600 hover:bg-rose-50 text-[10.5px] font-mono transition cursor-pointer"
                                >
                                  Drop
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onInspectRequest(req)}
                                className="px-2.5 py-1 rounded border border-[#CED4DA] dark:border-zinc-700 hover:border-[#714B67] text-neutral-700 dark:text-zinc-300 hover:text-[#714B67] text-[11px] font-medium font-mono transition cursor-pointer"
                              >
                                Inspect
                              </button>
                            )}

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={(e) => onDeleteRequest(req, e)}
                                className="p-1 text-neutral-400 hover:text-rose-600 transition cursor-pointer"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {viewMode === "kanban" && (
        /* ── Kanban Pipeline Swimlanes View ── */
          <div className="p-4 md:p-6 overflow-x-auto min-h-[500px]">
            <div className="flex space-x-4 min-w-max items-start">
              {FEASIBILITY_KANBAN_COLUMNS.map((col) => {
                const itemsInCol = kanbanRequests.filter(
                  (r) => getFeasibilityKanbanColumn(r) === col.id
                );

                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => handleColDragOver(e, col.id)}
                    onDragLeave={() => setDragOverCol((prev) => (prev === col.id ? null : prev))}
                    onDrop={(e) => handleColDrop(e, col.id)}
                    className={`w-76 rounded-lg border transition-colors duration-100 ${
                      dragOverCol === col.id
                        ? "border-[#714B67] bg-purple-50/70 dark:bg-purple-950/40 ring-2 ring-[#714B67]/40 ring-offset-1"
                        : `${col.borderTone} ${col.bgTone}`
                    } p-3 flex flex-col space-y-2.5 shadow-2xs`}
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
                          No requests in this stage
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
                          const isAwaitingDecision =
                            req.samplingFeasibilityResponse && !req.marketingDecision;

                          return (
                            <div
                              key={req.id}
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, req.id)}
                              onDragEnd={handleDragEnd}
                              onClick={() => onInspectRequest(req)}
                              className={`bg-white dark:bg-[#161822] p-3 rounded-lg border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs hover:border-[#714B67] dark:hover:border-purple-400 hover:shadow-xs cursor-grab active:cursor-grabbing transition group ${
                                draggedId === req.id ? "opacity-40 scale-95 border-dashed border-[#714B67]" : ""
                              }`}
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
                                {cleanDesc || "Technical feasibility evaluation requested by Marketing."}
                              </p>

                              {/* Facility & SLA */}
                              <div className="text-[10px] text-neutral-400 dark:text-zinc-500 mt-2 flex items-center justify-between font-mono">
                                <div className="flex items-center gap-1 truncate max-w-[140px]">
                                  <Building2 className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{req.targetPlant || "All Plants"}</span>
                                </div>
                                <span>
                                  SLA: {req.sampleRequiredDate ? formatErpDate(req.sampleRequiredDate) : "Flexible"}
                                </span>
                              </div>

                              {/* Card Footer with Verdict & Quick Actions */}
                              <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-white/[0.06] flex items-center justify-between text-[10px]">
                                <div>
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
                                  ) : req.takenBySamp ? (
                                    <span className="text-[10px] font-mono text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                                      In Lab ({req.takenBySamp})
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-mono text-neutral-400">
                                      Awaiting Claim
                                    </span>
                                  )}
                                </div>

                                {/* Quick Actions */}
                                <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5">
                                  {req.convertedSrNumber ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-[#714B67] border border-purple-200">
                                      {req.convertedSrNumber}
                                    </span>
                                  ) : isAwaitingDecision ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => onMarketingApproveFeasibility(req.id, true)}
                                        className="px-2 py-0.5 rounded bg-[#017E84] hover:bg-[#00666A] text-white text-[10px] font-bold font-mono transition cursor-pointer"
                                        title="Accept & approve for sampling"
                                      >
                                        ✓ Accept
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onMarketingApproveFeasibility(req.id, false)}
                                        className="px-2 py-0.5 rounded border border-rose-300 text-rose-600 hover:bg-rose-50 text-[10px] font-mono transition cursor-pointer"
                                        title="Drop / Reject request"
                                      >
                                        ✕ Drop
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <select
                                        value={col.id}
                                        onChange={async (e) => {
                                          const next = e.target.value;
                                          if (next === col.id) return;
                                          if (next === "approved") {
                                            await onMarketingApproveFeasibility(req.id, true, "Approved via Kanban");
                                          } else if (next === "rejected") {
                                            await onMarketingApproveFeasibility(req.id, false, "Dropped via Kanban");
                                          } else if (next === "in_review" && onUpdateStatus) {
                                            await onUpdateStatus(req.id, "In Progress");
                                          } else if (next === "unclaimed" && onUpdateStatus) {
                                            await onUpdateStatus(req.id, "Draft");
                                          }
                                        }}
                                        className="text-[9px] font-mono font-bold bg-neutral-50 hover:bg-neutral-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-600 dark:text-zinc-300 border border-neutral-200 dark:border-zinc-700 rounded px-1 py-0.5 cursor-pointer outline-none"
                                        title="Move to stage"
                                      >
                                        <option value="unclaimed">Unclaimed</option>
                                        <option value="in_review">In Lab</option>
                                        <option value="awaiting_decision">Sign-Off</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Dropped</option>
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => onInspectRequest(req)}
                                        className="px-2 py-0.5 rounded border border-[#CED4DA] dark:border-zinc-700 hover:border-[#714B67] text-neutral-700 dark:text-zinc-300 hover:text-[#714B67] text-[10px] font-semibold transition cursor-pointer flex items-center gap-0.5"
                                        title="Inspect details"
                                      >
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  )}
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
    </div>
  );
};

export default FeasibilityRequestsPage;
