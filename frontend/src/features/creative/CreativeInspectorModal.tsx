import React, { useState, useMemo } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Clock,
  Sparkles,
  Send,
  ExternalLink,
  FolderGit2,
  Folder,
  Plus,
  Trash2,
  RefreshCw,
  FileText,
  Users,
  Compass,
} from "lucide-react";
import { CreativeBriefItem, SampleRequestItem, SubmittedDesignItem } from "@/features/sample-requests/types";
import { submitCreativeOutputApi } from "@/infrastructure/api/sampleRequestsApi";

export interface CreativeInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  brief: CreativeBriefItem | null;
  request?: SampleRequestItem | null;
  onUpdateStatus?: (newStatus: CreativeBriefItem["proofStatus"], notes?: string) => Promise<void>;
}

export const CreativeInspectorModal: React.FC<CreativeInspectorModalProps> = ({
  isOpen,
  onClose,
  brief,
  request,
  onUpdateStatus,
}) => {
  const [inspectorTab, setInspectorTab] = useState<"output" | "brief">("output");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Requested target designs count
  const requestedDesignsCount = Number(
    request?.numberOfDesigns ||
    (request as any)?.productArtworkNos ||
    (request as any)?.qtyDesignCosting ||
    brief?.variantsCount ||
    1
  );

  const initialSubmittedCount = Number(
    request?.submittedDesignsCount ||
    brief?.submittedDesignsCount ||
    (request?.submittedDesigns?.length || brief?.submittedDesigns?.length) ||
    requestedDesignsCount
  );

  const initialSubmittedDesigns: SubmittedDesignItem[] = useMemo(() => {
    const existing = request?.submittedDesigns || brief?.submittedDesigns || [];
    if (existing && existing.length > 0) return existing;
    return Array.from({ length: initialSubmittedCount }, (_, i) => ({
      code: `D${i + 1}`,
      shutterstockNo: "",
      remark: "",
    }));
  }, [request?.submittedDesigns, brief?.submittedDesigns, initialSubmittedCount]);

  const [folderPathInput, setFolderPathInput] = useState(
    request?.folderPath || brief?.folderPath || ""
  );
  const [submittedCountInput, setSubmittedCountInput] = useState(initialSubmittedCount);
  const [submittedDesignsList, setSubmittedDesignsList] = useState<SubmittedDesignItem[]>(initialSubmittedDesigns);
  const [isSubmittingOutput, setIsSubmittingOutput] = useState(false);
  const [outputSubmitSuccess, setOutputSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen || (!brief && !request)) return null;

  // Normalized display values
  const artCode = brief?.artCode || request?.materialCode || request?.srNumber || "ART-SPEC";
  const title = brief?.title || request?.productDescription || (request as any)?.opportunityName || request?.programName || "Creative Artwork";
  const brand = brief?.brand || request?.customer || "Navneet Commercial";
  const designer = brief?.designer || request?.createdBy || "Creative Studio";
  const dimensions = brief?.dimensions || "210 x 297 mm (A4)";
  const dueDate = brief?.dueDate || request?.sampleRequiredDate || request?.targetArtworkDateCreative || "Standard SLA";
  const trend = request?.trend || (brief as any)?.trend || null;
  const targetAudience = request?.targetAudience || (brief as any)?.targetAudience || null;
  const finishingNotes = brief?.finishingNotes || request?.descriptionNotes || "Spot UV on embossed logo areas; Matte Lamination";
  const colorSpecs = brief?.colorSpecs || "CMYK + PMS 871C (Gold Metallic)";
  const referenceImages = request?.referenceImages || [];
  const referenceLinks = request?.referenceLinks || [];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1200);
  };

  const handleCountChange = (newCount: number) => {
    const count = Math.max(1, Math.min(100, newCount));
    setSubmittedCountInput(count);
    setSubmittedDesignsList((prev) => {
      const nextList = [...prev];
      if (nextList.length < count) {
        for (let i = nextList.length; i < count; i++) {
          nextList.push({
            code: `D${i + 1}`,
            shutterstockNo: "",
            remark: "",
          });
        }
      } else if (nextList.length > count) {
        return nextList.slice(0, count);
      }
      return nextList;
    });
  };

  const handleDesignRowChange = (index: number, field: "shutterstockNo" | "remark", val: string) => {
    setSubmittedDesignsList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleAddDesignRow = () => {
    const newIdx = submittedDesignsList.length + 1;
    setSubmittedDesignsList((prev) => [
      ...prev,
      { code: `D${newIdx}`, shutterstockNo: "", remark: "" },
    ]);
    setSubmittedCountInput(newIdx);
  };

  const handleRemoveDesignRow = (index: number) => {
    if (submittedDesignsList.length <= 1) return;
    setSubmittedDesignsList((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      const renumbered = filtered.map((item, i) => ({ ...item, code: `D${i + 1}` }));
      setSubmittedCountInput(renumbered.length);
      return renumbered;
    });
  };

  const handleSubmitOutput = async () => {
    if (!folderPathInput.trim()) {
      setSubmitError("Please provide the artwork folder storage path before submitting.");
      return;
    }
    setSubmitError(null);
    setIsSubmittingOutput(true);
    try {
      const targetId =
        request?.designRequestId ||
        (typeof request?.id === "string" ? parseInt(request.id.replace("design-", ""), 10) : request?.id) ||
        (typeof brief?.id === "string" ? parseInt(brief.id.replace("cr-", ""), 10) : brief?.id) ||
        1;

      await submitCreativeOutputApi(targetId, {
        folder_path: folderPathInput.trim(),
        submitted_designs_count: submittedDesignsList.length,
        submitted_designs: submittedDesignsList,
      });

      setOutputSubmitSuccess(true);
      if (onUpdateStatus) {
        await onUpdateStatus(
          "Creative Output Submitted" as any,
          `Output submitted with ${submittedDesignsList.length} designs. Folder: ${folderPathInput.trim()}`
        );
      }
      setTimeout(() => setOutputSubmitSuccess(false), 4000);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to submit creative output.");
    } finally {
      setIsSubmittingOutput(false);
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
        {/* Top Control Bar (Enterprise Plum Accent) */}
        <div className="px-5 py-3.5 border-b border-[#CED4DA] dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-[#12141d] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded border border-[#CED4DA] dark:border-zinc-700 text-xs font-mono font-bold text-[#714B67] dark:text-purple-300 shadow-2xs">
              {artCode}
              <button
                type="button"
                onClick={() => handleCopyCode(artCode)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer ml-1"
                title="Copy Reference Code"
              >
                {copiedCode === artCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </span>
            <span className="text-[11px] font-mono text-zinc-500 font-semibold">({brand})</span>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-md">{title}</span>
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
            <span className="block text-[10px] uppercase font-bold text-zinc-400">Designer / Owner</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate block mt-0.5">{designer}</span>
          </div>
          <div className="pl-3">
            <span className="block text-[10px] uppercase font-bold text-zinc-400">Dimensions</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate block mt-0.5">{dimensions}</span>
          </div>
          <div className="pl-3">
            <span className="block text-[10px] uppercase font-bold text-zinc-400">Color Profile</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate block mt-0.5">{colorSpecs}</span>
          </div>
          <div className="pl-3">
            <span className="block text-[10px] uppercase font-bold text-zinc-400">Due Date</span>
            <span className="font-mono font-bold text-[#714B67] dark:text-purple-300 truncate block mt-0.5">{dueDate}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#CED4DA] dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-[#0f1118] px-4 shrink-0 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setInspectorTab("output")}
            className={`h-9 px-3 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              inspectorTab === "output"
                ? "border-[#714B67] text-[#714B67] dark:text-purple-300"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            Deliverables &amp; Design Output
            <span className="ml-1 px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-[#714B67]/10 text-[#714B67] dark:text-purple-300 font-bold">
              {submittedDesignsList.length}/{requestedDesignsCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setInspectorTab("brief")}
            className={`h-9 px-3 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              inspectorTab === "brief"
                ? "border-[#714B67] text-[#714B67] dark:text-purple-300"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Marketing Brief &amp; Reference Assets
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {inspectorTab === "output" && (
            <div className="space-y-4">
              {/* Revision Alert from Marketing if Revisions Requested */}
              {(request?.marketingDecision === "Revisions_Requested" || (brief as any)?.marketingDecision === "Revisions_Requested") && (
                <div className="p-3.5 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold uppercase tracking-wider text-[11px] block">
                      Marketing Feedback: Revisions / Remaining Designs Requested
                    </span>
                    <p className="text-xs">
                      {request?.marketingDecisionRemarks || (brief as any)?.marketingDecisionRemarks || "Marketing has requested revisions on the submitted artwork concepts or additional variants."}
                    </p>
                  </div>
                </div>
              )}

              {/* Success Feedback banner */}
              {outputSubmitSuccess && (
                <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-xs">
                    ✓ Creative output successfully submitted to Marketing for review!
                  </span>
                </div>
              )}

              {/* Error Feedback */}
              {submitError && (
                <div className="p-3 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-semibold text-xs">{submitError}</span>
                </div>
              )}

              {/* Top Summary & Target Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg border border-[#CED4DA] dark:border-zinc-700 bg-[#F8F9FA] dark:bg-zinc-900/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    Marketing Target
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      {requestedDesignsCount}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">Designs Requested</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-[#CED4DA] dark:border-zinc-700 bg-[#F8F9FA] dark:bg-zinc-900/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    Creative Ready / Produced
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl font-bold font-mono text-[#714B67] dark:text-purple-300">
                      {submittedDesignsList.length}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">Designs Ready</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-[#CED4DA] dark:border-zinc-700 bg-[#F8F9FA] dark:bg-zinc-900/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    Fulfillment Status
                  </span>
                  <div className="mt-1">
                    {submittedDesignsList.length >= requestedDesignsCount ? (
                      <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Full Target Fulfilled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-xs text-amber-700 dark:text-amber-400">
                        <Clock className="w-3.5 h-3.5" /> {requestedDesignsCount - submittedDesignsList.length} Remaining (Partial)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Folder Storage Path Configuration */}
              <div className="p-4 rounded-lg border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-[#12141d] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Folder className="w-4 h-4 text-[#714B67]" />
                      Artwork Server / Storage Folder Path <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Network share path or Cloud drive link where primary .AI, .PSD, and high-res print files are stored.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={folderPathInput}
                    onChange={(e) => setFolderPathInput(e.target.value)}
                    placeholder="e.g. \\192.168.1.100\Creative\BTS2026\Neon_Geometry_Designs\ or https://drive.google.com/..."
                    className="flex-1 p-2.5 text-xs font-mono rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-[#181a24] text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#714B67]"
                  />
                  {folderPathInput && (
                    <button
                      type="button"
                      onClick={() => handleCopyCode(folderPathInput)}
                      className="h-9 px-3 rounded border border-[#CED4DA] dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedCode === folderPathInput ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic D1..Dn Design Breakdown Table */}
              <div className="p-4 rounded-lg border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-[#12141d] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#714B67]" />
                      Design Variant Breakdown (D1 to D{submittedDesignsList.length})
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Specify Shutterstock stock asset reference and concept remarks for each produced design variant.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-zinc-500">Quick adjust count:</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={submittedCountInput}
                      onChange={(e) => handleCountChange(parseInt(e.target.value, 10) || 1)}
                      className="w-16 h-8 text-center text-xs font-mono font-bold rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-[#181a24] text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#714B67]"
                    />
                    <button
                      type="button"
                      onClick={handleAddDesignRow}
                      className="h-8 px-2.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition cursor-pointer flex items-center gap-1"
                      title="Add one more design row"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Row</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded border border-[#CED4DA] dark:border-white/10">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F8F9FA] dark:bg-zinc-800/80 border-b border-[#CED4DA] dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                        <th className="py-2.5 px-3 w-20">Design #</th>
                        <th className="py-2.5 px-3 w-64">Shutterstock Number / Asset ID</th>
                        <th className="py-2.5 px-3">Design Title &amp; Specification Remarks</th>
                        <th className="py-2.5 px-3 w-16 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#CED4DA] dark:divide-white/10">
                      {submittedDesignsList.map((design, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-2 px-3 align-middle">
                            <span className="inline-flex items-center justify-center font-mono font-bold text-xs px-2.5 py-1 rounded bg-[#714B67]/10 dark:bg-purple-950/50 text-[#714B67] dark:text-purple-300 border border-[#714B67]/20">
                              {design.code || `D${idx + 1}`}
                            </span>
                          </td>
                          <td className="py-2 px-3 align-middle">
                            <input
                              type="text"
                              value={design.shutterstockNo}
                              onChange={(e) => handleDesignRowChange(idx, "shutterstockNo", e.target.value)}
                              placeholder="e.g. SS-2489102"
                              className="w-full p-1.5 text-xs font-mono rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-[#181a24] text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#714B67]"
                            />
                          </td>
                          <td className="py-2 px-3 align-middle">
                            <input
                              type="text"
                              value={design.remark}
                              onChange={(e) => handleDesignRowChange(idx, "remark", e.target.value)}
                              placeholder="e.g. Neon geometry pattern with copper foil accents & matte lamination"
                              className="w-full p-1.5 text-xs rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-[#181a24] text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#714B67]"
                            />
                          </td>
                          <td className="py-2 px-3 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => handleRemoveDesignRow(idx)}
                              disabled={submittedDesignsList.length <= 1}
                              className="text-zinc-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-zinc-400 transition cursor-pointer p-1"
                              title="Delete design row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Submit Action Bar */}
                <div className="pt-3 border-t border-zinc-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-zinc-500 text-[11px]">
                    Submitting this form notifies Marketing of your ready designs and allows them to approve or request mockups.
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitOutput}
                    disabled={isSubmittingOutput}
                    className="w-full sm:w-auto h-9 px-5 rounded-md bg-[#714B67] hover:bg-[#5b3c53] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingOutput ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting Output...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Creative Output ({submittedDesignsList.length} Designs)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          {inspectorTab === "brief" && (
            <div className="space-y-4">
              {/* Marketing Creative Intake Brief Card */}
              <div className="p-4 rounded-lg border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-[#12141d] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#714B67]" />
                    Marketing Creative Intake Brief
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Source: {request?.srNumber || artCode}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <Compass className="w-3 h-3 text-[#714B67]" />
                      Trend &amp; Aesthetic Direction
                    </span>
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
                      {trend || "Standard commercial styling. Follow brand guidelines."}
                    </p>
                  </div>

                  <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#714B67]" />
                      Target Audience / Demographic
                    </span>
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
                      {targetAudience || "General retail & commercial consumer market."}
                    </p>
                  </div>
                </div>

                {/* Finishing Notes from Marketing */}
                <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Finishing, Coating &amp; Embellishment Requirements
                  </span>
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
                    {finishingNotes}
                  </p>
                </div>
              </div>

              {/* Reference Links & Images if available */}
              {(referenceImages.length > 0 || referenceLinks.length > 0) && (
                <div className="p-4 bg-white dark:bg-[#12141d] rounded-lg border border-[#CED4DA] dark:border-zinc-700 space-y-3">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Client Moodboard &amp; Reference Assets
                  </span>
                  {referenceImages.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10.5px] font-semibold text-zinc-500 uppercase font-mono">Reference Images:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                        {referenceImages.map((img, i) => (
                          <a
                            key={i}
                            href={img}
                            target="_blank"
                            rel="noreferrer"
                            className="group relative rounded border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-100 dark:bg-zinc-800 hover:border-[#714B67] transition block"
                          >
                            <img
                              src={img}
                              alt={`Reference ${i + 1}`}
                              className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="p-1.5 bg-white dark:bg-zinc-900 flex items-center justify-between text-[10.5px] font-mono">
                              <span className="truncate text-zinc-700 dark:text-zinc-300">Asset #{i + 1}</span>
                              <ExternalLink className="w-3 h-3 text-[#714B67]" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {referenceLinks.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10.5px] font-semibold text-zinc-500 uppercase font-mono">External Web Inspiration:</span>
                      <div className="flex flex-wrap gap-2">
                        {referenceLinks.map((link, i) => (
                          <a
                            key={i}
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-[#714B67] dark:text-purple-300 hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-sm">{link}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#CED4DA] dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-[#12141d] flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-zinc-500">
            Reference: {artCode} · Snapshot Active
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
