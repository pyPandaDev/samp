import React, { useState, useMemo } from "react";
import {
  Palette,
  Search,
  Plus,
  Download,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
  FileCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  Layers,
  Eye,
  Sliders,
} from "lucide-react";
import { CreativeBriefItem, SampleRequestItem } from "@/features/sample-requests/types";
import { StatusPill } from "@/components/ui/StatusPill";

export interface CreativeDesignPageProps {
  briefs: CreativeBriefItem[];
  designRequests: SampleRequestItem[];
  selectedYear: string;
  onOpenNewBriefModal?: () => void;
  onInspectBrief: (brief: CreativeBriefItem) => void;
  onInspectRequest: (req: SampleRequestItem) => void;
  onUpdateStatus?: (
    id: string,
    newStatus: CreativeBriefItem["proofStatus"],
    notes?: string
  ) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export const CreativeDesignPage: React.FC<CreativeDesignPageProps> = ({
  briefs,
  designRequests,
  selectedYear,
  onOpenNewBriefModal,
  onInspectBrief,
  onInspectRequest,
  onUpdateStatus,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1200);
  };

  // Merge and normalize briefs and design requests
  const unifiedDesigns = useMemo(() => {
    const list: Array<{
      id: string;
      refCode: string;
      title: string;
      customer: string;
      category: string;
      variantsCount: number;
      designer: string;
      dueDate: string;
      colorSpecs: string;
      proofStatus: CreativeBriefItem["proofStatus"];
      accentColor: string;
      isBrief: boolean;
      rawBrief?: CreativeBriefItem;
      rawReq?: SampleRequestItem;
    }> = [];

    // 1. From briefs
    briefs.forEach((b) => {
      list.push({
        id: b.id,
        refCode: b.artCode,
        title: b.title,
        customer: b.brand,
        category: b.category,
        variantsCount: b.variantsCount,
        designer: b.designer,
        dueDate: b.dueDate,
        colorSpecs: b.colorSpecs,
        proofStatus: b.proofStatus,
        accentColor: b.accentColor || "#714B67",
        isBrief: true,
        rawBrief: b,
      });
    });

    // 2. From design-scoped requests
    designRequests.forEach((d) => {
      let status: CreativeBriefItem["proofStatus"] = "Brief Intake";
      const s = String(d.status || "").toLowerCase();
      if (s.includes("approved") || s.includes("released")) status = "Prepress Approved";
      else if (s.includes("review")) status = "Client Review";
      else if (s.includes("creative")) status = "In Concept";

      list.push({
        id: String(d.id),
        refCode: d.srNumber || `DSG-${d.id}`,
        title: d.productDescription || (d as any).opportunityName || d.programName || "Graphic Design Request",
        customer: d.customer || "General Customer",
        category: "Notebook Covers",
        variantsCount: Number(d.designsCustomerCreative || d.productArtworkNos) || 1,
        designer: d.createdBy || "Creative Studio",
        dueDate: d.sampleRequiredDate || d.targetArtworkDateCreative || "Standard SLA",
        colorSpecs: "CMYK + Spot Pantone",
        proofStatus: status,
        accentColor: "#017E84",
        isBrief: false,
        rawReq: d,
      });
    });

    return list;
  }, [briefs, designRequests]);

  // Stage filters matching Marketing structure
  const stages = useMemo(() => [
    { id: "all", label: "All Designs", count: unifiedDesigns.length, sub: "Total Graphic Assets" },
    {
      id: "intake",
      label: "Brief Intake",
      count: unifiedDesigns.filter((d) => d.proofStatus === "Brief Intake").length,
      sub: "Awaiting Ideation",
    },
    {
      id: "concept",
      label: "Concept Ideation",
      count: unifiedDesigns.filter((d) => d.proofStatus === "In Concept").length,
      sub: "Art Moodboard",
    },
    {
      id: "revisions",
      label: "Revisions",
      count: unifiedDesigns.filter((d) => d.proofStatus === "Revisions Requested").length,
      sub: "Art Tweaks",
    },
    {
      id: "review",
      label: "Client Review",
      count: unifiedDesigns.filter((d) => d.proofStatus === "Client Review").length,
      sub: "Proof Approval",
    },
    {
      id: "approved",
      label: "Prepress Certified",
      count: unifiedDesigns.filter((d) => d.proofStatus === "Prepress Approved").length,
      sub: "Ready for Print",
    },
  ], [unifiedDesigns]);

  // Unique categories for dropdown
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    unifiedDesigns.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    return Array.from(set).sort();
  }, [unifiedDesigns]);

  // Filtered designs
  const filteredDesigns = useMemo(() => {
    return unifiedDesigns.filter((item) => {
      // Stage filter
      if (selectedStage !== "all") {
        if (selectedStage === "intake" && item.proofStatus !== "Brief Intake") return false;
        if (selectedStage === "concept" && item.proofStatus !== "In Concept") return false;
        if (selectedStage === "revisions" && item.proofStatus !== "Revisions Requested") return false;
        if (selectedStage === "review" && item.proofStatus !== "Client Review") return false;
        if (selectedStage === "approved" && item.proofStatus !== "Prepress Approved") return false;
      }

      // Category filter
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        return (
          item.refCode.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.customer.toLowerCase().includes(q) ||
          item.designer.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [unifiedDesigns, selectedStage, selectedCategory, searchTerm]);

  const handleExportCSV = () => {
    const headers = ["Ref Code", "Title", "Customer", "Category", "Variants", "Designer", "Color Specs", "Status", "Due Date"];
    const rows = filteredDesigns.map((d) => [
      `"${d.refCode}"`,
      `"${d.title}"`,
      `"${d.customer}"`,
      `"${d.category}"`,
      `"${d.variantsCount}"`,
      `"${d.designer}"`,
      `"${d.colorSpecs}"`,
      `"${d.proofStatus}"`,
      `"${d.dueDate}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `creative_designs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefreshClick = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FA] dark:bg-[#0b0c10] select-text">
      {/* ── 1. Compact Page Header (Aligned to Marketing Desk Standards) ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* Title + Desk Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
              Artwork Design Briefs &amp; Graphic Assets Workbench
            </h1>
            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#714B67]/10 text-[#714B67] dark:bg-purple-950/40 dark:text-purple-300 border border-[#714B67]/20">
              Creative Desk
            </span>
          </div>

          {/* Action Buttons & View Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenNewBriefModal && (
              <button
                type="button"
                onClick={onOpenNewBriefModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                title="Create New Graphic Design Brief"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Refresh Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#017E84]" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredDesigns.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Export Filtered CSV"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* View Mode Toggle (Enterprise style) */}
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
                title="Kanban Board View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">Kanban</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. KPI Metric Cards Ribbon (Exact 6 Executive Cards Aligned to Marketing) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-3 pt-3 border-t border-[#F1F5F9] dark:border-white/[0.05]">
          {stages.map((stage) => {
            const isSelected = selectedStage === stage.id;
            return (
              <div
                key={stage.id}
                onClick={() => setSelectedStage(stage.id)}
                className={`p-2.5 rounded-lg border transition cursor-pointer ${
                  isSelected
                    ? "border-[#714B67] bg-[#714B67]/5 dark:bg-[#714B67]/20 shadow-2xs"
                    : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-neutral-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] uppercase font-bold text-neutral-500 dark:text-zinc-400 font-mono tracking-wider">
                    {stage.label}
                  </span>
                  <Palette className="w-3.5 h-3.5 text-neutral-400" />
                </div>
                <div className="text-xl font-bold font-mono text-neutral-900 dark:text-zinc-100 mt-0.5">
                  {stage.count}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono">{stage.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Segmented Filter Pills & Control Strip (Aligned to Marketing Desk) ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Enterprise Segmented Stage Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {stages.map((tab) => {
            const isActive = selectedStage === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStage(tab.id)}
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

        {/* Right: Search & Category Dropdown */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end flex-wrap">
          {uniqueCategories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 px-2.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-700 dark:text-zinc-200 focus:outline-none focus:border-[#714B67] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search code, title, customer..."
              className="h-8 pl-8 pr-3 w-48 sm:w-64 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 focus:outline-none focus:border-[#714B67]"
            />
          </div>
        </div>
      </div>

      {/* ── 4. Main Body: Table View or Kanban View ── */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {filteredDesigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs">
            <Palette className="w-10 h-10 text-neutral-300 dark:text-zinc-600 mb-3" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              No design briefs match the selected filters
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Try adjusting your stage, category dropdown, or search query.
            </p>
          </div>
        ) : viewMode === "list" ? (
          /* Enterprise ERP Table View */
          <div className="bg-white dark:bg-[#12141d] rounded-xl border border-[#E2E8F0] dark:border-white/[0.08] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] dark:bg-zinc-900/80 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-[#E2E8F0] dark:border-white/[0.08]">
                  <tr>
                    <th className="py-2.5 px-3">Ref Code</th>
                    <th className="py-2.5 px-3">Project Title</th>
                    <th className="py-2.5 px-3">Customer / Brand</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Variants</th>
                    <th className="py-2.5 px-3">Color Specs</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] dark:divide-white/[0.04]">
                  {filteredDesigns.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        if (item.isBrief && item.rawBrief) onInspectBrief(item.rawBrief);
                        else if (!item.isBrief && item.rawReq) onInspectRequest(item.rawReq);
                      }}
                      className="hover:bg-neutral-50/80 dark:hover:bg-zinc-800/40 transition cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-[#714B67] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{item.refCode}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(item.refCode, e)}
                            className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-400 hover:text-neutral-700"
                            title="Copy Code"
                          >
                            {copiedCode === item.refCode ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-900 dark:text-zinc-100 font-medium">
                        {item.title}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600 dark:text-zinc-400 whitespace-nowrap">
                        {item.customer}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-500 whitespace-nowrap">
                        {item.category}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-zinc-800 text-[11px] font-semibold text-neutral-700 dark:text-zinc-300">
                          {item.variantsCount} Artworks
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                        {item.colorSpecs}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                        {item.dueDate}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <StatusPill status={item.proofStatus} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.isBrief && item.rawBrief) onInspectBrief(item.rawBrief);
                            else if (!item.isBrief && item.rawReq) onInspectRequest(item.rawReq);
                          }}
                          className="px-2.5 py-1 rounded border border-[#CED4DA] dark:border-zinc-700 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[11px] font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Kanban Board View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {stages.filter((s) => s.id !== "all").map((col) => {
              const colItems = filteredDesigns.filter((d) => {
                if (col.id === "intake") return d.proofStatus === "Brief Intake";
                if (col.id === "concept") return d.proofStatus === "In Concept";
                if (col.id === "revisions") return d.proofStatus === "Revisions Requested";
                if (col.id === "review") return d.proofStatus === "Client Review";
                if (col.id === "approved") return d.proofStatus === "Prepress Approved";
                return false;
              });

              return (
                <div
                  key={col.id}
                  className="bg-neutral-100/60 dark:bg-zinc-900/40 rounded-xl p-3 border border-[#E2E8F0] dark:border-white/[0.08] flex flex-col"
                >
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#E2E8F0] dark:border-white/[0.08]">
                    <span className="text-xs font-bold font-mono uppercase text-neutral-700 dark:text-zinc-300">
                      {col.label}
                    </span>
                    <span className="text-[10.5px] font-mono px-1.5 py-0.2 rounded-full bg-white dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 font-bold border border-[#CED4DA] dark:border-zinc-700">
                      {colItems.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
                    {colItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.isBrief && item.rawBrief) onInspectBrief(item.rawBrief);
                          else if (!item.isBrief && item.rawReq) onInspectRequest(item.rawReq);
                        }}
                        className="p-3 bg-white dark:bg-[#16171d] rounded-lg border border-[#E2E8F0] dark:border-white/[0.08] shadow-2xs hover:shadow-sm hover:border-[#714B67]/50 transition cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-bold text-[#714B67]">
                            {item.refCode}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {item.variantsCount} Art
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-neutral-900 dark:text-zinc-100 line-clamp-2 mb-1.5">
                          {item.title}
                        </h4>
                        <div className="text-[11px] text-neutral-500 mb-2 truncate">
                          {item.customer}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] dark:border-white/[0.05] text-[10px] font-mono text-neutral-400">
                          <span>{item.dueDate}</span>
                          <StatusPill status={item.proofStatus} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreativeDesignPage;
