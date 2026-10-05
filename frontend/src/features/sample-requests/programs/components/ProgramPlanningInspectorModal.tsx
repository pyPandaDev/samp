import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Building2,
  Copy,
  Layers,
  MessageSquare,
  Highlighter,
  Clock,
  Trash2,
  Plus,
  Send,
  RefreshCw,
  Calendar,
  FileText,
  ExternalLink,
  PanelRightClose,
} from "lucide-react";
import { SampleRequestItem } from "../../types";
import {
  updateBatchProgramSampRemarksApi,
  updateSingleMaterialSampRemarkApi,
  updateProgramRequestStatusApi,
  addProgramMaterialApi,
  deleteProgramMaterialApi,
  addProgramNoteApi,
  mapProgramRequestToSampleRequest,
} from "@/infrastructure/api/programsApi";
import { formatErpDate, formatLogDate } from "../../utils/dateUtils";
import {
  ProgramChatterFeed,
  ProgramMaterialReviewItem,
  isMaterialAddedRecently,
} from "./ProgramChatterFeed";
import { UserProfile } from "@/features/auth";

export interface ProgramPlanningInspectorModalProps {
  request: SampleRequestItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => Promise<void>;
  mode?: "marketing" | "sampling";
  userRole?: string;
  user?: UserProfile | null;
  currentUser?: UserProfile | null;
  onDeleteRequest?: (req: SampleRequestItem) => void;
}

// Helper to encode and decode column highlights in samp_remark
export function parseSampRemark(raw?: string): { text: string; highlightedCols: string[] } {
  if (!raw) return { text: "", highlightedCols: [] };
  const match = raw.match(/^\[\[flags:([a-z0-9_,-]+)\]\]\s*(.*)$/i);
  if (match) {
    const cols = match[1].split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    return { text: match[2] || "", highlightedCols: cols };
  }
  return { text: raw, highlightedCols: [] };
}

export function formatSampRemark(text: string, highlightedCols: string[]): string {
  const cleanText = text.trim();
  if (highlightedCols.length === 0) return cleanText;
  return `[[flags:${highlightedCols.join(",")}]] ${cleanText}`;
}

export const ProgramPlanningInspectorModal: React.FC<ProgramPlanningInspectorModalProps> = ({
  request,
  isOpen,
  onClose,
  onRefresh,
  mode = "marketing",
  userRole,
  user,
  currentUser,
  onDeleteRequest,
}) => {
  const isSamplingMode = mode === "sampling";

  // Tab State: 1. specs (Material Matrix), 2. scope (Campaign Scope), 3. plant (Plant Specs)
  const [activeTab, setActiveTab] = useState<"specs" | "scope" | "plant">("specs");
  const [showChatter, setShowChatter] = useState<boolean>(true);

  // Keep synced internal request for immediate chatter updates
  const [internalRequest, setInternalRequest] = useState<SampleRequestItem | null>(null);
  const activeRequest = internalRequest || request;

  // Local state for material matrix rows
  const [rows, setRows] = useState<ProgramMaterialReviewItem[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingRowId, setSavingRowId] = useState<number | string | null>(null);
  const [savedRowId, setSavedRowId] = useState<number | string | null>(null);
  const [deletingRowId, setDeletingRowId] = useState<number | string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inline "Add a Line" Row state (Authentic Enterprise behavior)
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newMaterialType, setNewMaterialType] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newColorVariant, setNewColorVariant] = useState("");
  const [newCaliperWt, setNewCaliperWt] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newUnit, setNewUnit] = useState("pcs");
  const [newRemark, setNewRemark] = useState("");
  const [isSavingNewRow, setIsSavingNewRow] = useState(false);

  // Initialize internalRequest when prop changes
  useEffect(() => {
    setInternalRequest(request);
  }, [request]);

  // Sync rows from activeRequest
  useEffect(() => {
    if (!activeRequest) return;
    setSaveSuccess(false);
    setErrorMessage(null);
    setCopiedCode(false);
    setIsAddingRow(false);

    const materials = activeRequest.programMaterials || [];
    if (materials.length > 0) {
      setRows(
        materials.map((m, idx) => {
          const { text, highlightedCols } = parseSampRemark(m.sampRemark);
          return {
            id: m.id != null ? m.id : idx + 1,
            materialType: m.materialType || "",
            supplierName: m.supplierName || "",
            grade: m.grade || "",
            colorVariant: m.colorVariant || "",
            caliperWt: m.caliperWt || "",
            quantity: m.quantity || "",
            unit: m.unit || "pcs",
            remark: m.remark || "",
            createdAt: m.createdAt,
            highlightedCols,
            sampRemarkText: text,
          };
        })
      );
    } else {
      setRows([
        {
          id: 1,
          materialType: activeRequest.materialCode || "Main Material Specification",
          supplierName: "Pending Assignment",
          grade: "Standard",
          colorVariant: "Standard",
          caliperWt: "Standard",
          quantity: "5000",
          unit: "pcs",
          remark: "Initial matrix specification",
          createdAt: activeRequest.createdAt,
          highlightedCols: [],
          sampRemarkText: "",
        },
      ]);
    }
  }, [activeRequest]);


  if (!isOpen || !request) return null;

  // Toggle highlight for a specific column in a row (Sampling Team capability)
  const toggleColumnHighlight = (rowId: number | string, colId: string) => {
    if (!isSamplingMode) return;
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const exists = r.highlightedCols.includes(colId);
        const nextCols = exists
          ? r.highlightedCols.filter((c) => c !== colId)
          : [...r.highlightedCols, colId];
        return { ...r, highlightedCols: nextCols };
      })
    );
  };

  // Update text remark for a row
  const updateSampRemarkText = (rowId: number | string, text: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, sampRemarkText: text } : r))
    );
  };

  // Append a quick tag to remark
  const appendQuickTag = (rowId: number | string, tag: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const current = r.sampRemarkText.trim();
        const nextText = current ? `${current} • [${tag}]` : `[${tag}]`;
        return { ...r, sampRemarkText: nextText };
      })
    );
  };

  const handleCopyCode = () => {
    if (!activeRequest) return;
    const code = activeRequest.srNumber || activeRequest.materialCode || `PG-${activeRequest.id}`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  // Add communication note to program request chatter
  const handleAddNote = async (note: string) => {
    if (!activeRequest?.id) return;
    try {
      const updated = await addProgramNoteApi(activeRequest.id, note);
      const mapped = mapProgramRequestToSampleRequest(updated);
      setInternalRequest(mapped);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      console.error("Failed to add note to program request:", err);
      throw err;
    }
  };

  // Delete a material row specification
  const handleDeleteRow = async (rowId: number | string) => {
    if (!activeRequest?.id) return;
    setDeletingRowId(rowId);
    setErrorMessage(null);

    try {
      const updated = await deleteProgramMaterialApi(activeRequest.id, rowId);
      const mapped = mapProgramRequestToSampleRequest(updated);
      setInternalRequest(mapped);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      console.error("Failed to delete material row:", err);
      setErrorMessage(err?.message || "Failed to remove material line.");
    } finally {
      setDeletingRowId(null);
    }
  };

  // Save single row SAMP remark + flags
  const handleSaveSingleRowRemark = async (rowId: number | string) => {
    const targetRow = rows.find((r) => r.id === rowId);
    if (!targetRow || !activeRequest?.id) return;

    setSavingRowId(rowId);
    setErrorMessage(null);

    try {
      const formattedRemark = formatSampRemark(targetRow.sampRemarkText, targetRow.highlightedCols);
      let updatedRecord;
      if (typeof targetRow.id === "number" || !isNaN(Number(targetRow.id))) {
        updatedRecord = await updateSingleMaterialSampRemarkApi(activeRequest.id, Number(targetRow.id), formattedRemark);
      } else {
        updatedRecord = await updateBatchProgramSampRemarksApi(activeRequest.id, [
          {
            material_id: Number(targetRow.id) || 1,
            samp_remark: formattedRemark,
          },
        ]);
      }

      if (updatedRecord) {
        const mapped = mapProgramRequestToSampleRequest(updatedRecord);
        setInternalRequest(mapped);
      }

      setSavedRowId(rowId);
      setTimeout(() => setSavedRowId(null), 2500);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("samp:requests-changed"));
      }
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      console.error("Failed to save row remark via API:", err);
      setErrorMessage(err?.message || "Failed to save sampling remark.");
    } finally {
      setSavingRowId(null);
    }
  };

  // Save new inline material row (Marketing Enterprise "+ Add a Line")
  const handleSaveNewInlineRow = async () => {
    if (!newMaterialType.trim()) {
      setErrorMessage("Please specify a Material Type.");
      return;
    }
    if (!activeRequest?.id) return;

    setIsSavingNewRow(true);
    setErrorMessage(null);

    const payload = {
      material_type: newMaterialType.trim(),
      supplier_name: newSupplierName.trim() || null,
      grade: newGrade.trim() || null,
      color_variant: newColorVariant.trim() || null,
      caliper_wt: newCaliperWt.trim() || null,
      quantity: newQuantity.trim() || "1",
      unit: newUnit.trim() || "pcs",
      remark: newRemark.trim() || null,
    };

    try {
      const updated = await addProgramMaterialApi(activeRequest.id, payload);
      const mapped = mapProgramRequestToSampleRequest(updated);
      setInternalRequest(mapped);

      setIsAddingRow(false);
      setNewMaterialType("");
      setNewSupplierName("");
      setNewGrade("");
      setNewColorVariant("");
      setNewCaliperWt("");
      setNewQuantity("");
      setNewRemark("");

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("samp:requests-changed"));
      }
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to add material row to program matrix.");
    } finally {
      setIsSavingNewRow(false);
    }
  };

  // Mark Program as Reviewed by SAMP (Final Sign-off)
  const handleMarkAsReviewed = async () => {
    if (!activeRequest?.id) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const payloadRemarks = rows
        .filter((r) => typeof r.id === "number" || !isNaN(Number(r.id)))
        .map((r) => ({
          material_id: Number(r.id),
          samp_remark: formatSampRemark(r.sampRemarkText, r.highlightedCols),
        }));

      if (payloadRemarks.length > 0) {
        await updateBatchProgramSampRemarksApi(activeRequest.id, payloadRemarks);
      }

      const updatedRecord = await updateProgramRequestStatusApi(activeRequest.id, "Reviewed by SAMP");
      if (updatedRecord) {
        const mapped = mapProgramRequestToSampleRequest(updatedRecord);
        setInternalRequest(mapped);
      }

      setSaveSuccess(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("samp:requests-changed"));
      }
      if (onRefresh) {
        await onRefresh();
      }
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to mark program planning as reviewed.");
    } finally {
      setIsSaving(false);
    }
  };


  if (!isOpen || !activeRequest) return null;

  const totalFlaggedCols = rows.reduce((acc, r) => acc + r.highlightedCols.length, 0);
  const totalRemarksEntered = rows.filter((r) => r.sampRemarkText.trim() || r.highlightedCols.length > 0).length;
  const isReviewed =
    activeRequest.status?.toLowerCase().includes("reviewed") ||
    activeRequest.status?.toLowerCase().includes("approved");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 animate-smooth-backdrop"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[96vw] xl:max-w-7xl h-[92vh] max-h-[92vh] flex flex-col bg-[#F1F3F5] dark:bg-[#0c0d12] border border-[#D8DADD] dark:border-white/10 rounded-md shadow-xl overflow-hidden select-text text-xs animate-smooth-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ══════════════════════════════════════════════════════════════════
            1. TOP CONTROL PANEL (EXACT ENTERPRISE ERP ERP THEME ACCORDING TO APP)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-[#1a1c24] border-b border-[#D8DADD] dark:border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
          {/* Left Action Buttons */}
          <div className="flex items-center space-x-2">
            {isSamplingMode ? (
              <>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleMarkAsReviewed}
                  className="bg-[#714B67] hover:bg-[#5B3C53] text-white px-3 py-1 rounded text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Sign off and mark as reviewed by SAMP Lab"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Saving..." : "Sign-off & Mark as Reviewed"}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-neutral-600 dark:text-zinc-300 border border-[#CED4DA] dark:border-zinc-700 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#714B67] hover:bg-[#5B3C53] text-white px-3 py-1 rounded text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <span>Save &amp; Close</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-700 text-neutral-600 dark:text-zinc-300 border border-[#CED4DA] dark:border-zinc-700 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer"
                >
                  Discard
                </button>
              </>
            )}

            <div className="h-4 w-px bg-neutral-300 dark:bg-zinc-700 mx-1"></div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="text-neutral-500 hover:text-[#714B67] dark:hover:text-purple-300 font-medium px-2 py-1 text-xs flex items-center gap-1 cursor-pointer"
              title="Copy request code"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? "Copied" : "Copy Code"}</span>
            </button>

            {onDeleteRequest && (
              <button
                type="button"
                onClick={() => onDeleteRequest(request)}
                className="text-neutral-400 hover:text-rose-600 font-medium px-2 py-1 text-xs flex items-center gap-1 cursor-pointer"
                title="Delete this request"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>

          {/* Right: Authentic Enterprise Statusbar Polygon Stepper */}
          <div className="flex items-center gap-2">
            <div className="o_statusbar_status select-none">
              <div className="o_arrow_button done">1. Program Created</div>
              <div className={`o_arrow_button ${isReviewed ? "done" : "active"}`}>
                2. SAMP Review
              </div>
              <div
                className={`o_arrow_button ${
                  isReviewed
                    ? request.status?.toLowerCase().includes("prod")
                      ? "done"
                      : "active"
                    : ""
                }`}
              >
                3. Reviewed by SAMP
              </div>
              <div
                className={`o_arrow_button ${
                  request.status?.toLowerCase().includes("prod") ? "active done" : ""
                }`}
              >
                4. Production Handoff
              </div>
            </div>

            {/* Chatter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowChatter((prev) => !prev)}
              className={`h-7 px-2 rounded flex items-center gap-1.5 text-[11px] font-medium border transition cursor-pointer ${
                showChatter
                  ? "bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-200 border-[#CED4DA] dark:border-zinc-700 shadow-2xs"
                  : "bg-white dark:bg-zinc-900 text-neutral-500 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-zinc-100 border-[#CED4DA] dark:border-zinc-700"
              }`}
              title={showChatter ? "Collapse Chatter (Full Width Matrix)" : "Expand Chatter Panel"}
              aria-label={showChatter ? "Hide Chatter Panel" : "Show Chatter Panel"}
            >
              <PanelRightClose
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showChatter ? "" : "rotate-180"
                }`}
              />
              <span className="hidden sm:inline">
                {showChatter ? "Hide Chatter" : "Chatter"}
              </span>
            </button>

            {/* Modal Close [X] */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {saveSuccess && (
          <div className="mx-6 mt-3 px-3.5 py-2 rounded-sm bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Program technical specifications &amp; status updated successfully!</span>
          </div>
        )}

        {errorMessage && (
          <div className="mx-6 mt-3 px-3.5 py-2 rounded-sm bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            2. MAIN WORKSPACE VIEWPORT (SPLIT: FORM SHEET + CHATTER FEED)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: FORM SHEET (AUTHENTIC ENTERPRISE ERP DOCUMENT CANVAS) */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#F1F3F5] dark:bg-[#0c0d12]">
            <div className="o_form_sheet max-w-5xl mx-auto rounded-sm bg-white dark:bg-[#12141d] border border-[#D8DADD] dark:border-white/10 shadow-sm overflow-hidden">
              
              {/* Enterprise Sheet Header with Smart Stats Ribbon */}
              <div className="flex justify-between items-center border-b border-[#E2E8F0] dark:border-white/10 bg-[#FBFBFC] dark:bg-zinc-900/40 flex-wrap">
                <div className="px-5 py-2.5 flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#714B67] dark:text-purple-300">
                    Ref: {request.srNumber || request.materialCode || `PG-${request.id}`}
                  </span>
                  <span className="text-neutral-300">/</span>
                  <span className="font-mono text-[11px] text-neutral-500">
                    Seasonal Program Planning
                  </span>
                  <span className="text-neutral-300">/</span>
                  <span className="bg-purple-100 dark:bg-purple-950/60 text-[#714B67] dark:text-purple-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    Season {request.programYear || "2026"}
                  </span>
                </div>

                {/* Enterprise Smart Stat Buttons */}
                <div className="flex items-center flex-wrap">
                  <div className="oe_stat_button text-left" title="Total Material Specifications">
                    <div className="text-[#017E84]">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="leading-tight">
                      <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-mono">
                        {rows.length} SKUs
                      </div>
                      <div className="text-[10px] text-neutral-500">Line Items</div>
                    </div>
                  </div>

                  <div className="oe_stat_button text-left" title="Highlighted / Flagged Cells">
                    <div className="text-amber-600">
                      <Highlighter className="w-4 h-4" />
                    </div>
                    <div className="leading-tight">
                      <div className="font-bold text-xs text-amber-700 dark:text-amber-400 font-mono">
                        {totalFlaggedCols} Flags
                      </div>
                      <div className="text-[10px] text-neutral-500">Highlighted</div>
                    </div>
                  </div>

                  <div className="oe_stat_button text-left" title="SAMP Technical Remarks Logged">
                    <div className="text-[#714B67]">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="leading-tight">
                      <div className="font-bold text-xs text-[#714B67] dark:text-purple-300 font-mono">
                        {totalRemarksEntered} of {rows.length}
                      </div>
                      <div className="text-[10px] text-neutral-500">Evaluated</div>
                    </div>
                  </div>

                  <div className="oe_stat_button text-left" title="Target Manufacturing Center">
                    <div className="text-neutral-500">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="leading-tight">
                      <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-mono">
                        {request.targetPlant || "1505"}
                      </div>
                      <div className="text-[10px] text-neutral-500">Plant Center</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Title & Metadata Block */}
              <div className="p-5 border-b border-[#F1F3F5] dark:border-white/[0.05]">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-zinc-50 tracking-tight font-sans">
                      {request.programName || request.productDescription || "Seasonal Program Planning"}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600 dark:text-zinc-400 font-medium">
                      <div>
                        Customer: <strong className="text-neutral-900 dark:text-zinc-100">{request.customer}</strong>
                      </div>
                      <span>•</span>
                      <div>
                        Program Year: <strong className="font-mono text-[#714B67] dark:text-purple-300">{request.programYear || "2026"}</strong>
                      </div>
                      <span>•</span>
                      <div>
                        Target Plant: <strong className="font-mono">{request.targetPlant || "1505-Nadiad"}</strong>
                      </div>
                      <span>•</span>
                      <div>
                        Created by: <span className="font-mono">{request.createdBy || "Marketing Specialist"}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold font-mono border ${
                      isReviewed
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                    }`}
                  >
                    {isReviewed ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    <span>{isReviewed ? "Reviewed by SAMP" : "Pending SAMP Review"}</span>
                  </span>
                </div>
              </div>

              {/* Notebook Tab Strip */}
              <div className="px-6 pb-6 pt-2">
                <div className="border-b border-[#D8DADD] dark:border-white/10 flex items-center space-x-6 text-xs font-semibold overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab("specs")}
                    className={`pb-2.5 border-b-2 transition cursor-pointer select-none flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === "specs"
                        ? "border-[#714B67] text-[#714B67] dark:text-purple-300 font-bold"
                        : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span>1. Material Specification Matrix</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-purple-100 dark:bg-purple-950/60 text-[#714B67] dark:text-purple-300 font-bold">
                      {rows.length} Lines
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("scope")}
                    className={`pb-2.5 border-b-2 transition cursor-pointer select-none flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === "scope"
                        ? "border-[#714B67] text-[#714B67] dark:text-purple-300 font-bold"
                        : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span>2. Program Scope &amp; Fulfillment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("plant")}
                    className={`pb-2.5 border-b-2 transition cursor-pointer select-none flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === "plant"
                        ? "border-[#714B67] text-[#714B67] dark:text-purple-300 font-bold"
                        : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span>3. Plant Execution Specs</span>
                  </button>
                </div>

                {/* ══════════════════════════════════════════════════════════════════
                    TAB 1: AUTHENTIC ENTERPRISE ERP MATERIAL SPECIFICATIONS TABLE
                ══════════════════════════════════════════════════════════════════ */}
                {activeTab === "specs" && (
                  <div className="py-4 space-y-3">
                    
                    {/* Table Sub-header Controls */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-600 dark:text-zinc-400">
                          Direct Material Allocations scheduled across paper, board, and accessories.
                        </span>
                        {isSamplingMode && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                            <Highlighter className="w-3 h-3" /> Click any column to highlight/flag for revision
                          </span>
                        )}
                      </div>

                      {/* Enterprise Style "+ Add a Line" Button (Marketing only) */}
                      {!isSamplingMode && !isAddingRow && (
                        <button
                          type="button"
                          onClick={() => setIsAddingRow(true)}
                          className="bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-semibold px-2.5 py-1 rounded shadow-xs flex items-center space-x-1 transition cursor-pointer active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add a Line</span>
                        </button>
                      )}
                    </div>

                    {/* Authentic Enterprise Table Container */}
                    <div className="border border-[#CED4DA] dark:border-zinc-700 rounded overflow-x-auto shadow-2xs bg-white dark:bg-[#12141d]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#F8F9FA] dark:bg-zinc-850 border-b border-[#CED4DA] dark:border-zinc-700 text-neutral-600 dark:text-zinc-300 font-bold text-[11px] select-none">
                            <th className="p-2 border-r border-[#CED4DA] dark:border-zinc-700 w-8 text-center">#</th>
                            <th className="p-2 border-r border-[#CED4DA] dark:border-zinc-700">Type</th>
                            <th className="p-2 border-r border-[#CED4DA] dark:border-zinc-700">Supplier</th>
                            <th className="p-2 border-r border-[#CED4DA] dark:border-zinc-700">Grade</th>
                            <th className="p-2 border-r border-[#CED4DA] dark:border-zinc-700">Color</th>
                            <th className="p-2 border-r border-[#CED4DA] dark:border-zinc-700">Caliper / Wt</th>
                            <th className="p-2 border-r border-[#CED4DA] dark:border-zinc-700 text-right">Qty</th>
                            <th className="p-2 border-r border-[#CED4DA] dark:border-zinc-700">Unit</th>
                            <th className="p-2 border-r border-[#CED4DA] dark:border-zinc-700 max-w-[140px]">Marketing Note</th>
                            <th className="p-2 min-w-[280px]">SAMP Technical Review &amp; Remarks</th>
                            {!isSamplingMode && (
                              <th className="p-2 border-l border-[#CED4DA] dark:border-zinc-700 w-10 text-center">Act</th>
                            )}
                          </tr>
                        </thead>


                        <tbody>
                          {rows.map((row, idx) => {
                            const isCellFlagged = (col: string) => row.highlightedCols.includes(col);
                            const isRecent = row.isNewAdded || isMaterialAddedRecently(row.createdAt);

                            return (
                              <tr
                                key={row.id}
                                className="border-b border-[#E9ECEF] dark:border-zinc-800 hover:bg-neutral-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                              >
                                {/* Line # */}
                                <td className="p-2 border-r border-[#E9ECEF] dark:border-zinc-800 text-center font-mono text-neutral-400">
                                  <span>{idx + 1}</span>
                                  {isRecent && (
                                    <span className="block text-[8px] font-mono font-bold bg-emerald-500 text-white px-0.5 rounded mt-0.5 uppercase">
                                      New
                                    </span>
                                  )}
                                </td>

                                {/* Type */}
                                <td
                                  onClick={() => toggleColumnHighlight(row.id, "material_type")}
                                  className={`p-2 border-r border-[#E9ECEF] dark:border-zinc-800 font-semibold transition-colors ${
                                    isCellFlagged("material_type")
                                      ? "bg-[#FEF08A] text-[#854D0E] dark:bg-amber-950/60 dark:text-amber-200 font-bold"
                                      : "text-neutral-800 dark:text-zinc-200"
                                  } ${isSamplingMode ? "cursor-pointer hover:bg-amber-100/50" : ""}`}
                                  title={isSamplingMode ? "Click to toggle revision flag" : undefined}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span>{row.materialType || "—"}</span>
                                    {isCellFlagged("material_type") && (
                                      <span className="text-[9px] px-1 rounded bg-amber-400 text-amber-950 font-mono font-bold">
                                        Flag
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Supplier */}
                                <td
                                  onClick={() => toggleColumnHighlight(row.id, "supplier_name")}
                                  className={`p-2 border-r border-[#E9ECEF] dark:border-zinc-800 transition-colors ${
                                    isCellFlagged("supplier_name")
                                      ? "bg-[#FEF08A] text-[#854D0E] dark:bg-amber-950/60 dark:text-amber-200 font-bold"
                                      : "text-neutral-600 dark:text-zinc-400"
                                  } ${isSamplingMode ? "cursor-pointer hover:bg-amber-100/50" : ""}`}
                                  title={isSamplingMode ? "Click to toggle revision flag" : undefined}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span>{row.supplierName || "—"}</span>
                                    {isCellFlagged("supplier_name") && (
                                      <span className="text-[9px] px-1 rounded bg-amber-400 text-amber-950 font-mono font-bold">
                                        Flag
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Grade */}
                                <td
                                  onClick={() => toggleColumnHighlight(row.id, "grade")}
                                  className={`p-2 border-r border-[#E9ECEF] dark:border-zinc-800 font-mono transition-colors ${
                                    isCellFlagged("grade")
                                      ? "bg-[#FEF08A] text-[#854D0E] dark:bg-amber-950/60 dark:text-amber-200 font-bold"
                                      : "text-neutral-600 dark:text-zinc-400"
                                  } ${isSamplingMode ? "cursor-pointer hover:bg-amber-100/50" : ""}`}
                                  title={isSamplingMode ? "Click to toggle revision flag" : undefined}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span>{row.grade || "—"}</span>
                                    {isCellFlagged("grade") && (
                                      <span className="text-[9px] px-1 rounded bg-amber-400 text-amber-950 font-mono font-bold">
                                        Flag
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Color */}
                                <td
                                  onClick={() => toggleColumnHighlight(row.id, "color_variant")}
                                  className={`p-2 border-r border-[#E9ECEF] dark:border-zinc-800 transition-colors ${
                                    isCellFlagged("color_variant")
                                      ? "bg-[#FEF08A] text-[#854D0E] dark:bg-amber-950/60 dark:text-amber-200 font-bold"
                                      : "text-neutral-600 dark:text-zinc-400"
                                  } ${isSamplingMode ? "cursor-pointer hover:bg-amber-100/50" : ""}`}
                                  title={isSamplingMode ? "Click to toggle revision flag" : undefined}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span>{row.colorVariant || "—"}</span>
                                    {isCellFlagged("color_variant") && (
                                      <span className="text-[9px] px-1 rounded bg-amber-400 text-amber-950 font-mono font-bold">
                                        Flag
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Caliper / WT */}
                                <td
                                  onClick={() => toggleColumnHighlight(row.id, "caliper_wt")}
                                  className={`p-2 border-r border-[#E9ECEF] dark:border-zinc-800 font-mono transition-colors ${
                                    isCellFlagged("caliper_wt")
                                      ? "bg-[#FEF08A] text-[#854D0E] dark:bg-amber-950/60 dark:text-amber-200 font-bold"
                                      : "text-neutral-600 dark:text-zinc-400"
                                  } ${isSamplingMode ? "cursor-pointer hover:bg-amber-100/50" : ""}`}
                                  title={isSamplingMode ? "Click to toggle revision flag" : undefined}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span>{row.caliperWt || "—"}</span>
                                    {isCellFlagged("caliper_wt") && (
                                      <span className="text-[9px] px-1 rounded bg-amber-400 text-amber-950 font-mono font-bold">
                                        Flag
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Qty */}
                                <td
                                  onClick={() => toggleColumnHighlight(row.id, "quantity")}
                                  className={`p-2 border-r border-[#E9ECEF] dark:border-zinc-800 text-right font-mono font-bold transition-colors ${
                                    isCellFlagged("quantity")
                                      ? "bg-[#FEF08A] text-[#854D0E] dark:bg-amber-950/60 dark:text-amber-200 font-bold"
                                      : "text-neutral-800 dark:text-zinc-200"
                                  } ${isSamplingMode ? "cursor-pointer hover:bg-amber-100/50" : ""}`}
                                  title={isSamplingMode ? "Click to toggle revision flag" : undefined}
                                >
                                  <span>{row.quantity}</span>
                                </td>

                                {/* Unit */}
                                <td className="p-2 border-r border-[#E9ECEF] dark:border-zinc-800 text-neutral-500 font-mono">
                                  <span>{row.unit}</span>
                                </td>

                                {/* Marketing Remark */}
                                <td className="p-2 border-r border-[#E9ECEF] dark:border-zinc-800 text-neutral-600 dark:text-zinc-400 italic max-w-[140px] truncate">
                                  <span>{row.remark || "—"}</span>
                                </td>

                                {/* SAMP Technical Review & Remark Cell */}
                                <td className="p-2">
                                  {isSamplingMode ? (
                                    <div className="space-y-1.5">
                                      {/* Row Flag Chips summary if flagged */}
                                      {row.highlightedCols.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1">
                                          <span className="text-[9.5px] font-mono font-bold text-amber-800 dark:text-amber-300">
                                            ⚠️ Flagged:
                                          </span>
                                          {row.highlightedCols.map((c) => (
                                            <span
                                              key={c}
                                              className="px-1 py-0.2 rounded text-[9px] font-mono bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300"
                                            >
                                              {c}
                                            </span>
                                          ))}
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setRows((prev) =>
                                                prev.map((r) =>
                                                  r.id === row.id ? { ...r, highlightedCols: [] } : r
                                                )
                                              )
                                            }
                                            className="text-[9px] text-rose-600 hover:underline cursor-pointer ml-1 font-mono"
                                          >
                                            Clear
                                          </button>
                                        </div>
                                      )}

                                      {/* Input + Save Button */}
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="text"
                                          value={row.sampRemarkText}
                                          onChange={(e) => updateSampRemarkText(row.id, e.target.value)}
                                          placeholder="Type lab remark (tolerances, mill stock, alternate grade)..."
                                          className="flex-1 px-2 py-1 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-zinc-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                                        />
                                        <button
                                          type="button"
                                          disabled={savingRowId === row.id}
                                          onClick={() => handleSaveSingleRowRemark(row.id)}
                                          className="px-2.5 py-1 bg-[#714B67] hover:bg-[#5B3C53] text-white rounded text-[11px] font-semibold cursor-pointer shrink-0 disabled:opacity-50 transition active:scale-95 flex items-center gap-1 shadow-2xs"
                                          title="Save remarks for this line (multiple submits supported)"
                                        >
                                          {savingRowId === row.id ? (
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <Send className="w-3 h-3" />
                                          )}
                                          <span>{savingRowId === row.id ? "Saving..." : "Save"}</span>
                                        </button>
                                        {savedRowId === row.id && (
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        )}
                                      </div>

                                      {/* Quick Presets */}
                                      <div className="flex flex-wrap items-center gap-1">
                                        {[
                                          "Mill Stock Confirmed",
                                          "Not in Mill",
                                          "Alternate Caliper",
                                          "Lead Time 2 Wks",
                                        ].map((tag) => (
                                          <button
                                            key={tag}
                                            type="button"
                                            onClick={() => appendQuickTag(row.id, tag)}
                                            className="px-1.5 py-0.2 rounded border border-[#CED4DA] dark:border-zinc-700 bg-[#F8F9FA] dark:bg-zinc-800 text-[9.5px] text-neutral-600 dark:text-zinc-300 hover:border-[#017E84] hover:text-[#017E84] cursor-pointer"
                                          >
                                            + {tag}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      {row.highlightedCols.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1">
                                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-[#FDF6B2] text-[#8E4B10] dark:bg-amber-950/60 dark:text-amber-300 border border-[#F3C78E]">
                                            ⚠️ Needs Revision: {row.highlightedCols.join(", ")}
                                          </span>
                                        </div>
                                      )}
                                      {row.sampRemarkText ? (
                                        <div className="text-xs text-neutral-800 dark:text-zinc-200 font-sans italic">
                                          &quot;{row.sampRemarkText}&quot;
                                        </div>
                                      ) : (
                                        <span className="text-[10px] font-mono text-neutral-400">
                                          Pending Technical Review
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Action (Delete Line) */}
                                {!isSamplingMode && (
                                  <td className="p-2 border-l border-[#E9ECEF] dark:border-zinc-800 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRow(row.id)}
                                      disabled={deletingRowId === row.id || rows.length <= 1}
                                      className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                      title={rows.length <= 1 ? "Cannot delete only remaining row" : "Delete specification row"}
                                    >
                                      {deletingRowId === row.id ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-500" />
                                      ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}

                          {/* Authentic Enterprise Inline "Add a Line" Row (Marketing Mode) */}
                          {isAddingRow && (
                            <tr className="bg-purple-50/50 dark:bg-purple-950/20 border-b border-purple-200 dark:border-purple-800">
                              <td className="p-2 border-r text-center font-mono text-[#714B67] font-bold">
                                {rows.length + 1}
                              </td>
                              <td className="p-2 border-r">
                                <input
                                  type="text"
                                  placeholder="e.g. Paper"
                                  value={newMaterialType}
                                  onChange={(e) => setNewMaterialType(e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-[#CED4DA] rounded text-xs bg-white dark:bg-zinc-900"
                                />
                              </td>
                              <td className="p-2 border-r">
                                <input
                                  type="text"
                                  placeholder="Supplier"
                                  value={newSupplierName}
                                  onChange={(e) => setNewSupplierName(e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-[#CED4DA] rounded text-xs bg-white dark:bg-zinc-900"
                                />
                              </td>
                              <td className="p-2 border-r">
                                <input
                                  type="text"
                                  placeholder="Grade"
                                  value={newGrade}
                                  onChange={(e) => setNewGrade(e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-[#CED4DA] rounded text-xs bg-white dark:bg-zinc-900 font-mono"
                                />
                              </td>
                              <td className="p-2 border-r">
                                <input
                                  type="text"
                                  placeholder="Color"
                                  value={newColorVariant}
                                  onChange={(e) => setNewColorVariant(e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-[#CED4DA] rounded text-xs bg-white dark:bg-zinc-900"
                                />
                              </td>
                              <td className="p-2 border-r">
                                <input
                                  type="text"
                                  placeholder="Caliper"
                                  value={newCaliperWt}
                                  onChange={(e) => setNewCaliperWt(e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-[#CED4DA] rounded text-xs bg-white dark:bg-zinc-900 font-mono"
                                />
                              </td>
                              <td className="p-2 border-r">
                                <input
                                  type="text"
                                  placeholder="Qty"
                                  value={newQuantity}
                                  onChange={(e) => setNewQuantity(e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-[#CED4DA] rounded text-xs bg-white dark:bg-zinc-900 font-mono text-right"
                                />
                              </td>
                              <td className="p-2 border-r">
                                <input
                                  type="text"
                                  placeholder="Unit"
                                  value={newUnit}
                                  onChange={(e) => setNewUnit(e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-[#CED4DA] rounded text-xs bg-white dark:bg-zinc-900 font-mono"
                                />
                              </td>
                              <td className="p-2 border-r">
                                <input
                                  type="text"
                                  placeholder="Remark"
                                  value={newRemark}
                                  onChange={(e) => setNewRemark(e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-[#CED4DA] rounded text-xs bg-white dark:bg-zinc-900"
                                />
                              </td>
                              <td className="p-2">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={handleSaveNewInlineRow}
                                    disabled={isSavingNewRow}
                                    className="h-6 px-2.5 bg-[#017E84] hover:bg-[#00666A] text-white rounded text-[10.5px] font-bold cursor-pointer disabled:opacity-50 transition"
                                  >
                                    {isSavingNewRow ? "Saving..." : "Save Line"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsAddingRow(false)}
                                    className="h-6 px-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded text-[10.5px] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                              {!isSamplingMode && <td className="p-2 border-l"></td>}
                            </tr>
                          )}
                        </tbody>
                        </table>
                      </div>


                    {/* Footer Summary Strip */}
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono pt-1">
                      <span>Total Matrix Line Items: <strong>{rows.length}</strong></span>
                      <span>Flagged for Revision: <strong className="text-amber-700">{totalFlaggedCols} columns</strong></span>
                      <span>Lab Evaluated: <strong className="text-[#017E84]">{totalRemarksEntered} of {rows.length}</strong></span>
                    </div>

                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    TAB 2: PROGRAM SCOPE & FULFILLMENT
                ══════════════════════════════════════════════════════════════════ */}
                {activeTab === "scope" && (
                  <div className="py-4 space-y-4">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 mb-2 font-mono">
                        Campaign Narrative &amp; Seasonal Overview
                      </div>
                      <div className="p-3.5 rounded-sm border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-zinc-100 leading-relaxed font-sans whitespace-pre-wrap">
                        {request.productDescription || "Seasonal BTS program planning request with multi-material matrix."}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-sm border border-[#E2E8F0] dark:border-white/10 bg-[#FBFBFC] dark:bg-zinc-900/40 space-y-2">
                        <span className="text-[10px] font-mono uppercase font-bold text-neutral-400 block">
                          Customer Account
                        </span>
                        <div className="text-sm font-bold text-neutral-900 dark:text-zinc-100">
                          {request.customer}
                        </div>
                        <p className="text-xs text-neutral-500">
                          Enterprise scholastic partner for annual print &amp; stationery cycles.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-sm border border-[#E2E8F0] dark:border-white/10 bg-[#FBFBFC] dark:bg-zinc-900/40 space-y-2">
                        <span className="text-[10px] font-mono uppercase font-bold text-neutral-400 block">
                          Fulfillment Facility Center
                        </span>
                        <div className="text-sm font-bold text-[#714B67] dark:text-purple-300 font-mono">
                          {request.targetPlant || "1505-Nadiad"}
                        </div>
                        <p className="text-xs text-neutral-500">
                          Manufacturing facility designated for material reservations &amp; trial lot execution.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    TAB 3: PLANT EXECUTION SPECS
                ══════════════════════════════════════════════════════════════════ */}
                {activeTab === "plant" && (
                  <div className="py-4 space-y-4">
                    <div className="p-4 rounded-sm border border-[#E2E8F0] dark:border-white/10 bg-[#FBFBFC] dark:bg-zinc-900/40 space-y-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#017E84]" />
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
                          Manufacturing Facility Center
                        </h4>
                      </div>
                      <div className="text-xs text-neutral-700 dark:text-zinc-300 leading-relaxed">
                        Assigned Plant: <strong className="text-neutral-900 dark:text-zinc-100 font-mono">{request.targetPlant || "1505-Nadiad"}</strong>
                      </div>
                      <div className="text-[11px] text-neutral-500 leading-relaxed">
                        All raw materials specified in this matrix are scheduled for technical evaluation and stock reservation at this fulfillment facility.
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* RIGHT: CHATTER / AUDIT TRAIL FEED */}
          {showChatter && (
            <ProgramChatterFeed
              request={activeRequest}
              materialRows={rows}
              isSamplingMode={isSamplingMode}
              onAddNote={handleAddNote}
              currentUser={currentUser || user}
            />
          )}
        </div>


      </div>
    </div>
  );
};

export default ProgramPlanningInspectorModal;
