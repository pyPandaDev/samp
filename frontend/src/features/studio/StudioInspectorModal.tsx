import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Box,
  FileCode2,
  FileCheck,
  Maximize2,
  Factory,
  Layers,
  ChevronRight,
} from "lucide-react";
import { DielineItem } from "@/features/sample-requests/types";

export interface StudioInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  dieline: DielineItem | null;
  onUpdateStatus?: (id: string, newStatus: DielineItem["status"]) => Promise<void>;
}

export const StudioInspectorModal: React.FC<StudioInspectorModalProps> = ({
  isOpen,
  onClose,
  dieline,
  onUpdateStatus,
}) => {
  const [inspectorTab, setInspectorTab] = useState<"cad" | "simulation" | "export">("cad");
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen || !dieline) return null;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1200);
  };

  const handleApplyStatus = async (status: DielineItem["status"]) => {
    if (!onUpdateStatus) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(dieline.id, status);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-5 select-none animate-smooth-backdrop"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-5xl max-h-[94vh] flex flex-col bg-white dark:bg-[#0f1118] border border-[#CED4DA] dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-smooth-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-[#CED4DA] dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-[#12141d] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded border border-[#CED4DA] dark:border-zinc-700 text-xs font-mono font-bold text-[#017E84] dark:text-teal-300 shadow-2xs">
              {dieline.dielineCode}
              <button
                type="button"
                onClick={() => handleCopyCode(dieline.dielineCode)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer ml-1"
                title="Copy Dieline Code"
              >
                {copiedCode === dieline.dielineCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </span>
            <span className="text-[11px] font-mono text-zinc-500 font-semibold">({dieline.client})</span>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-md">{dieline.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Context Strip */}
        <div className="grid grid-cols-4 border-b border-[#CED4DA] dark:border-white/[0.08] bg-white dark:bg-[#161822] divide-x divide-[#CED4DA] dark:divide-white/[0.08] shrink-0 text-xs p-3">
          <div>
            <span className="block text-[10px] uppercase font-bold text-zinc-400">Box Format</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate block mt-0.5">{dieline.boxFormat}</span>
          </div>
          <div className="pl-3">
            <span className="block text-[10px] uppercase font-bold text-zinc-400">Dimensions (L×W×H)</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate block mt-0.5">{dieline.dimensions}</span>
          </div>
          <div className="pl-3">
            <span className="block text-[10px] uppercase font-bold text-zinc-400">Substrate &amp; Caliper</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate block mt-0.5">
              {dieline.substrate} ({dieline.caliperMicrons}µm)
            </span>
          </div>
          <div className="pl-3">
            <span className="block text-[10px] uppercase font-bold text-zinc-400">Plant / Die Tooling</span>
            <span className="font-mono font-bold text-[#017E84] dark:text-teal-300 truncate block mt-0.5">{dieline.targetPlant}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#CED4DA] dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-[#0f1118] px-4 shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setInspectorTab("cad")}
            className={`h-9 px-3 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
              inspectorTab === "cad"
                ? "border-[#017E84] text-[#017E84] dark:text-teal-300"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Structural CAD Blueprint
          </button>
          <button
            type="button"
            onClick={() => setInspectorTab("simulation")}
            className={`h-9 px-3 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              inspectorTab === "simulation"
                ? "border-[#017E84] text-[#017E84] dark:text-teal-300"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            3D Fold &amp; Plotter Verification
          </button>
          <button
            type="button"
            onClick={() => setInspectorTab("export")}
            className={`h-9 px-3 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              inspectorTab === "export"
                ? "border-[#017E84] text-[#017E84] dark:text-teal-300"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            CAD Export (.DXF, .CF2, .PDF)
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {((dieline.selectedDesigns && dieline.selectedDesigns.length > 0) || dieline.folderPath) && (
            <div className="p-3.5 rounded-lg border border-purple-200 dark:border-purple-800/40 bg-purple-50/70 dark:bg-purple-950/20 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#714B67] text-white">
                    CAD MOCKUP REQUEST
                  </span>
                  <span className="font-semibold text-neutral-800 dark:text-zinc-200 font-mono">
                    {dieline.srNumber}
                  </span>
                </div>
                {dieline.selectedDesigns && dieline.selectedDesigns.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-neutral-500 font-mono">Mockup Designs:</span>
                    {dieline.selectedDesigns.map((code) => (
                      <span
                        key={code}
                        className="px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-900/60 font-mono font-bold text-purple-800 dark:text-purple-200 text-[11px]"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {dieline.folderPath && (
                <div className="mt-2 pt-2 border-t border-purple-200/80 dark:border-purple-900/40 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-neutral-600 dark:text-zinc-400 truncate">
                    📁 Artwork Location: {dieline.folderPath}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(dieline.folderPath || "")}
                    className="text-purple-700 dark:text-purple-300 hover:underline font-mono text-[10.5px] font-semibold shrink-0 ml-2"
                  >
                    Copy Path
                  </button>
                </div>
              )}
            </div>
          )}

          {inspectorTab === "cad" && (
            <div className="space-y-4">
              {/* CAD Vector Simulator Frame */}
              <div className="rounded-lg border border-[#CED4DA] dark:border-white/10 bg-zinc-950 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-inner min-h-[220px]">
                <div className="border border-teal-500/40 border-dashed rounded p-8 w-72 flex flex-col items-center justify-center relative bg-teal-950/20">
                  <div className="w-40 h-28 border-2 border-emerald-400 border-dashed flex items-center justify-center text-emerald-400 font-mono text-[11px] font-bold">
                    <span>CUT LINE</span>
                  </div>
                  <div className="w-full border-t border-rose-400 border-dotted mt-3 pt-1 text-[10px] font-mono text-rose-300">
                    CREASE / SCORE LINE
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 font-mono text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> Solid = Cut (100%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-0.5 bg-rose-400 border-t border-dotted inline-block" /> Dotted = Crease / Perforation
                  </span>
                </div>
              </div>

              {/* Engineering Parameters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-[#F8F9FA] dark:bg-zinc-800/60 rounded border border-[#CED4DA] dark:border-zinc-700">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Grain Direction</span>
                  <div className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100 mt-1">
                    {dieline.grainDirection}
                  </div>
                </div>

                <div className="p-3 bg-[#F8F9FA] dark:bg-zinc-800/60 rounded border border-[#CED4DA] dark:border-zinc-700">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Machine Compatibility</span>
                  <div className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100 mt-1">
                    {dieline.machineCompatibility}
                  </div>
                </div>

                <div className="p-3 bg-[#F8F9FA] dark:bg-zinc-800/60 rounded border border-[#CED4DA] dark:border-zinc-700">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Flute Grade</span>
                  <div className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100 mt-1">
                    {dieline.fluteGrade || "E-Flute (Single Wall)"}
                  </div>
                </div>

                <div className="p-3 bg-[#F8F9FA] dark:bg-zinc-800/60 rounded border border-[#CED4DA] dark:border-zinc-700">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Engineering Status</span>
                  <div className="font-bold text-xs text-[#017E84] dark:text-teal-300 mt-1">
                    {dieline.status}
                  </div>
                </div>
              </div>
            </div>
          )}

          {inspectorTab === "simulation" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-[#12141d] space-y-3">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Box className="w-4 h-4 text-[#017E84]" />
                  Kinematic 3D Fold Simulation &amp; Laser Die Clearance
                </h4>
                <p className="text-xs text-zinc-500">
                  Verify folding mechanics, tuck flap retention, and substrate thickness compensation before releasing tooling files to plant die-makers.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleApplyStatus("Laser Die Cleared")}
                    className="px-3.5 py-1.5 rounded bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Clear for Laser Die Tooling</span>
                  </button>

                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleApplyStatus("Plotter Sample Tested")}
                    className="px-3 py-1.5 rounded bg-white hover:bg-[#F8F9FA] text-zinc-700 border border-[#CED4DA] text-xs font-semibold transition cursor-pointer"
                  >
                    Confirm Plotter Sample Tested
                  </button>

                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleApplyStatus("3D Simulation")}
                    className="px-3 py-1.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold transition cursor-pointer"
                  >
                    Mark in 3D Simulation
                  </button>
                </div>
              </div>
            </div>
          )}

          {inspectorTab === "export" && (
            <div className="space-y-3">
              <div className="p-4 bg-[#F8F9FA] dark:bg-zinc-800/40 rounded border border-[#CED4DA] dark:border-zinc-700 space-y-2">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Export Structural Production Files
                </h4>
                <p className="text-xs text-zinc-500">
                  Download standard CAD formats for Kongsberg plotters, ArtiosCAD, and CNC laser die-cut tables.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => alert(`Downloading AutoCAD DXF package for ${dieline.dielineCode}...`)}
                    className="p-3 bg-white dark:bg-zinc-800 rounded border border-[#CED4DA] text-left hover:border-[#017E84] transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="block font-bold text-xs text-zinc-900 dark:text-zinc-100">AutoCAD (.DXF)</span>
                      <span className="text-[10px] text-zinc-400 font-mono">Die-maker standard</span>
                    </div>
                    <Download className="w-4 h-4 text-[#017E84]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => alert(`Downloading Common File Format (.CF2) for ${dieline.dielineCode}...`)}
                    className="p-3 bg-white dark:bg-zinc-800 rounded border border-[#CED4DA] text-left hover:border-[#017E84] transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="block font-bold text-xs text-zinc-900 dark:text-zinc-100">ArtiosCAD (.CF2)</span>
                      <span className="text-[10px] text-zinc-400 font-mono">Kongsberg Plotter</span>
                    </div>
                    <Download className="w-4 h-4 text-[#017E84]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => alert(`Downloading 1:1 Scale Print PDF for ${dieline.dielineCode}...`)}
                    className="p-3 bg-white dark:bg-zinc-800 rounded border border-[#CED4DA] text-left hover:border-[#017E84] transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="block font-bold text-xs text-zinc-900 dark:text-zinc-100">1:1 Dieline PDF</span>
                      <span className="text-[10px] text-zinc-400 font-mono">Client Verification</span>
                    </div>
                    <Download className="w-4 h-4 text-[#017E84]" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#CED4DA] dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-[#12141d] flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-zinc-500">
            Dieline Code: {dieline.dielineCode} · Machine: {dieline.machineCompatibility}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-white hover:bg-zinc-100 text-zinc-700 border border-[#CED4DA] text-xs font-semibold cursor-pointer shadow-2xs"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
