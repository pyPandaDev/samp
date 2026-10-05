import React from "react";
import { SampleRequestItem } from "../../types";
import {
  Copy,
  Check,
  Clock,
  Trash2,
  Package,
  Send,
  X,
  PanelRightClose,
} from "lucide-react";

export interface InspectorControlPanelProps {
  request: SampleRequestItem;
  activeRequest: SampleRequestItem;
  trackType: string | null;
  copiedCode: boolean;
  isConverting: boolean;
  isReleasing: boolean;
  isSubmitting: boolean;
  showChatter?: boolean;
  onToggleChatter?: () => void;
  onClose: () => void;
  onCopyCode: () => void;
  onDeleteRequest?: (request: SampleRequestItem) => void;
  onReleaseDraft?: (request: SampleRequestItem) => Promise<void> | void;
  onConvertToSampling: () => Promise<void>;
  onMarketingFinalApprove: (approved: boolean, remark?: string) => Promise<void>;
  setIsReleasing: (val: boolean) => void;
}

export const InspectorControlPanel: React.FC<InspectorControlPanelProps> = ({
  request,
  activeRequest,
  trackType,
  copiedCode,
  isConverting,
  isReleasing,
  isSubmitting,
  showChatter = true,
  onToggleChatter,
  onClose,
  onCopyCode,
  onDeleteRequest,
  onReleaseDraft,
  onConvertToSampling,
  onMarketingFinalApprove,
  setIsReleasing,
}) => {
  return (
    <div className="bg-white dark:bg-[#1a1c24] border-b border-[#D8DADD] dark:border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
      {/* Left Action Buttons (Save, Discard, Workflow Actions) */}
      <div className="flex items-center space-x-2">
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

        {/* Feasibility Specific Production Actions */}
        {trackType === "feasibility_check" && (
          <>
            <div className="h-4 w-px bg-neutral-300 dark:bg-zinc-700 mx-1"></div>

            {/* Feasibility Review Status */}
            {!activeRequest.samplingFeasibilityResponse && (
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300/60 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {activeRequest.takenBySamp ? "In Review by SAMP" : "Awaiting SAMP Claim"}
                </span>
              </span>
            )}

            {/* Marketing Acceptance / Rejection */}
            {!activeRequest.marketingDecision && activeRequest.samplingFeasibilityResponse && (
              <>
                <button
                  type="button"
                  onClick={() => onMarketingFinalApprove(true)}
                  disabled={isSubmitting}
                  className="bg-[#017E84] hover:bg-[#00666A] text-white px-3 py-1 rounded text-xs font-semibold flex items-center space-x-1 shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept Feasibility</span>
                </button>
                <button
                  type="button"
                  onClick={() => onMarketingFinalApprove(false)}
                  disabled={isSubmitting}
                  className="bg-white dark:bg-zinc-800 text-rose-600 border border-rose-300 hover:bg-rose-50 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer disabled:opacity-50"
                >
                  Drop Request
                </button>
              </>
            )}

            {/* Convert to Sampling Request */}
            {activeRequest.marketingDecision === "Accepted" &&
              (activeRequest.convertedSampleRequestId || activeRequest.convertedSrNumber ? (
                <span className="bg-purple-100 text-[#714B67] dark:bg-purple-950/60 dark:text-purple-300 font-mono font-bold px-2.5 py-1 rounded text-xs border border-purple-300/60 flex items-center gap-1.5 shadow-2xs">
                  <Package className="w-3.5 h-3.5 text-[#714B67] dark:text-purple-400" />
                  <span>Sample Created: {activeRequest.convertedSrNumber}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onConvertToSampling}
                  disabled={isConverting}
                  className="bg-[#714B67] hover:bg-[#5B3C53] text-white px-3 py-1 rounded text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Convert accepted feasibility into a commercial sample request"
                >
                  <Package className={`w-3.5 h-3.5 ${isConverting ? "animate-spin" : ""}`} />
                  <span>{isConverting ? "Creating Sample..." : "Request Sampling (Convert)"}</span>
                </button>
              ))}
          </>
        )}

        {/* Draft Release Action */}
        {trackType === "marketing_request" &&
          (String(request.status || "").toLowerCase().includes("draft") ||
            String(request.status || "").toLowerCase().includes("smt") ||
            String(request.status || "").toLowerCase().includes("pending allocation")) &&
          onReleaseDraft && (
            <>
              <div className="h-4 w-px bg-neutral-300 dark:bg-zinc-700 mx-1"></div>
              <button
                type="button"
                onClick={async () => {
                  setIsReleasing(true);
                  try {
                    await onReleaseDraft(request);
                  } finally {
                    setIsReleasing(false);
                  }
                }}
                disabled={isReleasing}
                className="bg-[#017E84] hover:bg-[#00666A] text-white px-3 py-1 rounded text-xs font-semibold flex items-center space-x-1 shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${isReleasing ? "animate-pulse" : ""}`} />
                <span>{isReleasing ? "Releasing..." : "Release Version V2"}</span>
              </button>
            </>
          )}

        <button
          type="button"
          onClick={onCopyCode}
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
          {trackType === "feasibility_check" ? (
            <>
              <div className="o_arrow_button done">1. Request Scope</div>
              <div className={`o_arrow_button ${activeRequest.samplingFeasibilityResponse ? "done" : "active"}`}>
                2. SAMP Review
              </div>
              <div
                className={`o_arrow_button ${
                  activeRequest.marketingDecision
                    ? "done"
                    : activeRequest.samplingFeasibilityResponse
                    ? "active"
                    : ""
                }`}
              >
                3. Commercial Decision
              </div>
              <div
                className={`o_arrow_button ${
                  activeRequest.convertedSrNumber
                    ? "done"
                    : activeRequest.marketingDecision === "Accepted"
                    ? "active"
                    : ""
                }`}
              >
                {activeRequest.convertedSrNumber
                  ? `4. Sample: ${activeRequest.convertedSrNumber}`
                  : "4. Sampling Conversion"}
              </div>
            </>
          ) : trackType === "program_planning" ? (
            <>
              <div className="o_arrow_button done">1. Seasonal Master</div>
              <div className="o_arrow_button active">2. Material Allocation</div>
              <div className="o_arrow_button">3. Lab Sign-Off</div>
              <div className="o_arrow_button">4. Plant Scheduled</div>
            </>
          ) : (
            <>
              <div className="o_arrow_button done">1. Draft (Pre-PMT)</div>
              <div className="o_arrow_button done">2. Submitted</div>
              <div className="o_arrow_button active">3. Sampling Review</div>
              <div className="o_arrow_button">4. Released (V2)</div>
              <div className="o_arrow_button">5. Plant Execution</div>
              <div className="o_arrow_button">6. Closed</div>
            </>
          )}
        </div>

        {onToggleChatter && (
          <button
            type="button"
            onClick={onToggleChatter}
            className={`h-7 px-2 rounded flex items-center gap-1.5 text-[11px] font-medium border transition cursor-pointer ${
              showChatter
                ? "bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-200 border-[#CED4DA] dark:border-zinc-700 shadow-2xs"
                : "bg-white dark:bg-zinc-900 text-neutral-500 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-zinc-100 border-[#CED4DA] dark:border-zinc-700"
            }`}
            title={showChatter ? "Collapse Chatter (Full Width Form)" : "Expand Chatter Panel"}
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
        )}

        {/* Modal Close [X] with Esc */}
        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 rounded flex items-center justify-center text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
