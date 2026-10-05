import React, { useMemo, useState } from "react";
import {
  Box,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Activity,
  FileCode2,
  Download,
  Eye,
  Factory,
  Building2,
  Maximize2,
} from "lucide-react";
import { DielineItem } from "@/features/sample-requests/types";
import { StatusPill } from "@/components/ui/StatusPill";

export interface StudioOverviewPageProps {
  dielines: DielineItem[];
  isLoading: boolean;
  selectedYear: string;
  selectedPlant: string;
  onNavigateToArtwork: () => void;
  onInspectDieline: (dieline: DielineItem) => void;
}

export const StudioOverviewPage: React.FC<StudioOverviewPageProps> = ({
  dielines,
  isLoading,
  selectedYear,
  selectedPlant,
  onNavigateToArtwork,
  onInspectDieline,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const totalDielines = dielines.length;
  const inSimulation = dielines.filter((d) => d.status === "3D Simulation").length;
  const inPlotter = dielines.filter((d) => d.status === "Plotter Sample Tested").length;
  const clearedCount = dielines.filter((d) => d.status === "Laser Die Cleared").length;

  // Format distribution
  const formatCounts = useMemo(() => {
    return {
      rigid: dielines.filter((d) => d.boxFormat === "Rigid Box").length,
      folding: dielines.filter((d) => d.boxFormat === "Folding Carton").length,
      flute: dielines.filter((d) => d.boxFormat === "Flute Corrugated").length,
      blister: dielines.filter((d) => d.boxFormat === "Blister / Sleeve").length,
    };
  }, [dielines]);

  // Recent dielines
  const recentDielines = useMemo(() => {
    let items = [...dielines];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      items = items.filter(
        (d) =>
          d.dielineCode.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q) ||
          d.client.toLowerCase().includes(q)
      );
    }
    return items.slice(0, 8);
  }, [dielines, searchTerm]);

  const handleExportCSV = () => {
    const headers = ["Dieline Code", "Title", "Client", "Box Format", "Dimensions", "Substrate", "Caliper Microns", "Machine", "Status", "Due Date", "Plant"];
    const rows = recentDielines.map((d) => [
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
    link.setAttribute("download", `studio_overview_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8F9FA] dark:bg-[#0b0c10] p-6 space-y-5 select-text">
      {/* ── 1. Identity Header (Aligned to Marketing Overview Standards) ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <FileCode2 className="w-4 h-4 text-[#714B67]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#714B67]">
              Studio CAD — Structural Packaging &amp; Prepress Command
            </span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded bg-[#714B67]/10 text-[#714B67] border border-[#714B67]/20">
              FY {selectedYear === "ALL" ? "Consolidated" : selectedYear}
            </span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Studio Engineering Overview
          </h1>
          <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-0.5">
            Structural dielines, folding cartons, flute corrugation, and machine prepress laser clearances.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 dark:text-zinc-200 shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToArtwork}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Artwork Workspace ({totalDielines})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── 2. KPI Cards (4-Column Grid Aligned to Marketing) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Structural CAD */}
        <button
          type="button"
          onClick={onNavigateToArtwork}
          className="p-4 rounded-xl border border-[#CED4DA] dark:border-white/[0.08] bg-white dark:bg-[#12141d] hover:border-[#714B67] text-left transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              Total Structural Dielines
            </span>
            <Box className="w-3.5 h-3.5 text-[#714B67] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {isLoading ? "—" : totalDielines}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[10px] text-neutral-400 font-mono">Active CAD blueprints</span>
            <ChevronRight className="w-3 h-3 text-neutral-300 group-hover:text-[#714B67] transition-colors" />
          </div>
        </button>

        {/* 3D Simulations */}
        <button
          type="button"
          onClick={onNavigateToArtwork}
          className="p-4 rounded-xl border border-[#CED4DA] dark:border-white/[0.08] bg-white dark:bg-[#12141d] hover:border-amber-500 text-left transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              3D Fold Simulations
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {isLoading ? "—" : inSimulation}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-semibold">
              Folding kinematics check
            </span>
            <ChevronRight className="w-3 h-3 text-neutral-300 group-hover:text-amber-500 transition-colors" />
          </div>
        </button>

        {/* Plotter Tests */}
        <button
          type="button"
          onClick={onNavigateToArtwork}
          className="p-4 rounded-xl border border-[#CED4DA] dark:border-white/[0.08] bg-white dark:bg-[#12141d] hover:border-sky-500 text-left transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              Plotter Sample Tested
            </span>
            <Clock className="w-3.5 h-3.5 text-sky-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {isLoading ? "—" : inPlotter}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[10px] text-neutral-400 font-mono">Kongsberg cut verified</span>
            <ChevronRight className="w-3 h-3 text-neutral-300 group-hover:text-sky-500 transition-colors" />
          </div>
        </button>

        {/* Laser Die Cleared */}
        <div className="p-4 rounded-xl border border-[#CED4DA] dark:border-white/[0.08] bg-white dark:bg-[#12141d] shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              Laser Die Cleared
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {isLoading ? "—" : clearedCount}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            Floor tooling certified
          </div>
        </div>
      </div>

      {/* ── 3. Packaging Format Telemetry Strip (4 Format Cards) ── */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <TrendingUp className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-zinc-300 font-mono">
            Packaging Format Engineering Breakdown
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs">
            <span className="text-[10.5px] uppercase font-bold text-neutral-500 font-mono tracking-wider">
              Rigid Box
            </span>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-white mt-1">
              {formatCounts.rigid}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Kappa board &amp; wraps</div>
          </div>
          <div className="p-3.5 bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs">
            <span className="text-[10.5px] uppercase font-bold text-neutral-500 font-mono tracking-wider">
              Folding Carton
            </span>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-white mt-1">
              {formatCounts.folding}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">FBB / SBS paperboards</div>
          </div>
          <div className="p-3.5 bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs">
            <span className="text-[10.5px] uppercase font-bold text-neutral-500 font-mono tracking-wider">
              Flute Corrugated
            </span>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-white mt-1">
              {formatCounts.flute}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">E-Flute / Kraft Mailers</div>
          </div>
          <div className="p-3.5 bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs">
            <span className="text-[10.5px] uppercase font-bold text-neutral-500 font-mono tracking-wider">
              Blister / Sleeve
            </span>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-white mt-1">
              {formatCounts.blister}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">PET &amp; header cards</div>
          </div>
        </div>
      </div>

      {/* ── 4. Recent Structural CAD Blueprints Data Table (Enterprise ERP Standard) ── */}
      <div className="bg-white dark:bg-[#12141d] rounded-xl border border-[#CED4DA] dark:border-white/[0.08] shadow-2xs overflow-hidden flex flex-col">
        <div className="p-3.5 border-b border-[#E2E8F0] dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-[#714B67]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white font-mono">
              Recent Structural Dielines &amp; Tooling Specs ({recentDielines.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onNavigateToArtwork}
            className="text-xs font-semibold font-mono text-[#017E84] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Open Artwork Workspace</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentDielines.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <FileCode2 className="w-10 h-10 text-neutral-300 dark:text-zinc-600 mb-3" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              No structural dielines registered
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Structural CAD dielines and toolings will appear here once created or synchronized from sampling requests.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] dark:bg-zinc-900/80 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-[#E2E8F0] dark:border-white/[0.08]">
                <tr>
                  <th className="py-2.5 px-3">Dieline Code</th>
                  <th className="py-2.5 px-3">Packaging Title</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Box Format</th>
                  <th className="py-2.5 px-3">Dimensions (L×W×D)</th>
                  <th className="py-2.5 px-3">Caliper</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] dark:divide-white/[0.04]">
                {recentDielines.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => onInspectDieline(d)}
                    className="hover:bg-neutral-50/80 dark:hover:bg-zinc-800/40 transition cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-[#714B67] whitespace-nowrap">
                      {d.dielineCode}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-900 dark:text-zinc-100 font-medium max-w-[200px] truncate">
                      {d.title}
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
                    <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                      {d.caliperMicrons}µm
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
        )}
      </div>
    </div>
  );
};

export default StudioOverviewPage;
