import React, { useState } from "react";
import {
  Folder,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Box,
  Send,
  RefreshCw,
  Clock,
  Layers,
} from "lucide-react";
import { SampleRequestItem, SubmittedDesignItem } from "../../types";
import {
  recordDesignMarketingDecisionApi,
} from "@/infrastructure/api/sampleRequestsApi";
import { DesignMockupSelectionModal } from "./DesignMockupSelectionModal";

export interface CreativeDesignReviewTabProps {
  request: SampleRequestItem;
  onUpdate?: () => void;
  onShowFeedback?: (msg: string) => void;
}

export const CreativeDesignReviewTab: React.FC<CreativeDesignReviewTabProps> = ({
  request,
  onUpdate,
  onShowFeedback,
}) => {
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Marketing Decision states
  const [isDecisionBoxOpen, setIsDecisionBoxOpen] = useState(false);
  const [revisionRemarks, setRevisionRemarks] = useState("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Mockup Modal state
  const [isMockupModalOpen, setIsMockupModalOpen] = useState(false);

  // Computed design counts
  const requestedCount = Number(
    request.numberOfDesigns ||
    (request as any).qtyDesignCosting ||
    (request as any).productArtworkNos ||
    1
  );

  const submittedDesigns: SubmittedDesignItem[] = request.submittedDesigns || [];
  const submittedCount = Number(
    request.submittedDesignsCount || submittedDesigns.length || 0
  );

  const remainingCount = Math.max(0, requestedCount - submittedCount);
  const percentComplete = Math.min(100, Math.round((submittedCount / requestedCount) * 100));

  const folderPath = request.folderPath || "";
  const isUrl = folderPath.startsWith("http://") || folderPath.startsWith("https://");

  const selectedMockupDesigns = request.selectedMockupDesigns || [];

  const handleCopyFolder = () => {
    if (!folderPath) return;
    navigator.clipboard.writeText(folderPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 1500);
  };

  const handleCopyShutterstock = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1200);
  };

  const handleAcceptDesigns = async () => {
    setIsSubmittingDecision(true);
    try {
      const targetId = request.designRequestId || request.id;
      await recordDesignMarketingDecisionApi(targetId, {
        decision: "Accepted",
        remarks: "Approved by Marketing Specialist. All submitted concepts cleared.",
      });
      if (onShowFeedback) {
        onShowFeedback("✓ Creative designs accepted & marked approved!");
      }
      if (onUpdate) onUpdate();
    } catch (err: any) {
      alert(err?.message || "Failed to record approval decision.");
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleSendRevision = async () => {
    if (!revisionRemarks.trim()) {
      alert("Please provide remarks explaining the remaining designs or revisions needed.");
      return;
    }
    setIsSubmittingDecision(true);
    try {
      const targetId = request.designRequestId || request.id;
      await recordDesignMarketingDecisionApi(targetId, {
        decision: "Revisions_Requested",
        remarks: revisionRemarks.trim(),
      });
      setIsDecisionBoxOpen(false);
      setRevisionRemarks("");
      if (onShowFeedback) {
        onShowFeedback("✓ Feedback sent to Creative Studio. Revisions requested.");
      }
      if (onUpdate) onUpdate();
    } catch (err: any) {
      alert(err?.message || "Failed to submit revision request.");
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleMockupFinished = (selectedCodes: string[]) => {
    if (onShowFeedback) {
      onShowFeedback(`✓ Studio CAD Mockup requested for designs: ${selectedCodes.join(", ")}!`);
    }
    if (onUpdate) onUpdate();
  };

  return (
    <div className="space-y-4 pt-2 text-xs">
      {/* 1. Header Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-[#F8F9FA] dark:bg-zinc-900/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
            Requested by Marketing
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
              {requestedCount}
            </span>
            <span className="text-xs text-zinc-500 font-medium">Designs</span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-[#F8F9FA] dark:bg-zinc-900/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
            Creative Submitted
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-[#714B67] dark:text-purple-300">
              {submittedCount}
            </span>
            <span className="text-xs text-zinc-500 font-medium">Designs Ready</span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-[#F8F9FA] dark:bg-zinc-900/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
            Remaining Shortfall
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`text-xl font-bold font-mono ${
                remainingCount === 0 ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {remainingCount}
            </span>
            <span className="text-xs text-zinc-500 font-medium">
              {remainingCount === 0 ? "Fulfilled" : "Pending Designs"}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-[#F8F9FA] dark:bg-zinc-900/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
            Mockups Raised
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-teal-600">
              {selectedMockupDesigns.length}
            </span>
            <span className="text-xs text-zinc-500 font-medium">CAD Dielines</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-medium text-zinc-500">
          <span>Delivery Progress ({submittedCount} of {requestedCount} designs)</span>
          <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{percentComplete}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${
              percentComplete >= 100
                ? "bg-emerald-500"
                : percentComplete > 50
                ? "bg-[#714B67]"
                : "bg-amber-500"
            }`}
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* 2. Folder Path Banner */}
      <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#12141d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded bg-[#714B67]/10 flex items-center justify-center text-[#714B67] dark:text-purple-300 shrink-0">
            <Folder className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
              Creative Artwork Storage / Folder Path
            </span>
            {folderPath ? (
              <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate block">
                {folderPath}
              </span>
            ) : (
              <span className="text-xs text-zinc-400 italic">
                No storage folder provided by Creative yet.
              </span>
            )}
          </div>
        </div>

        {folderPath && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyFolder}
              className="h-8 px-2.5 rounded border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1.5"
            >
              {copiedPath ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPath ? "Copied" : "Copy Path"}</span>
            </button>
            {isUrl && (
              <a
                href={folderPath}
                target="_blank"
                rel="noreferrer"
                className="h-8 px-2.5 rounded bg-[#714B67] text-white text-xs font-semibold hover:bg-[#5a3b52] transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Folder</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* 3. Decision Status Banner */}
      {request.marketingDecision === "Accepted" && (
        <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">
            ✓ Marketing Decision: Designs Accepted &amp; Approved! You can proceed to request physical CAD mockups.
          </span>
        </div>
      )}

      {request.marketingDecision === "Revisions_Requested" && (
        <div className="p-3.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-bold">
              Marketing Revisions / Remaining Designs Requested:
            </span>
          </div>
          <p className="text-xs pl-6 text-amber-800 dark:text-amber-300">
            {request.marketingDecisionRemarks || "Please complete the remaining requested designs or revise current artworks."}
          </p>
        </div>
      )}

      {/* 4. Action Buttons Toolbar */}
      <div className="p-4 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#12141d] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#714B67]" />
              Marketing Review &amp; Downstream Decisions
            </h4>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Review Creative's submitted artworks. Accept &amp; close, request remaining designs, or choose specific variants for physical CAD mockups.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Accept & Close */}
            <button
              type="button"
              onClick={handleAcceptDesigns}
              disabled={isSubmittingDecision || request.marketingDecision === "Accepted"}
              className="h-8.5 px-3.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Accept &amp; Close</span>
            </button>

            {/* Request Remaining */}
            <button
              type="button"
              onClick={() => setIsDecisionBoxOpen(!isDecisionBoxOpen)}
              disabled={isSubmittingDecision}
              className="h-8.5 px-3.5 rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {remainingCount > 0 ? `Request Remaining (${remainingCount})` : "Request Revisions"}
              </span>
            </button>

            {/* Request CAD Mockup */}
            {submittedDesigns.length > 0 && (
              <button
                type="button"
                onClick={() => setIsMockupModalOpen(true)}
                className="h-8.5 px-3.5 rounded bg-[#714B67] hover:bg-[#5b3c53] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <Box className="w-3.5 h-3.5" />
                <span>
                  {selectedMockupDesigns.length > 0
                    ? `CAD Mockups (${selectedMockupDesigns.length} Chosen)`
                    : "Request CAD Mockup"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Inline Feedback Box for Requesting Remaining */}
        {isDecisionBoxOpen && (
          <div className="pt-3 border-t border-zinc-200 dark:border-white/10 space-y-2 animate-in fade-in duration-150">
            <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
              <span>Feedback &amp; Remarks for Creative Studio:</span>
            </label>
            <textarea
              rows={2}
              value={revisionRemarks}
              onChange={(e) => setRevisionRemarks(e.target.value)}
              placeholder={`e.g. Creative provided ${submittedCount} designs, please prepare the remaining ${remainingCount} designs with minimalist geometric style...`}
              className="w-full p-2.5 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#181a24] text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#714B67]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDecisionBoxOpen(false)}
                className="h-7.5 px-3 rounded border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendRevision}
                disabled={isSubmittingDecision}
                className="h-7.5 px-3.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Submit to Creative</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Submitted Designs Breakdown Table */}
      <div className="p-4 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#12141d] space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#714B67]" />
            <span>Design Variant Details ({submittedDesigns.length} Available)</span>
          </h4>
          {selectedMockupDesigns.length > 0 && (
            <span className="text-[11px] font-mono text-teal-700 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
              Mockup Selected: {selectedMockupDesigns.join(", ")}
            </span>
          )}
        </div>

        {submittedDesigns.length === 0 ? (
          <div className="py-8 text-center text-zinc-400 space-y-1">
            <Clock className="w-6 h-6 mx-auto text-zinc-300 dark:text-zinc-600" />
            <p className="font-semibold text-xs">Awaiting Creative Studio Output</p>
            <p className="text-[11px]">The creative team has not submitted the D1..Dn design breakdown yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-zinc-200 dark:border-white/10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FA] dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  <th className="py-2.5 px-3 w-20">Variant</th>
                  <th className="py-2.5 px-3 w-56">Shutterstock Number</th>
                  <th className="py-2.5 px-3">Concept &amp; Specification Remarks</th>
                  <th className="py-2.5 px-3 w-36 text-center">CAD Mockup</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
                {submittedDesigns.map((design) => {
                  const hasMockup = selectedMockupDesigns.includes(design.code);
                  return (
                    <tr
                      key={design.code}
                      className="hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-2 px-3 align-middle">
                        <span className="inline-flex items-center justify-center font-mono font-bold text-xs px-2.5 py-1 rounded bg-[#714B67]/10 dark:bg-purple-950/50 text-[#714B67] dark:text-purple-300 border border-[#714B67]/20">
                          {design.code}
                        </span>
                      </td>
                      <td className="py-2 px-3 align-middle font-mono text-xs">
                        {design.shutterstockNo ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              {design.shutterstockNo}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyShutterstock(design.shutterstockNo)}
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5"
                              title="Copy Asset ID"
                            >
                              {copiedCode === design.shutterstockNo ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-2 px-3 align-middle text-zinc-700 dark:text-zinc-300">
                        {design.remark || "—"}
                      </td>
                      <td className="py-2 px-3 text-center align-middle">
                        {hasMockup ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                            <Check className="w-3 h-3" /> Selected
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mockup Selection Modal */}
      {isMockupModalOpen && (
        <DesignMockupSelectionModal
          isOpen={isMockupModalOpen}
          onClose={() => setIsMockupModalOpen(false)}
          requestId={request.designRequestId || request.id}
          submittedDesigns={submittedDesigns}
          currentlySelectedDesigns={selectedMockupDesigns}
          productDescription={request.productDescription}
          onMockupRequested={handleMockupFinished}
        />
      )}
    </div>
  );
};
