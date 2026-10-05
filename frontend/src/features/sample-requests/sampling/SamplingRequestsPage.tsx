import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "@/features/auth";
import { SampleRequestItem } from "../types";
import { getStageIdForRequest } from "../utils/trackTypes";
import { StatusPill } from "@/components/ui/StatusPill";
import { getBusinessYearForDate } from "@/lib/businessYear";
import { formatErpDate } from "../utils/dateUtils";
import {
  Search,
  Plus,
  Download,
  Copy,
  Check,
  Trash2,
  Send,
  Building2,
  Calendar,
  RefreshCw,
  ExternalLink,
  Layers,
  LayoutGrid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Zap,
  TrendingUp,
  Factory,
  FlaskConical,
  Palette,
  Ruler,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Package,
  ShieldCheck,
  Star,
  Flame,
} from "lucide-react";

export interface SamplingRequestsPageProps {
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
  onReleaseDraft: (req: SampleRequestItem) => Promise<void>;
  onBatchReleaseDraft: (selectedIds: Set<string | number>) => Promise<void>;
  onDeleteRequest: (req: SampleRequestItem, e?: React.MouseEvent) => Promise<void>;
  onBatchDelete: (selectedIds: Set<string | number>) => Promise<void>;
  onRefresh: () => Promise<void>;
  onExportCSV: () => void;
  onUpdateStatus?: (reqId: string | number, newStatus: string) => Promise<void>;
}

export type SamplingFilterTab =
  | "all"
  | "draft"
  | "creative"
  | "studio"
  | "costing"
  | "samp"
  | "plant"
  | "dispatched"
  | "deal";

const SAMPLING_STAGES: { id: SamplingFilterTab; label: string }[] = [
  { id: "all", label: "All Sampling" },
  { id: "draft", label: "Draft (Pre-PMT)" },
  { id: "creative", label: "Creative & Design" },
  { id: "studio", label: "Studio CAD & Specs" },
  { id: "costing", label: "Costing Estimations" },
  { id: "samp", label: "SAMP Lab Review" },
  { id: "plant", label: "Plant Floor Execution" },
  { id: "dispatched", label: "Dispatched & Closed" },
  { id: "deal", label: "Won Deals / Converted" },
];

const KANBAN_COLUMNS: {
  id: string;
  label: string;
  bgTone: string;
  borderTone: string;
  accentTone: string;
}[] = [
    {
      id: "draft",
      label: "Draft (Pre-PMT)",
      bgTone: "bg-amber-50/40 dark:bg-amber-950/20",
      borderTone: "border-amber-200/80 dark:border-amber-900/40",
      accentTone: "text-amber-700 dark:text-amber-400",
    },
    {
      id: "creative",
      label: "Creative & Design",
      bgTone: "bg-blue-50/40 dark:bg-blue-950/20",
      borderTone: "border-blue-200/80 dark:border-blue-900/40",
      accentTone: "text-blue-700 dark:text-blue-400",
    },
    {
      id: "studio",
      label: "Studio CAD & Specs",
      bgTone: "bg-purple-50/40 dark:bg-purple-950/20",
      borderTone: "border-purple-200/80 dark:border-purple-900/40",
      accentTone: "text-purple-700 dark:text-purple-400",
    },
    {
      id: "costing",
      label: "Costing (CR / BOM)",
      bgTone: "bg-orange-50/40 dark:bg-orange-950/20",
      borderTone: "border-orange-200/80 dark:border-orange-900/40",
      accentTone: "text-orange-700 dark:text-orange-400",
    },
    {
      id: "samp",
      label: "SAMP Lab Workbench",
      bgTone: "bg-[#714B67]/5 dark:bg-[#714B67]/15",
      borderTone: "border-[#714B67]/30 dark:border-[#714B67]/30",
      accentTone: "text-[#714B67] dark:text-purple-300",
    },
    {
      id: "plant",
      label: "Plant Floor Execution",
      bgTone: "bg-emerald-50/40 dark:bg-emerald-950/20",
      borderTone: "border-emerald-200/80 dark:border-emerald-900/40",
      accentTone: "text-emerald-700 dark:text-emerald-400",
    },
    {
      id: "dispatched",
      label: "Dispatched & Delivered",
      bgTone: "bg-neutral-50 dark:bg-zinc-900/60",
      borderTone: "border-neutral-200 dark:border-zinc-800",
      accentTone: "text-neutral-700 dark:text-zinc-300",
    },
  ];

export const SamplingRequestsPage: React.FC<SamplingRequestsPageProps> = ({
  requests,
  isLoading,
  selectedYear,
  selectedPlant,
  uniquePlants,
  uniqueCustomers,
  isAdmin,
  onOpenNewModal,
  onInspectRequest,
  onReleaseDraft,
  onBatchReleaseDraft,
  onDeleteRequest,
  onBatchDelete,
  onRefresh,
  onExportCSV,
  onUpdateStatus,
}) => {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [selectedStageTab, setSelectedStageTab] = useState<SamplingFilterTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlantFilter, setSelectedPlantFilter] = useState<string>("all");
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string>("all");
  const [selectedSlaFilter, setSelectedSlaFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleOpenDraftInStaging = (row: SampleRequestItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const stagingContext = {
      customer: row.customer || "",
      programName: row.programName || row.productDescription || "",
      programYear: row.programYear || "2026",
      year: row.year || "2026-27",
      targetPlant: row.targetPlant || "",
      parentRequestId: row.id,
      parentSrNumber: row.srNumber || `SR-${row.id}`,
    };
    sessionStorage.setItem("samp_active_program_form", JSON.stringify(stagingContext));

    // Seed staged products from this request if session is empty
    const cached = sessionStorage.getItem("samp_active_staged_products");
    let stagedList: any[] = [];
    try {
      if (cached) stagedList = JSON.parse(cached);
    } catch {}

    if (!Array.isArray(stagedList) || stagedList.length === 0) {
      const isDesign = (row.requestTypes || []).includes("design") || Boolean(row.designsCustomerCreative);
      const initialItem = {
        id: String(row.id),
        productDescription: row.productDescription || "Commercial Product Sample",
        materialCode: row.materialCode || row.srNumber || "NEW-SPEC",
        scopes: row.requestTypes && row.requestTypes.length > 0 ? (row.requestTypes as any) : ["sample"],
        stagedDate: row.dateRequestCreated || new Date().toISOString().split("T")[0],
        timestamp: "Draft Intake",
        designMetadata: isDesign ? {
          numberOfDesigns: Number(row.designsCustomerCreative || row.productArtworkNos) || 1,
          designRequiredDate: row.sampleRequiredDate || row.targetArtworkDateCreative || "",
          trend: row.trend || "",
          targetAudience: row.targetAudience || "",
          referenceImage: row.productImagePath || "",
          remarks: (row as any).remarks || row.marketingRemarks || row.descriptionNotes || "",
          images: (row.referenceImages || []).map((url, i) => ({ id: String(i), url, name: `Attachment ${i + 1}` })),
          webLinks: row.referenceLinks || [],
        } : undefined,
        samplingMetadata: {
          sampleType: (row.productType === "Partial Sample" ? "partial" : "full"),
          partialRequirements: (row as any).remarks || row.marketingRemarks || row.descriptionNotes || "",
          sourceSrNumber: row.sourceSampleCode || "",
          bindingType1: (row as any).customBinding1 || "",
          bindingType2: (row as any).customBinding2 || "",
        },
      };
      sessionStorage.setItem("samp_active_staged_products", JSON.stringify([initialItem]));
    }

    navigate("/sample-requests/product-staging", { state: stagingContext });
  };

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

    const rawStage = getStageIdForRequest(req);
    const currentCol = rawStage === "deal" ? "dispatched" : rawStage;
    if (currentCol === targetColId) return;

    const STAGE_STATUS_MAP: Record<string, string> = {
      draft: "Draft",
      creative: "Creative",
      studio: "Studio CAD",
      costing: "Costing Review",
      samp: "Sampling Review (PMT)",
      plant: "Plant Floor Execution",
      dispatched: "Dispatched",
    };

    if (currentCol === "draft" && targetColId !== "draft") {
      await onReleaseDraft(req);
    }

    if (targetColId !== "draft" && onUpdateStatus) {
      const nextStatus = STAGE_STATUS_MAP[targetColId] || "Sampling Review (PMT)";
      await onUpdateStatus(req.id, nextStatus);
    }
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 40;

  // Copy feedback
  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 1200);
  };

  // Only consider standard commercial sampling requests
  const samplingRequests = useMemo(() => {
    return requests.filter((r) => {
      const mat = String(r.materialCode || "").toLowerCase();
      const sr = String(r.srNumber || "").toLowerCase();
      const desc = String(r.productDescription || "").toLowerCase();
      const kind = String(r.requestKind || "").toLowerCase();
      const mode = String(r.creationMode || "").toLowerCase();

      // Exclude Feasibility checks
      if (
        kind === "feasibility" ||
        mode === "feasibility_check" ||
        mat.startsWith("fc-") ||
        mat.startsWith("fc-ck") ||
        sr.startsWith("fc-") ||
        sr.startsWith("fs-") ||
        desc.includes("feasibility check")
      ) {
        return false;
      }

      // Exclude Seasonal Program plannings
      if (
        kind === "program" ||
        mode === "program_planning" ||
        mat.startsWith("pg-") ||
        sr.startsWith("pg-") ||
        desc.includes("seasonal program:")
      ) {
        return false;
      }

      return true;
    });
  }, [requests]);

  // Stage counts for polygon chevron stepper
  const stageCounts = useMemo(() => {
    const counts: Record<SamplingFilterTab, number> = {
      all: samplingRequests.length,
      draft: 0,
      creative: 0,
      studio: 0,
      costing: 0,
      samp: 0,
      plant: 0,
      dispatched: 0,
      deal: 0,
    };

    samplingRequests.forEach((r) => {
      const stage = getStageIdForRequest(r) as SamplingFilterTab;
      if (counts[stage] !== undefined) {
        counts[stage]++;
      }
    });

    return counts;
  }, [samplingRequests]);

  // Telemetry Metrics for the 6 Executive Ribbon Cards
  const telemetryMetrics = useMemo(() => {
    const total = samplingRequests.length;
    let draftCount = 0;
    let designCount = 0;
    let engineeringCount = 0;
    let plantExecutionCount = 0;
    let completedCount = 0;

    samplingRequests.forEach((r) => {
      const stage = getStageIdForRequest(r);
      if (stage === "draft") {
        draftCount++;
      } else if (stage === "creative" || stage === "studio") {
        designCount++;
      } else if (stage === "costing" || stage === "samp") {
        engineeringCount++;
      } else if (stage === "plant") {
        plantExecutionCount++;
      } else if (stage === "dispatched" || stage === "deal") {
        completedCount++;
      }
    });

    const activeWorkloadSCU = (
      draftCount * 0.5 +
      designCount * 1.2 +
      engineeringCount * 1.5 +
      plantExecutionCount * 2.2
    ).toFixed(1);

    return {
      total,
      draftCount,
      designCount,
      engineeringCount,
      plantExecutionCount,
      completedCount,
      activeWorkloadSCU,
    };
  }, [samplingRequests]);

  // Helper for SLA calculation
  const getSlaEvaluation = (dateStr?: string | null) => {
    if (!dateStr) return { type: "normal" as const, label: "1.5d left", days: 1.5 };
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return { type: "normal" as const, label: dateStr, days: 3 };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const due = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { type: "overdue" as const, label: `Overdue ${Math.abs(diffDays)}d`, days: diffDays };
    } else if (diffDays === 0) {
      return { type: "today" as const, label: "Due Today", days: 0 };
    } else if (diffDays === 1) {
      return { type: "tomorrow" as const, label: "Due Tomorrow", days: 1 };
    } else if (diffDays <= 2) {
      return { type: "soon" as const, label: `${diffDays}d left`, days: diffDays };
    } else {
      return { type: "normal" as const, label: formatErpDate(dateStr), days: diffDays };
    }
  };

  // Filtering
  const filteredRequests = useMemo(() => {
    return samplingRequests.filter((r) => {
      // 1. Stage Tab Filter
      if (selectedStageTab !== "all") {
        const itemStage = getStageIdForRequest(r);
        if (itemStage !== selectedStageTab) return false;
      }

      // 2. Business Year
      if (selectedYear !== "ALL") {
        const itemYear = r.year || (r.dateRequestCreated ? getBusinessYearForDate(r.dateRequestCreated) : "");
        if (itemYear && itemYear !== selectedYear) return false;
      }

      // 3. Global Selected Plant
      if (selectedPlant !== "ALL") {
        const p = (r.targetPlant || "").toLowerCase();
        if (!p.includes(selectedPlant.toLowerCase())) return false;
      }

      // 4. Local Dropdown Plant Filter
      if (selectedPlantFilter !== "all") {
        const p = (r.targetPlant || "").toLowerCase();
        if (!p.includes(selectedPlantFilter.toLowerCase())) return false;
      }

      // 5. Local Dropdown Customer Filter
      if (selectedCustomerFilter !== "all" && r.customer !== selectedCustomerFilter) {
        return false;
      }

      // 6. SLA Filter
      if (selectedSlaFilter !== "all") {
        const sla = getSlaEvaluation(r.sampleRequiredDate);
        if (selectedSlaFilter === "overdue" && sla.type !== "overdue") return false;
        if (selectedSlaFilter === "soon" && sla.type !== "soon" && sla.type !== "today" && sla.type !== "tomorrow")
          return false;
        if (selectedSlaFilter === "ontrack" && sla.type === "overdue") return false;
      }

      // 7. Text Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const sr = (r.srNumber || "").toLowerCase();
        const mat = (r.materialCode || "").toLowerCase();
        const desc = (r.productDescription || "").toLowerCase();
        const cust = (r.customer || "").toLowerCase();
        const plant = (r.targetPlant || "").toLowerCase();
        const brand = (r.brandName || "").toLowerCase();

        return (
          sr.includes(q) ||
          mat.includes(q) ||
          desc.includes(q) ||
          cust.includes(q) ||
          plant.includes(q) ||
          brand.includes(q)
        );
      }

      return true;
    });
  }, [
    samplingRequests,
    selectedStageTab,
    selectedYear,
    selectedPlant,
    selectedPlantFilter,
    selectedCustomerFilter,
    selectedSlaFilter,
    searchTerm,
  ]);

  // Full Pipeline Requests for Kanban (unconstrained by stage filter tab)
  const kanbanRequests = useMemo(() => {
    return samplingRequests.filter((r) => {
      // 1. Business Year
      if (selectedYear !== "ALL") {
        const itemYear = r.year || (r.dateRequestCreated ? getBusinessYearForDate(r.dateRequestCreated) : "");
        if (itemYear && itemYear !== selectedYear) return false;
      }

      // 2. Global Selected Plant
      if (selectedPlant !== "ALL") {
        const p = (r.targetPlant || "").toLowerCase();
        if (!p.includes(selectedPlant.toLowerCase())) return false;
      }

      // 3. Local Dropdown Plant Filter
      if (selectedPlantFilter !== "all") {
        const p = (r.targetPlant || "").toLowerCase();
        if (!p.includes(selectedPlantFilter.toLowerCase())) return false;
      }

      // 4. Local Dropdown Customer Filter
      if (selectedCustomerFilter !== "all" && r.customer !== selectedCustomerFilter) {
        return false;
      }

      // 5. SLA Filter
      if (selectedSlaFilter !== "all") {
        const sla = getSlaEvaluation(r.sampleRequiredDate);
        if (selectedSlaFilter === "overdue" && sla.type !== "overdue") return false;
        if (selectedSlaFilter === "soon" && sla.type !== "soon" && sla.type !== "today" && sla.type !== "tomorrow")
          return false;
        if (selectedSlaFilter === "ontrack" && sla.type === "overdue") return false;
      }

      // 6. Text Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const sr = (r.srNumber || "").toLowerCase();
        const mat = (r.materialCode || "").toLowerCase();
        const desc = (r.productDescription || "").toLowerCase();
        const cust = (r.customer || "").toLowerCase();
        const plant = (r.targetPlant || "").toLowerCase();
        const brand = (r.brandName || "").toLowerCase();

        return (
          sr.includes(q) ||
          mat.includes(q) ||
          desc.includes(q) ||
          cust.includes(q) ||
          plant.includes(q) ||
          brand.includes(q)
        );
      }

      return true;
    });
  }, [
    samplingRequests,
    selectedYear,
    selectedPlant,
    selectedPlantFilter,
    selectedCustomerFilter,
    selectedSlaFilter,
    searchTerm,
  ]);

  // Paginated Slice
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));

  // Selection
  const handleToggleSelectRow = (id: string | number, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedRequests.map((r) => r.id)));
    }
  };

  const selectedDraftsCount = useMemo(() => {
    return requests.filter(
      (r) => selectedIds.has(r.id) && getStageIdForRequest(r) === "draft"
    ).length;
  }, [requests, selectedIds]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FA] dark:bg-[#0b0c10] select-text">

      {/* ── 1. Compact Page Header (Aligned to Marketing Desk Standards) ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-3 shrink-0">
        <div className="flex items-center justify-between gap-4">

          {/* Title + Desk Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
              Sample Orders & Manufacturing Workflow Workbench
            </h1>
            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#714B67]/10 text-[#714B67] dark:bg-purple-950/40 dark:text-purple-300 border border-[#714B67]/20">
              Marketing Desk
            </span>
          </div>

          {/* Action Buttons & Switchers */}
          <div className="flex items-center gap-2 shrink-0">

            {/* New Sample Request Registration */}
            <button
              type="button"
              onClick={onOpenNewModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
              title="Create New Commercial Sample Request"
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
              title="Export Filtered CSV"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* View Mode Toggle */}
            <div className="inline-flex rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-2 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1.5 ${viewMode === "list"
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
                className={`px-2 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1.5 ${viewMode === "kanban"
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

        {/* ── 2. KPI Metric Cards Ribbon (Exact 6 Executive Cards) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-3 pt-3 border-t border-[#F1F5F9] dark:border-white/[0.05]">

          {/* Card 1: Total Portfolio Intake */}
          <div
            onClick={() => {
              setSelectedStageTab("all");
              setCurrentPage(1);
            }}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${selectedStageTab === "all"
              ? "border-[#714B67] bg-[#714B67]/5 dark:bg-[#714B67]/20 shadow-2xs"
              : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-neutral-300"
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-neutral-500 dark:text-zinc-400 font-mono tracking-wider">
                Total Intake
              </span>
              <Package className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-zinc-100 mt-0.5">
              {isLoading ? "—" : telemetryMetrics.total}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">Sampling Portfolio</div>
          </div>

          {/* Card 2: Pre-PMT Drafts */}
          <div
            onClick={() => {
              setSelectedStageTab("draft");
              setCurrentPage(1);
            }}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${selectedStageTab === "draft"
              ? "border-amber-400 bg-amber-500/10 dark:bg-amber-950/30 shadow-2xs"
              : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-amber-300"
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-amber-700 dark:text-amber-300 font-mono tracking-wider">
                Pre-PMT Drafts
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-900 dark:text-amber-200 mt-0.5">
              {isLoading ? "—" : telemetryMetrics.draftCount}
            </div>
            <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-mono">
              Awaiting PMT Release
            </div>
          </div>

          {/* Card 3: Creative & CAD Design */}
          <div
            onClick={() => {
              setSelectedStageTab("creative");
              setCurrentPage(1);
            }}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${selectedStageTab === "creative" || selectedStageTab === "studio"
              ? "border-sky-400 bg-sky-500/10 dark:bg-sky-950/30 shadow-2xs"
              : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-sky-300"
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-sky-700 dark:text-sky-300 font-mono tracking-wider">
                Creative & CAD
              </span>
              <Palette className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-xl font-bold font-mono text-sky-900 dark:text-sky-200 mt-0.5">
              {isLoading ? "—" : telemetryMetrics.designCount}
            </div>
            <div className="text-[10px] text-sky-700/80 dark:text-sky-400/80 font-mono">
              Briefs & Dielines
            </div>
          </div>

          {/* Card 4: Costing & Prototyping Review */}
          <div
            onClick={() => {
              setSelectedStageTab("samp");
              setCurrentPage(1);
            }}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${selectedStageTab === "costing" || selectedStageTab === "samp"
              ? "border-[#714B67] bg-[#714B67]/10 dark:bg-[#714B67]/30 shadow-2xs"
              : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-[#714B67]/50"
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-[#714B67] dark:text-purple-300 font-mono tracking-wider">
                Costing & SAMP
              </span>
              <FlaskConical className="w-3.5 h-3.5 text-[#714B67] dark:text-purple-400" />
            </div>
            <div className="text-xl font-bold font-mono text-[#714B67] dark:text-purple-200 mt-0.5">
              {isLoading ? "—" : telemetryMetrics.engineeringCount}
            </div>
            <div className="text-[10px] text-purple-700/80 dark:text-purple-400/80 font-mono">
              BOM & Lab Review
            </div>
          </div>

          {/* Card 5: Plant Floor Execution */}
          <div
            onClick={() => {
              setSelectedStageTab("plant");
              setCurrentPage(1);
            }}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${selectedStageTab === "plant"
              ? "border-indigo-400 bg-indigo-500/10 dark:bg-indigo-950/30 shadow-2xs"
              : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-indigo-300"
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-indigo-700 dark:text-indigo-300 font-mono tracking-wider">
                Plant Execution
              </span>
              <Factory className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-xl font-bold font-mono text-indigo-900 dark:text-indigo-200 mt-0.5">
              {isLoading ? "—" : telemetryMetrics.plantExecutionCount}
            </div>
            <div className="text-[10px] text-indigo-700/80 dark:text-indigo-400/80 font-mono">
              Machine Floor Units
            </div>
          </div>

          {/* Card 6: Workload & Fulfillment */}
          <div
            onClick={() => {
              setSelectedStageTab("dispatched");
              setCurrentPage(1);
            }}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${selectedStageTab === "dispatched" || selectedStageTab === "deal"
              ? "border-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/30 shadow-2xs"
              : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-emerald-300"
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-emerald-700 dark:text-emerald-300 font-mono tracking-wider">
                Closed / Won Deals
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-900 dark:text-emerald-200 mt-0.5">
              {isLoading ? "—" : telemetryMetrics.completedCount}
            </div>
            <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-mono">
              {telemetryMetrics.activeWorkloadSCU} SCU Effort
            </div>
          </div>

        </div>

      </div>

      {/* ── 3. Segmented Filter Pills & Control Strip ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3">

        {/* Left: Enterprise Segmented Stage Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {SAMPLING_STAGES.map((tab) => {
            const isActive = selectedStageTab === tab.id;
            const count = stageCounts[tab.id] || 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedStageTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded font-mono text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${isActive
                  ? "bg-[#714B67] text-white shadow-2xs"
                  : "text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-white/[0.04]"
                  }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-mono ${isActive
                    ? "bg-white/20 text-white"
                    : "bg-neutral-200/70 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400"
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Search & Facet Filters Group */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end flex-wrap">

          {/* Batch Actions when items are selected */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 border border-[#714B67]/30 px-2 py-1 rounded">
              <span className="font-bold text-xs text-[#714B67] dark:text-purple-300 font-mono">
                {selectedIds.size} Selected
              </span>
              {selectedDraftsCount > 0 && (
                <button
                  type="button"
                  onClick={() => onBatchReleaseDraft(selectedIds)}
                  className="bg-[#714B67] hover:bg-[#5B3C53] text-white text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="Release selected drafts to active PMT workflow"
                >
                  <Send className="w-3 h-3" />
                  <span>Release ({selectedDraftsCount})</span>
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onBatchDelete(selectedIds)}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                  title="Delete selected requests"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-zinc-200 text-[10px] underline ml-1 cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          {/* Plant Filter Dropdown */}
          {uniquePlants.length > 0 && (
            <div className="flex items-center">
              <select
                value={selectedPlantFilter}
                onChange={(e) => {
                  setSelectedPlantFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 px-2.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-700 dark:text-zinc-200 focus:outline-none focus:border-[#714B67] cursor-pointer"
              >
                <option value="all">All Plants</option>
                {uniquePlants.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Customer Filter Dropdown */}
          {uniqueCustomers.length > 0 && (
            <div className="flex items-center">
              <select
                value={selectedCustomerFilter}
                onChange={(e) => {
                  setSelectedCustomerFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 px-2.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-700 dark:text-zinc-200 focus:outline-none focus:border-[#714B67] cursor-pointer"
              >
                <option value="all">All Customers</option>
                {uniqueCustomers.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* SLA Status Filter Dropdown */}
          <select
            value={selectedSlaFilter}
            onChange={(e) => {
              setSelectedSlaFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 px-2.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-700 dark:text-zinc-200 focus:outline-none focus:border-[#714B67] cursor-pointer"
          >
            <option value="all">All SLAs</option>
            <option value="overdue">⚠️ Overdue</option>
            <option value="soon">⏳ Due Within 48h</option>
            <option value="ontrack">✓ On Track</option>
          </select>

          {/* Search Input Box */}
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search SR#, material, title, customer..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
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

      {/* ── 4. Main Body: Table View or Kanban Swimlanes (Aligned to Feasibility Workbench) ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {viewMode === "list" && (
          filteredRequests.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-zinc-800/80 flex items-center justify-center text-neutral-400 mb-3 border border-neutral-200 dark:border-zinc-700">
                <Package className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-neutral-800 dark:text-zinc-200 mb-1">
                No Sampling Requests Found
              </h3>
              <p className="text-xs text-neutral-500 dark:text-zinc-400 max-w-md mb-4 font-sans">
                {searchTerm || selectedCustomerFilter !== "all" || selectedPlantFilter !== "all" || selectedStageTab !== "all" || selectedSlaFilter !== "all"
                  ? "No sample requests match your active filter criteria. Try resetting your search or selecting another stage tab."
                  : "There are currently no sampling requests registered in this category."}
              </p>
              {(searchTerm || selectedCustomerFilter !== "all" || selectedPlantFilter !== "all" || selectedStageTab !== "all" || selectedSlaFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCustomerFilter("all");
                    setSelectedPlantFilter("all");
                    setSelectedSlaFilter("all");
                    setSelectedStageTab("all");
                    setCurrentPage(1);
                  }}
                  className="px-3.5 py-1.5 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 font-mono transition cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            /* ── Table View in Card Container ── */
            <div className="bg-white dark:bg-[#12141d] rounded-lg border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    {selectedStageTab === "draft" ? (
                      /* Dedicated Enterprise Draft Program Table Header */
                      <tr className="border-b border-[#CED4DA] dark:border-zinc-700 bg-[#F8F9FA] dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 font-mono text-[10.5px] font-bold uppercase tracking-wider select-none">
                        <th className="py-2.5 px-3 w-8 text-center border-r border-[#CED4DA] dark:border-zinc-700">
                          <input
                            type="checkbox"
                            checked={
                              paginatedRequests.length > 0 &&
                              paginatedRequests.every((r) => selectedIds.has(r.id))
                            }
                            onChange={handleToggleSelectAll}
                            className="rounded border-[#CED4DA] dark:border-zinc-700 text-[#714B67] focus:ring-[#714B67] cursor-pointer"
                          />
                        </th>
                        <th className="py-2.5 px-3.5 border-r border-[#CED4DA] dark:border-zinc-700 w-36">
                          Reference / SR
                        </th>
                        <th className="py-2.5 px-4 border-r border-[#CED4DA] dark:border-zinc-700">
                          Program Name &amp; Description
                        </th>
                        <th className="py-2.5 px-4 border-r border-[#CED4DA] dark:border-zinc-700 w-48">
                          Customer Account
                        </th>
                        <th className="py-2.5 px-3.5 border-r border-[#CED4DA] dark:border-zinc-700 w-32">
                          Program Year
                        </th>
                        <th className="py-2.5 px-3.5 border-r border-[#CED4DA] dark:border-zinc-700 w-44">
                          Target Plant
                        </th>
                        <th className="py-2.5 px-3.5 border-r border-[#CED4DA] dark:border-zinc-700 w-32">
                          Status
                        </th>
                        <th className="py-2.5 px-3.5 border-r border-[#CED4DA] dark:border-zinc-700 w-32">
                          Created Date
                        </th>
                        <th className="py-2.5 px-4 text-right pr-4 w-52">
                          Draft Actions
                        </th>
                      </tr>
                    ) : (
                      /* Standard Multi-Stage Sampling Table Header */
                      <tr className="border-b border-[#E2E8F0] dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-zinc-900/60 text-neutral-500 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider select-none">
                        <th className="py-2.5 px-3 w-8 text-center">
                          <input
                            type="checkbox"
                            checked={
                              paginatedRequests.length > 0 &&
                              paginatedRequests.every((r) => selectedIds.has(r.id))
                            }
                            onChange={handleToggleSelectAll}
                            className="rounded border-[#CED4DA] dark:border-zinc-700 text-[#714B67] focus:ring-[#714B67] cursor-pointer"
                          />
                        </th>
                        <th className="py-2.5 px-4 font-semibold w-36">Reference / SR</th>
                        <th className="py-2.5 px-4 font-semibold w-28">SAP Code</th>
                        <th className="py-2.5 px-4 font-semibold">Sample Description</th>
                        <th className="py-2.5 px-4 font-semibold w-40">Customer</th>
                        <th className="py-2.5 px-4 font-semibold w-36">Plant Queue</th>
                        <th className="py-2.5 px-4 font-semibold w-32">Stage</th>
                        <th className="py-2.5 px-4 font-semibold w-32">Target SLA</th>
                        <th className="py-2.5 px-4 font-semibold w-24 text-center">Effort</th>
                        <th className="py-2.5 px-4 font-semibold text-right pr-5">Actions</th>
                      </tr>
                    )}
                  </thead>

                  <tbody className="divide-y divide-[#E2E8F0] dark:divide-white/[0.06] bg-white dark:bg-[#12141d]">
                    {isLoading ? (
                      <tr>
                        <td colSpan={10} className="p-12 text-center text-neutral-400 font-mono">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-[#017E84]" />
                            <span>Loading sample requests from database...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedRequests.map((row) => {
                        const isDraft = getStageIdForRequest(row) === "draft";
                        const srCode = row.srNumber || `SR-${row.id}`;
                        const sla = getSlaEvaluation(row.sampleRequiredDate);

                        if (selectedStageTab === "draft") {
                          /* DRAFT ROW: Direct click routes to Product Staging (NO INSPECT MODAL) */
                          return (
                            <tr
                              key={row.id}
                              onClick={() => handleOpenDraftInStaging(row)}
                              className={`border-b border-[#E2E8F0] dark:border-white/[0.06] hover:bg-[#F3E8EE]/40 dark:hover:bg-purple-950/20 transition cursor-pointer select-text ${
                                selectedIds.has(row.id) ? "bg-purple-50/70 dark:bg-purple-950/30" : ""
                              }`}
                            >
                              {/* Checkbox */}
                              <td
                                className="py-3 px-3 text-center border-r border-[#E2E8F0] dark:border-zinc-800"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(row.id)}
                                  onChange={(e) => handleToggleSelectRow(row.id, e)}
                                  className="rounded border-[#CED4DA] dark:border-zinc-700 text-[#714B67] focus:ring-[#714B67] cursor-pointer"
                                />
                              </td>

                              {/* Reference / SR */}
                              <td className="py-3 px-3.5 font-mono font-bold text-[#714B67] dark:text-purple-300 border-r border-[#E2E8F0] dark:border-zinc-800">
                                <div className="flex items-center space-x-1.5">
                                  <span>{srCode}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopyCode(srCode, e)}
                                    className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200 cursor-pointer"
                                    title="Copy Reference"
                                  >
                                    {copiedId === srCode ? (
                                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* Program Name & Description */}
                              <td className="py-3 px-4 border-r border-[#E2E8F0] dark:border-zinc-800">
                                <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-1">
                                  {row.programName || row.productDescription || "Commercial Program Sample"}
                                </div>
                                <div className="text-[11px] text-[#64748B] dark:text-zinc-400 mt-0.5 line-clamp-1">
                                  {row.productDescription}
                                </div>
                              </td>

                              {/* Customer Account */}
                              <td className="py-3 px-4 font-semibold text-zinc-800 dark:text-zinc-200 border-r border-[#E2E8F0] dark:border-zinc-800">
                                <div className="flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-[#714B67] shrink-0" />
                                  <span className="truncate">{row.customer || "—"}</span>
                                </div>
                              </td>

                              {/* Program Year */}
                              <td className="py-3 px-3.5 font-mono font-bold text-zinc-700 dark:text-zinc-300 border-r border-[#E2E8F0] dark:border-zinc-800">
                                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] border border-zinc-200 dark:border-zinc-700">
                                  {row.programYear || row.year || "2026"}
                                </span>
                              </td>

                              {/* Target Plant */}
                              <td className="py-3 px-3.5 text-zinc-700 dark:text-zinc-300 font-medium border-r border-[#E2E8F0] dark:border-zinc-800">
                                <div className="flex items-center gap-1.5">
                                  <Factory className="w-3.5 h-3.5 text-[#714B67] shrink-0" />
                                  <span className="truncate">{row.targetPlant || "Navneet - Khaniwade"}</span>
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-3.5 border-r border-[#E2E8F0] dark:border-zinc-800">
                                <StatusPill status={row.status || "Draft (Pre-SMT)"} />
                              </td>

                              {/* Created Date */}
                              <td className="py-3 px-3.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 border-r border-[#E2E8F0] dark:border-zinc-800">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                                  <span>{row.dateRequestCreated || "2026-10-01"}</span>
                                </div>
                              </td>

                              {/* Draft Actions */}
                              <td
                                className="py-3 px-4 text-right pr-4"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenDraftInStaging(row, e)}
                                    className="bg-[#714B67] hover:bg-[#5B3C53] text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                                    title="Open and edit in Product Staging Workspace"
                                  >
                                    <Package className="w-3 h-3" />
                                    <span>Open Staging</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onReleaseDraft(row)}
                                    className="bg-[#017E84] hover:bg-[#00666A] text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                                    title="Release this request to active PMT / Sampling workflow"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>Release</span>
                                  </button>

                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={(e) => onDeleteRequest(row, e)}
                                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
                                      title="Delete draft request"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        /* STANDARD ROW FOR ACTIVE STAGES */
                        return (
                          <tr
                            key={row.id}
                            onClick={() => {
                              if (isDraft) {
                                handleOpenDraftInStaging(row);
                              } else {
                                onInspectRequest(row);
                              }
                            }}
                            className={`border-b border-[#E2E8F0] dark:border-white/[0.06] hover:bg-[#F8F9FA] dark:hover:bg-white/[0.03] transition cursor-pointer select-text ${
                              selectedIds.has(row.id) ? "bg-purple-50/60 dark:bg-purple-950/20" : ""
                            }`}
                          >
                            {/* Checkbox */}
                            <td
                              className="py-3 px-3 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={selectedIds.has(row.id)}
                                onChange={(e) => handleToggleSelectRow(row.id, e)}
                                className="rounded border-[#CED4DA] dark:border-zinc-700 text-[#714B67] focus:ring-[#714B67] cursor-pointer"
                              />
                            </td>

                            {/* Reference Number */}
                            <td className="py-3 px-4 font-mono font-bold text-[#714B67] dark:text-purple-300">
                              <div className="flex items-center space-x-1.5">
                                <span>{srCode}</span>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyCode(srCode, e)}
                                  className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200 cursor-pointer"
                                  title="Copy Reference Number"
                                >
                                  {copiedId === srCode ? (
                                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* SAP Code */}
                            <td className="py-3 px-4 font-mono text-neutral-600 dark:text-zinc-400">
                              {row.materialCode ? (
                                <span className="bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 px-1.5 py-0.5 rounded text-[10px] font-semibold text-neutral-700 dark:text-zinc-300">
                                  {row.materialCode}
                                </span>
                              ) : (
                                <span className="text-neutral-400">—</span>
                              )}
                            </td>

                            {/* Sample / Product Description */}
                            <td className="py-3 px-4 font-medium text-neutral-900 dark:text-zinc-100 max-w-xs sm:max-w-md">
                              <div className="line-clamp-1 font-semibold">
                                {row.productDescription || "Commercial Product Sample"}
                              </div>
                              {row.brandName && (
                                <div className="text-[10px] text-neutral-400 font-sans mt-0.5 flex items-center gap-1">
                                  <span>Brand: {row.brandName}</span>
                                </div>
                              )}
                            </td>

                            {/* Customer */}
                            <td className="py-3 px-4 text-neutral-700 dark:text-zinc-300 font-medium">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                <span className="truncate">{row.customer || "—"}</span>
                              </div>
                            </td>

                            {/* Plant Queue */}
                            <td className="py-3 px-4 font-mono text-neutral-600 dark:text-zinc-400">
                              <div className="flex items-center gap-1.5">
                                <Factory className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                <span className="truncate">{row.targetPlant || "Unassigned"}</span>
                              </div>
                            </td>

                            {/* Workflow Stage */}
                            <td className="py-3 px-4">
                              <StatusPill status={row.status || "Draft"} />
                            </td>

                            {/* Target SLA */}
                            <td className="py-3 px-4 font-mono">
                              {sla.type === "overdue" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                                  <span>{sla.label}</span>
                                </span>
                              ) : sla.type === "today" || sla.type === "tomorrow" || sla.type === "soon" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                                  <Clock className="w-3 h-3 text-amber-500" />
                                  <span>{sla.label}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-50 text-neutral-700 dark:bg-zinc-800/80 dark:text-zinc-300 border border-neutral-200 dark:border-zinc-700">
                                  <Calendar className="w-3 h-3 text-neutral-400" />
                                  <span>{sla.label}</span>
                                </span>
                              )}
                            </td>

                            {/* Effort */}
                            <td className="py-3 px-4 text-center font-mono font-bold text-[#714B67] dark:text-purple-300">
                              1.40 SCU
                            </td>

                            {/* Row Actions */}
                            <td
                              className="py-3 px-4 text-right pr-5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end space-x-1.5">
                                {isDraft ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenDraftInStaging(row, e)}
                                      className="bg-[#714B67] hover:bg-[#5B3C53] text-white text-[10.5px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                      title="Open in Product Staging"
                                    >
                                      <Package className="w-3 h-3" />
                                      <span>Staging</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onReleaseDraft(row)}
                                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded flex items-center space-x-1 transition cursor-pointer"
                                      title="Release Draft to active PMT workflow"
                                    >
                                      <Send className="w-2.5 h-2.5" />
                                      <span>Release</span>
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onInspectRequest(row)}
                                    className="p-1 text-neutral-400 hover:text-[#714B67] dark:hover:text-purple-300 transition cursor-pointer"
                                    title="Inspect Sample Request Details"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={(e) => onDeleteRequest(row, e)}
                                    className="p-1 text-rose-400 hover:text-rose-600 transition cursor-pointer"
                                    title="Delete request"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Document Pager Footer inside List Card */}
              <div className="px-4 py-2.5 bg-[#F8F9FA] dark:bg-zinc-900/60 border-t border-[#E2E8F0] dark:border-white/[0.08] flex items-center justify-between text-xs text-neutral-500 dark:text-zinc-400 font-mono">
                <div>
                  Showing{" "}
                  <strong className="text-neutral-900 dark:text-white font-mono">
                    {filteredRequests.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                  </strong>{" "}
                  to{" "}
                  <strong className="text-neutral-900 dark:text-white font-mono">
                    {Math.min(currentPage * pageSize, filteredRequests.length)}
                  </strong>{" "}
                  of{" "}
                  <strong className="text-neutral-900 dark:text-white font-mono">
                    {filteredRequests.length}
                  </strong>{" "}
                  requests
                </div>

                <div className="flex items-center space-x-1.5 font-mono">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 disabled:opacity-40 cursor-pointer transition shadow-2xs text-xs"
                  >
                    Prev
                  </button>
                  <span className="px-2 font-bold text-neutral-700 dark:text-zinc-300 text-xs">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 disabled:opacity-40 cursor-pointer transition shadow-2xs text-xs"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {viewMode === "kanban" && (
          /* Kanban Swimlanes Pipeline View */
              <div className="overflow-x-auto min-h-[500px]">
                <div className="flex space-x-4 min-w-max items-start">
                  {KANBAN_COLUMNS.map((col) => {
                    const itemsInCol = kanbanRequests.filter((r) => {
                      const raw = getStageIdForRequest(r);
                      return (raw === "deal" ? "dispatched" : raw) === col.id;
                    });

                    return (
                      <div
                        key={col.id}
                        onDragOver={(e) => handleColDragOver(e, col.id)}
                        onDragLeave={() => setDragOverCol((prev) => (prev === col.id ? null : prev))}
                        onDrop={(e) => handleColDrop(e, col.id)}
                        className={`w-76 rounded-lg border transition-colors duration-100 ${dragOverCol === col.id
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
                            itemsInCol.map((r) => {
                              const sr = r.srNumber || `SR-${r.id}`;
                              const isDraft = col.id === "draft";
                              const sla = getSlaEvaluation(r.sampleRequiredDate);

                              return (
                                <div
                                  key={r.id}
                                  draggable={true}
                                  onDragStart={(e) => handleDragStart(e, r.id)}
                                  onDragEnd={handleDragEnd}
                                  onClick={() => onInspectRequest(r)}
                                  className={`bg-white dark:bg-[#161822] p-3 rounded-lg border border-[#D8DADD] dark:border-white/[0.08] shadow-2xs hover:border-[#714B67] dark:hover:border-purple-400 hover:shadow-xs cursor-grab active:cursor-grabbing transition group ${draggedId === r.id ? "opacity-40 scale-95 border-dashed border-[#714B67]" : ""
                                    }`}
                                >
                                  <div className="flex justify-between items-center text-[10px] font-mono">
                                    <span className="font-bold text-[#714B67] dark:text-purple-300">
                                      {sr}
                                    </span>
                                    <span className="bg-purple-50 dark:bg-purple-950/50 text-[#714B67] dark:text-purple-300 px-1.5 py-0.2 rounded font-bold">
                                      1.40 SCU
                                    </span>
                                  </div>

                                  <div className="font-bold text-neutral-900 dark:text-zinc-100 text-xs mt-1.5 line-clamp-2">
                                    {r.productDescription || "Commercial Product Sample"}
                                  </div>

                                  <div className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-1 flex items-center space-x-1 truncate">
                                    <span>{r.customer || "Staples"}</span>
                                    <span>•</span>
                                    <span>{r.targetPlant || "0100 Pune"}</span>
                                  </div>

                                  {/* Priority Stars */}
                                  <div className="flex items-center space-x-0.5 text-amber-400 text-xs mt-2">
                                    <Star className="w-3 h-3 fill-amber-400" />
                                    <Star className="w-3 h-3 fill-amber-400" />
                                    <Star className="w-3 h-3 fill-amber-400" />
                                    <Star className="w-3 h-3 text-neutral-300 dark:text-zinc-700" />
                                  </div>

                                  {/* Footer */}
                                  <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-white/[0.06] flex justify-between items-center text-[10px]">
                                    <span
                                      className={`font-mono font-bold ${sla.type === "overdue"
                                        ? "text-rose-600 dark:text-rose-400"
                                        : sla.type === "soon" || sla.type === "today"
                                          ? "text-amber-600 dark:text-amber-400"
                                          : "text-emerald-700 dark:text-emerald-400"
                                        }`}
                                    >
                                      {sla.label}
                                    </span>

                                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                      <select
                                        value={col.id}
                                        onChange={async (e) => {
                                          const nextCol = e.target.value;
                                          if (nextCol === col.id) return;
                                          const STAGE_STATUS_MAP: Record<string, string> = {
                                            draft: "Draft",
                                            creative: "Creative",
                                            studio: "Studio CAD",
                                            costing: "Costing Review",
                                            samp: "Sampling Review (PMT)",
                                            plant: "Plant Floor Execution",
                                            dispatched: "Dispatched",
                                          };
                                          if (col.id === "draft" && nextCol !== "draft") {
                                            await onReleaseDraft(r);
                                          }
                                          if (nextCol !== "draft" && onUpdateStatus) {
                                            await onUpdateStatus(r.id, STAGE_STATUS_MAP[nextCol] || "Sampling Review (PMT)");
                                          }
                                        }}
                                        className="text-[9px] font-mono font-bold bg-neutral-50 hover:bg-neutral-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-600 dark:text-zinc-300 border border-neutral-200 dark:border-zinc-700 rounded px-1 py-0.5 cursor-pointer outline-none"
                                        title="Move to stage"
                                      >
                                        <option value="draft">Draft</option>
                                        <option value="creative">Creative</option>
                                        <option value="studio">Studio CAD</option>
                                        <option value="costing">Costing</option>
                                        <option value="samp">SAMP Lab</option>
                                        <option value="plant">Plant Floor</option>
                                        <option value="dispatched">Dispatched</option>
                                      </select>

                                      {isDraft ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onReleaseDraft(r);
                                          }}
                                          className="bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-[#714B67] dark:text-purple-300 px-2 py-0.5 rounded font-bold text-[9px] border border-[#714B67]/30 cursor-pointer flex items-center gap-1 shadow-2xs"
                                        >
                                          <Send className="w-2.5 h-2.5" />
                                          <span>Release</span>
                                        </button>
                                      ) : (
                                        <span className="w-5 h-5 rounded-full bg-[#714B67] text-white font-bold flex items-center justify-center text-[9px] shadow-2xs">
                                          {(r.createdBy || "MK").slice(0, 2).toUpperCase()}
                                        </span>
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

export default SamplingRequestsPage;
