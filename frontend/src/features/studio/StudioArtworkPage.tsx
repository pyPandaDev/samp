import React, { useState, useMemo } from "react";
import {
  FileCode2,
  Search,
  Copy,
  Check,
  ChevronRight,
  Factory,
  Download,
  LayoutGrid,
  List as ListIcon,
  Box,
  Maximize2,
  Layers,
  RefreshCw,
} from "lucide-react";
import { DielineItem } from "@/features/sample-requests/types";
import { StatusPill } from "@/components/ui/StatusPill";

export interface StudioArtworkPageProps {
  dielines: DielineItem[];
  selectedYear: string;
  selectedPlant: string;
  onInspectDieline: (dieline: DielineItem) => void;
  onExportCSV?: () => void;
  onRefresh?: () => Promise<void>;
}

export const StudioArtworkPage: React.FC<StudioArtworkPageProps> = ({
  dielines,
  selectedYear,
  selectedPlant,
  onInspectDieline,
  onExportCSV,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [plantFilter, setPlantFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1200);
  };

  // Stage filters matching Marketing structure
  const stages = useMemo(() => [
    { id: "all", label: "All Dielines", count: dielines.length, sub: "Total CAD Database" },
    {
      id: "intake",
      label: "CAD Intake",
      count: dielines.filter((d) => d.status === "CAD Intake").length,
      sub: "Spec Brief Received",
    },
    {
      id: "construction",
      label: "Dieline Construction",
      count: dielines.filter((d) => d.status === "Dieline Construction").length,
      sub: "ArtiosCAD Drafting",
    },
    {
      id: "simulation",
      label: "3D Fold Simulation",
      count: dielines.filter((d) => d.status === "3D Simulation").length,
      sub: "Interference Check",
    },
    {
      id: "plotter",
      label: "Plotter Sample Tested",
      count: dielines.filter((d) => d.status === "Plotter Sample Tested").length,
      sub: "Kongsberg Cutting",
    },
    {
      id: "cleared",
      label: "Laser Die Cleared",
      count: dielines.filter((d) => d.status === "Laser Die Cleared").length,
      sub: "Machine Tooling Ready",
    },
  ], [dielines]);

  // Unique formats for dropdown
  const uniqueFormats = useMemo(() => {
    const set = new Set<string>();
    dielines.forEach((d) => {
      if (d.boxFormat) set.add(d.boxFormat);
    });
    return Array.from(set).sort();
  }, [dielines]);

  // Unique plants for dropdown
  const uniquePlants = useMemo(() => {
    const set = new Set<string>();
    dielines.forEach((d) => {
      if (d.targetPlant) set.add(d.targetPlant);
    });
    return Array.from(set).sort();
  }, [dielines]);

  // Filtered dielines
  const filteredDielines = useMemo(() => {
    return dielines.filter((d) => {
      // Stage filter
      if (selectedStage !== "all") {
        if (selectedStage === "intake" && d.status !== "CAD Intake") return false;
        if (selectedStage === "construction" && d.status !== "Dieline Construction") return false;
        if (selectedStage === "simulation" && d.status !== "3D Simulation") return false;
        if (selectedStage === "plotter" && d.status !== "Plotter Sample Tested") return false;
        if (selectedStage === "cleared" && d.status !== "Laser Die Cleared") return false;
      }

      // Format filter
      if (formatFilter !== "all" && d.boxFormat !== formatFilter) return false;

      // Plant filter
      if (plantFilter !== "all" && d.targetPlant !== plantFilter) return false;

      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        return (
          d.dielineCode.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q) ||
          d.client.toLowerCase().includes(q) ||
          d.dimensions.toLowerCase().includes(q) ||
          d.targetPlant.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [dielines, selectedStage, formatFilter, plantFilter, searchTerm]);

  const handleExportClick = () => {
    if (onExportCSV) {
      onExportCSV();
      return;
    }
    const headers = ["Dieline Code", "Title", "Client", "Box Format", "Dimensions", "Substrate", "Caliper Microns", "Machine", "Status", "Due Date", "Plant"];
    const rows = filteredDielines.map((d) => [
      `"${d.dielineCode}"`,
      `"${d.title}"`,
      `"${d.client}"`,
      `"${d.boxFormat}"`,
      `"${d.dimensions}"`,
      `"${d.substrate}"`,
      `"${d.caliperMicrons}"`,
      `"${d.machineCompatibility}"`,
      `"${d.status}"`,
      `"${d.dueDate}"`,
      `"${d.targetPlant}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `studio_artwork_dielines_${new Date().toISOString().split("T")[0]}.csv`);
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
              Artwork &amp; Structural Dieline Engineering Workbench
            </h1>
            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#714B67]/10 text-[#714B67] dark:bg-purple-950/40 dark:text-purple-300 border border-[#714B67]/20">
              Studio Desk
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
              disabled={filteredDielines.length === 0}
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
                  <FileCode2 className="w-3.5 h-3.5 text-neutral-400" />
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

        {/* Right: Format Dropdown, Plant Dropdown & Search */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end flex-wrap">
          {uniqueFormats.length > 0 && (
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="h-8 px-2.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-700 dark:text-zinc-200 focus:outline-none focus:border-[#714B67] cursor-pointer"
            >
              <option value="all">All Box Formats</option>
              {uniqueFormats.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          )}

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
              placeholder="Search dieline, client, machine..."
              className="h-8 pl-8 pr-3 w-48 sm:w-64 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 focus:outline-none focus:border-[#714B67]"
            />
          </div>
        </div>
      </div>

      {/* ── 4. Main Body: Table View or Kanban View ── */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {filteredDielines.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs">
            <FileCode2 className="w-10 h-10 text-neutral-300 dark:text-zinc-600 mb-3" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              No structural dielines match the selected filters
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Try adjusting your stage tab, packaging format dropdown, or search query.
            </p>
          </div>
        ) : viewMode === "list" ? (
          /* Enterprise ERP Table View */
          <div className="bg-white dark:bg-[#12141d] rounded-xl border border-[#E2E8F0] dark:border-white/[0.08] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] dark:bg-zinc-900/80 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-[#E2E8F0] dark:border-white/[0.08]">
                  <tr>
                    <th className="py-2.5 px-3">Dieline Code</th>
                    <th className="py-2.5 px-3">Structural Design Title</th>
                    <th className="py-2.5 px-3">Client / Brand</th>
                    <th className="py-2.5 px-3">Format</th>
                    <th className="py-2.5 px-3">Dimensions</th>
                    <th className="py-2.5 px-3">Substrate &amp; Caliper</th>
                    <th className="py-2.5 px-3">Machine Profile</th>
                    <th className="py-2.5 px-3">Plant</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] dark:divide-white/[0.04]">
                  {filteredDielines.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => onInspectDieline(d)}
                      className="hover:bg-neutral-50/80 dark:hover:bg-zinc-800/40 transition cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-[#714B67] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{d.dielineCode}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(d.dielineCode, e)}
                            className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-400 hover:text-neutral-700"
                            title="Copy Dieline Code"
                          >
                            {copiedCode === d.dielineCode ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-900 dark:text-zinc-100 font-medium">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{d.title}</span>
                          {d.selectedDesigns && d.selectedDesigns.length > 0 && (
                            <div className="flex items-center gap-1">
                              {d.selectedDesigns.map((code) => (
                                <span
                                  key={code}
                                  className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/60 font-mono text-[10px] font-bold text-purple-700 dark:text-purple-300"
                                >
                                  {code}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600 dark:text-zinc-400 whitespace-nowrap">
                        {d.client}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-zinc-800 text-[10.5px]">
                          {d.boxFormat}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-600 dark:text-zinc-300 whitespace-nowrap">
                        {d.dimensions}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-neutral-500 whitespace-nowrap">
                        <span>{d.substrate}</span>
                        <span className="ml-1 font-mono text-neutral-400">({d.caliperMicrons}µm)</span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-neutral-500 whitespace-nowrap">
                        {d.machineCompatibility}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600 dark:text-zinc-400 whitespace-nowrap">
                        {d.targetPlant}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <StatusPill status={d.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectDieline(d);
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
              const colItems = filteredDielines.filter((d) => {
                if (col.id === "intake") return d.status === "CAD Intake";
                if (col.id === "construction") return d.status === "Dieline Construction";
                if (col.id === "simulation") return d.status === "3D Simulation";
                if (col.id === "plotter") return d.status === "Plotter Sample Tested";
                if (col.id === "cleared") return d.status === "Laser Die Cleared";
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
                        onClick={() => onInspectDieline(item)}
                        className="p-3 bg-white dark:bg-[#16171d] rounded-lg border border-[#E2E8F0] dark:border-white/[0.08] shadow-2xs hover:shadow-sm hover:border-[#714B67]/50 transition cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-bold text-[#714B67]">
                            {item.dielineCode}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {item.boxFormat}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-neutral-900 dark:text-zinc-100 line-clamp-2 mb-1.5">
                          {item.title}
                        </h4>
                        {item.selectedDesigns && item.selectedDesigns.length > 0 && (
                          <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                            {item.selectedDesigns.map((code) => (
                              <span
                                key={code}
                                className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/60 font-mono text-[9.5px] font-bold text-purple-700 dark:text-purple-300"
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-[11px] text-neutral-500 mb-1 truncate">
                          {item.client}
                        </div>
                        <div className="text-[10.5px] font-mono text-neutral-400 mb-2">
                          {item.dimensions}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] dark:border-white/[0.05] text-[10px] font-mono text-neutral-400">
                          <span>{item.dueDate}</span>
                          <StatusPill status={item.status} size="sm" />
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

export default StudioArtworkPage;
