import React, { useState, useMemo } from "react";
import {
  Box,
  Layers,
  Search,
  Copy,
  Check,
  ChevronRight,
  Factory,
  Building2,
  Calendar,
  AlertTriangle,
  Clock,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  Palette,
  Calculator,
  Download,
} from "lucide-react";
import { SampleRequestItem } from "@/features/sample-requests/types";
import { StatusPill } from "@/components/ui/StatusPill";

export interface CreativeSamplingMockupPageProps {
  requests: SampleRequestItem[];
  selectedYear: string;
  selectedPlant: string;
  onInspectRequest: (req: SampleRequestItem) => void;
  onExportCSV?: () => void;
  onRefresh?: () => Promise<void>;
}

export const CreativeSamplingMockupPage: React.FC<CreativeSamplingMockupPageProps> = ({
  requests,
  selectedYear,
  selectedPlant,
  onInspectRequest,
  onExportCSV,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"all" | "both" | "mockup_only" | "sample_only">("all");
  const [plantFilter, setPlantFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1200);
  };

  // Filter requests that have sample or mockup scopes
  const samplingMockupItems = useMemo(() => {
    return requests.filter((r) => {
      const scopes = r.requestTypes || [];
      const hasMockup = scopes.includes("mockup") || r.mockupRequired === "Yes";
      const hasSample = scopes.includes("sample");
      return hasMockup || hasSample;
    });
  }, [requests]);

  // Telemetry metrics
  const totalCombined = samplingMockupItems.length;
  const mockupCount = samplingMockupItems.filter(
    (r) => (r.requestTypes || []).includes("mockup") || r.mockupRequired === "Yes"
  ).length;
  const sampleCount = samplingMockupItems.filter((r) => (r.requestTypes || []).includes("sample")).length;
  const bothCount = samplingMockupItems.filter((r) => {
    const scopes = r.requestTypes || [];
    return (scopes.includes("mockup") || r.mockupRequired === "Yes") && scopes.includes("sample");
  }).length;

  // Scope filter tabs
  const scopeTabs = [
    { id: "all", label: "All Combined Specs", count: totalCombined, sub: "Total Queue" },
    { id: "both", label: "Sample + Mockup Both", count: bothCount, sub: "Dual Deliverables" },
    { id: "mockup_only", label: "CAD Mockup Required", count: mockupCount, sub: "3D CAD Simulations" },
    { id: "sample_only", label: "Physical Samples", count: sampleCount, sub: "Machine Floor Units" },
  ];

  // Filtered requests
  const filteredItems = useMemo(() => {
    return samplingMockupItems.filter((r) => {
      const scopes = r.requestTypes || [];
      const hasMockup = scopes.includes("mockup") || r.mockupRequired === "Yes";
      const hasSample = scopes.includes("sample");

      // Scope filter
      if (scopeFilter === "both" && !(hasMockup && hasSample)) return false;
      if (scopeFilter === "mockup_only" && !hasMockup) return false;
      if (scopeFilter === "sample_only" && !hasSample) return false;

      // Plant filter
      if (plantFilter !== "all" && (r.targetPlant || "").trim() !== plantFilter) return false;

      // Status filter
      if (statusFilter !== "all" && (r.status || "") !== statusFilter) return false;

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        return (
          (r.srNumber || "").toLowerCase().includes(q) ||
          (r.productDescription || "").toLowerCase().includes(q) ||
          (r.customer || "").toLowerCase().includes(q) ||
          (r.targetPlant || "").toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [samplingMockupItems, scopeFilter, plantFilter, statusFilter, searchTerm]);

  // Unique plants for dropdown
  const uniquePlants = useMemo(() => {
    const set = new Set<string>();
    samplingMockupItems.forEach((r) => {
      if (r.targetPlant?.trim()) set.add(r.targetPlant.trim());
    });
    return Array.from(set).sort();
  }, [samplingMockupItems]);

  const handleExportClick = () => {
    if (onExportCSV) {
      onExportCSV();
      return;
    }
    const headers = ["SR Code", "Sample Title", "Customer", "Scopes", "Mockup Required", "Quantity", "Plant", "Due Date", "Status"];
    const rows = filteredItems.map((r) => [
      `"${r.srNumber || r.id}"`,
      `"${r.productDescription || ""}"`,
      `"${r.customer || ""}"`,
      `"${(r.requestTypes || []).join("+")}"`,
      `"${r.mockupRequired || "No"}"`,
      `"${(r as any).quantity || r.qtyForSampling || 1}"`,
      `"${r.targetPlant || ""}"`,
      `"${r.sampleRequiredDate || ""}"`,
      `"${r.status || ""}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `sampling_mockup_queue_${new Date().toISOString().split("T")[0]}.csv`);
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
              Sampling &amp; CAD Mockup Unified Operations Desk
            </h1>
            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#714B67]/10 text-[#714B67] dark:bg-purple-950/40 dark:text-purple-300 border border-[#714B67]/20">
              Creative Desk
            </span>
          </div>

          {/* Action Buttons & View Switcher */}
          <div className="flex items-center gap-2 shrink-0">
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
              onClick={handleExportClick}
              disabled={filteredItems.length === 0}
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

        {/* ── 2. KPI Metric Cards Ribbon (Exact Executive Cards Aligned to Marketing) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-[#F1F5F9] dark:border-white/[0.05]">
          {scopeTabs.map((tab) => {
            const isSelected = scopeFilter === tab.id;
            return (
              <div
                key={tab.id}
                onClick={() => setScopeFilter(tab.id as any)}
                className={`p-2.5 rounded-lg border transition cursor-pointer ${
                  isSelected
                    ? "border-[#714B67] bg-[#714B67]/5 dark:bg-[#714B67]/20 shadow-2xs"
                    : "border-[#E2E8F0] dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/40 hover:border-neutral-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] uppercase font-bold text-neutral-500 dark:text-zinc-400 font-mono tracking-wider">
                    {tab.label}
                  </span>
                  <Box className="w-3.5 h-3.5 text-neutral-400" />
                </div>
                <div className="text-xl font-bold font-mono text-neutral-900 dark:text-zinc-100 mt-0.5">
                  {tab.count}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono">{tab.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Segmented Filter Pills & Control Strip (Aligned to Marketing Desk) ── */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Enterprise Segmented Scope Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {scopeTabs.map((tab) => {
            const isActive = scopeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setScopeFilter(tab.id as any)}
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

        {/* Right: Search & Plant Dropdown */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end flex-wrap">
          {uniquePlants.length > 0 && (
            <select
              value={plantFilter}
              onChange={(e) => setPlantFilter(e.target.value)}
              className="h-8 px-2.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-700 dark:text-zinc-200 focus:outline-none focus:border-[#714B67] cursor-pointer"
            >
              <option value="all">All Plants</option>
              {uniquePlants.map((p) => (
                <option key={p} value={p}>
                  {p}
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
              placeholder="Search SR, product, customer..."
              className="h-8 pl-8 pr-3 w-48 sm:w-64 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 focus:outline-none focus:border-[#714B67]"
            />
          </div>
        </div>
      </div>

      {/* ── 4. Main Body: Table View or Kanban View ── */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs">
            <Box className="w-10 h-10 text-neutral-300 dark:text-zinc-600 mb-3" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              No sampling or mockup requests match the selected filters
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Try adjusting your scope filter tab, plant selector, or search query.
            </p>
          </div>
        ) : viewMode === "list" ? (
          /* Enterprise ERP Table View */
          <div className="bg-white dark:bg-[#12141d] rounded-xl border border-[#E2E8F0] dark:border-white/[0.08] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] dark:bg-zinc-900/80 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-[#E2E8F0] dark:border-white/[0.08]">
                  <tr>
                    <th className="py-2.5 px-3">SR Code</th>
                    <th className="py-2.5 px-3">Sample Description</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Deliverable Scopes</th>
                    <th className="py-2.5 px-3 text-center">Mockup / Qty</th>
                    <th className="py-2.5 px-3">Plant</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] dark:divide-white/[0.04]">
                  {filteredItems.map((r) => {
                    const scopes = r.requestTypes || [];
                    const hasMockup = scopes.includes("mockup") || r.mockupRequired === "Yes";
                    const hasSample = scopes.includes("sample");
                    const hasDesign = scopes.includes("design");
                    const qty = (r as any).quantity || r.qtyForSampling || 1;

                    return (
                      <tr
                        key={r.id}
                        onClick={() => onInspectRequest(r)}
                        className="hover:bg-neutral-50/80 dark:hover:bg-zinc-800/40 transition cursor-pointer"
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-[#017E84] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{r.srNumber || `SR-${r.id}`}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyCode(r.srNumber || `SR-${r.id}`, e)}
                              className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-400 hover:text-neutral-700"
                              title="Copy SR Code"
                            >
                              {copiedCode === (r.srNumber || `SR-${r.id}`) ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-neutral-900 dark:text-zinc-100 font-medium">
                          {r.productDescription || (r as any).opportunityName || "Sample Dummy"}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-600 dark:text-zinc-400 whitespace-nowrap">
                          {r.customer || "General"}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 flex-wrap">
                            {hasDesign && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-purple-50 text-[#714B67] border border-purple-200/80">
                                🎨 Design
                              </span>
                            )}
                            {hasMockup && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                                📦 Mockup
                              </span>
                            )}
                            {hasSample && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-teal-50 text-[#017E84] border border-teal-200/80">
                                🏭 Sample
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-zinc-800 text-[11px] font-semibold text-neutral-700 dark:text-zinc-300">
                            {hasMockup ? "CAD + " : ""}{qty} units
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-neutral-600 dark:text-zinc-400 whitespace-nowrap">
                          {r.targetPlant || "Khaniwade"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                          {r.sampleRequiredDate || "Standard SLA"}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <StatusPill status={r.status || "Creative"} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onInspectRequest(r);
                            }}
                            className="px-2.5 py-1 rounded border border-[#CED4DA] dark:border-zinc-700 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[11px] font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Kanban Board View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {scopeTabs.map((col) => {
              const colItems = samplingMockupItems.filter((r) => {
                const scopes = r.requestTypes || [];
                const hasMockup = scopes.includes("mockup") || r.mockupRequired === "Yes";
                const hasSample = scopes.includes("sample");
                if (col.id === "all") return true;
                if (col.id === "both") return hasMockup && hasSample;
                if (col.id === "mockup_only") return hasMockup;
                if (col.id === "sample_only") return hasSample;
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
                        onClick={() => onInspectRequest(item)}
                        className="p-3 bg-white dark:bg-[#16171d] rounded-lg border border-[#E2E8F0] dark:border-white/[0.08] shadow-2xs hover:shadow-sm hover:border-[#017E84]/50 transition cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-bold text-[#017E84]">
                            {item.srNumber || `SR-${item.id}`}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {item.targetPlant || "1505"}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-neutral-900 dark:text-zinc-100 line-clamp-2 mb-1.5">
                          {item.productDescription || (item as any).opportunityName || "Sample Dummy"}
                        </h4>
                        <div className="text-[11px] text-neutral-500 mb-2 truncate">
                          {item.customer || "General"}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] dark:border-white/[0.05] text-[10px] font-mono text-neutral-400">
                          <span>{item.sampleRequiredDate || "Due SLA"}</span>
                          <StatusPill status={item.status || "Creative"} size="sm" />
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

export default CreativeSamplingMockupPage;
