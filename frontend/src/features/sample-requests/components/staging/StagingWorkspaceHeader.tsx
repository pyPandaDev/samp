import React from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Building2,
  FolderGit2,
  Calendar,
  Factory,
  Package,
  Palette,
  Box,
  Layers,
  Calculator,
  ChevronRight,
  BookmarkCheck,
  Send,
} from "lucide-react";
import { StagedProductItem, cleanPlantName } from "../../types/staging";

export interface StagingWorkspaceHeaderProps {
  programContext: {
    customer: string;
    programName: string;
    programYear: string;
    year: string;
    targetPlant: string;
    parentRequestId?: string | number;
    parentSrNumber?: string;
  };
  stagedProducts: StagedProductItem[];
  isSubmittingAll: boolean;
  isReleasing?: boolean;
  onNavigateBack: () => void;
  onOpenAddModal: () => void;
  onClearAll: () => void;
  onSaveAsDraft: () => void;
  onSubmitAll: () => void;
  onReleaseRequest?: () => void;
}

export const StagingWorkspaceHeader: React.FC<StagingWorkspaceHeaderProps> = ({
  programContext,
  stagedProducts,
  isSubmittingAll,
  isReleasing = false,
  onNavigateBack,
  onOpenAddModal,
  onClearAll,
  onSaveAsDraft,
  onSubmitAll,
  onReleaseRequest,
}) => {
  const designCount = stagedProducts.filter((product) => product.scopes.includes("design")).length;
  const mockupCount = stagedProducts.filter((product) => product.scopes.includes("mockup")).length;
  const samplingCount = stagedProducts.filter((product) => product.scopes.includes("sample")).length;
  const costingCount = stagedProducts.filter((product) => product.scopes.includes("costing")).length;

  return (
    <div className="space-y-3">
      {/* 1. Enterprise ERP Control Panel: Breadcrumbs, Pipeline Stages & Global Action Bar */}
      <div className="bg-white dark:bg-[#12141d] border border-[#CED4DA] dark:border-white/[0.08] rounded px-4 py-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Breadcrumbs & Document Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onNavigateBack}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[#CED4DA] bg-white text-zinc-600 transition-colors hover:border-[#714B67] hover:bg-[#F3E8EE] hover:text-[#714B67] cursor-pointer dark:border-zinc-700 dark:bg-[#171923] dark:text-zinc-300 dark:hover:text-purple-200"
              title="Return to Requests Desk"
              aria-label="Return to Requests Desk"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              {/* Enterprise Breadcrumb Path */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                <button
                  type="button"
                  onClick={onNavigateBack}
                  className="hover:text-[#714B67] hover:underline cursor-pointer"
                >
                  Requests Desk
                </button>
                <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
                <span className="text-zinc-600 dark:text-zinc-300">Commercial Sampling</span>
                <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
                <span className="font-bold text-[#714B67] dark:text-[#E8D7E3]">Product Staging</span>
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="truncate text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  {programContext.programName || "Commercial Sample Request"}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F3E8EE] text-[#714B67] border border-[#714B67]/25 dark:bg-[#3E2938] dark:text-[#E8D7E3]">
                  BATCH STAGING
                </span>
              </div>
            </div>
          </div>

          {/* Right: Enterprise Pipeline Stage Status Bar */}
          <div className="hidden md:flex items-center border border-[#CED4DA] dark:border-zinc-700 rounded overflow-hidden text-[11px] font-semibold bg-[#F8F9FA] dark:bg-zinc-900/60 divide-x divide-[#CED4DA] dark:divide-zinc-700 select-none">
            <div className="px-3 py-1.5 text-zinc-500 dark:text-zinc-400">1. Draft (Pre-PMT)</div>
            <div className="px-3.5 py-1.5 bg-[#714B67] text-white font-bold flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>2. Product Staging</span>
            </div>
            <div className="px-3 py-1.5 text-zinc-400 dark:text-zinc-500">3. Sampling Review</div>
            <div className="px-3 py-1.5 text-zinc-400 dark:text-zinc-500">4. Released</div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-[#E2E8F0] dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex h-8 items-center gap-1.5 rounded bg-[#714B67] hover:bg-[#5B3C53] active:bg-[#4b3145] px-3.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Add Product</span>
            </button>

            {/* Save as Draft Button */}
            {(stagedProducts.length > 0 || programContext.parentRequestId) && (
              <button
                type="button"
                onClick={onSaveAsDraft}
                disabled={isSubmittingAll || isReleasing}
                className="inline-flex h-8 items-center gap-1.5 rounded border border-[#CED4DA] bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-[#F8F9FA] transition-colors cursor-pointer dark:border-zinc-700 dark:bg-[#12141d] dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:opacity-50"
                title="Save staged products into Draft queue"
              >
                <BookmarkCheck className="h-3.5 w-3.5 text-zinc-500" />
                <span>Save as Draft</span>
              </button>
            )}

            {/* Release Request Button (Enterprise Primary Action: Teal #017E84) */}
            {(stagedProducts.length > 0 || programContext.parentRequestId) && (
              <button
                type="button"
                onClick={onReleaseRequest || onSubmitAll}
                disabled={isSubmittingAll || isReleasing}
                className="inline-flex h-8 items-center gap-1.5 rounded bg-[#017E84] hover:bg-[#00666A] active:bg-[#005256] px-4 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-60"
                title="Release this request to active PMT / Creative workflow"
              >
                <Send className="h-3.5 w-3.5" />
                <span>
                  {isReleasing
                    ? "Releasing Request…"
                    : programContext.parentSrNumber
                    ? `Release Request (${programContext.parentSrNumber})`
                    : "Release Request"}
                </span>
              </button>
            )}
          </div>

          {stagedProducts.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex h-8 items-center gap-1 rounded text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 text-xs font-semibold transition-colors cursor-pointer dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Batch</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Enterprise Form Sheet Header: Program Context & Enterprise Stat Buttons */}
      <div className="bg-white dark:bg-[#12141d] border border-[#CED4DA] dark:border-white/[0.08] rounded shadow-2xs overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#CED4DA] dark:divide-white/[0.08]">
          {/* Left Block: 4 Program Parameters */}
          <div className="lg:col-span-7 p-4 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 flex items-center gap-1 font-sans">
                <Building2 className="w-3 h-3 text-[#714B67]" />
                Customer Account
              </span>
              <span
                className="block font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate"
                title={programContext.customer}
              >
                {programContext.customer || "Not Selected"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 flex items-center gap-1 font-sans">
                <FolderGit2 className="w-3 h-3 text-[#714B67]" />
                Program Campaign
              </span>
              <span
                className="block font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate"
                title={programContext.programName}
              >
                {programContext.programName || "General Intake"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 flex items-center gap-1 font-sans">
                <Calendar className="w-3 h-3 text-[#714B67]" />
                Season / Business Year
              </span>
              <span className="block font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100">
                {programContext.programYear || "2026"} · BY {programContext.year || "2026-27"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 flex items-center gap-1 font-sans">
                <Factory className="w-3 h-3 text-[#714B67]" />
                Fulfillment Facility
              </span>
              <span
                className="block font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate"
                title={programContext.targetPlant}
              >
                {cleanPlantName(programContext.targetPlant) || "Navneet - Khaniwade"}
              </span>
            </div>
          </div>

          {/* Right Block: Enterprise Stat Buttons (.oe_stat_button) */}
          <div className="lg:col-span-5 p-3 bg-[#F8F9FA] dark:bg-zinc-900/40 grid grid-cols-5 gap-1.5 items-stretch">
            {/* Stat: Total Staged */}
            <div className="flex flex-col items-center justify-center p-2 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-[#161822] shadow-2xs">
              <Package className="w-4 h-4 text-[#714B67] dark:text-purple-400 stroke-[2]" />
              <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5">
                {stagedProducts.length}
              </span>
              <span className="text-[9.5px] uppercase font-bold text-zinc-500 tracking-tight">Staged</span>
            </div>

            {/* Stat: Design */}
            <div className="flex flex-col items-center justify-center p-2 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-[#161822] shadow-2xs">
              <Palette className="w-4 h-4 text-[#714B67] dark:text-purple-400 stroke-[2]" />
              <span className="font-mono font-bold text-sm text-[#714B67] dark:text-purple-300 mt-0.5">
                {designCount}
              </span>
              <span className="text-[9.5px] uppercase font-bold text-zinc-500 tracking-tight">Design</span>
            </div>

            {/* Stat: Mockup */}
            <div className="flex flex-col items-center justify-center p-2 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-[#161822] shadow-2xs">
              <Box className="w-4 h-4 text-amber-600 dark:text-amber-400 stroke-[2]" />
              <span className="font-mono font-bold text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                {mockupCount}
              </span>
              <span className="text-[9.5px] uppercase font-bold text-zinc-500 tracking-tight">Mockup</span>
            </div>

            {/* Stat: Sampling */}
            <div className="flex flex-col items-center justify-center p-2 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-[#161822] shadow-2xs">
              <Layers className="w-4 h-4 text-[#714B67] dark:text-purple-400 stroke-[2]" />
              <span className="font-mono font-bold text-sm text-[#714B67] dark:text-purple-300 mt-0.5">
                {samplingCount}
              </span>
              <span className="text-[9.5px] uppercase font-bold text-zinc-500 tracking-tight">Sample</span>
            </div>

            {/* Stat: Costing */}
            <div className="flex flex-col items-center justify-center p-2 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-[#161822] shadow-2xs">
              <Calculator className="w-4 h-4 text-[#017E84] dark:text-teal-400 stroke-[2]" />
              <span className="font-mono font-bold text-sm text-[#017E84] dark:text-teal-300 mt-0.5">
                {costingCount}
              </span>
              <span className="text-[9.5px] uppercase font-bold text-zinc-500 tracking-tight">Costing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StagingWorkspaceHeader;
