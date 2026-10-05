import React from "react";
import { SampleRequestItem } from "../../types";
import {
  Clock,
  Building2,
  FileText,
  Package,
  Sparkles,
  ThumbsUp,
  ClipboardCheck,
  Check,
  ExternalLink,
} from "lucide-react";
import { ParsedFeasibilityDetails } from "../../utils/feasibilityParsers";

export interface InspectorSheetHeaderProps {
  request: SampleRequestItem;
  activeRequest: SampleRequestItem;
  trackType: string | null;
  displayType: string;
  primaryTitle: string;
  feasibilityDetails: ParsedFeasibilityDetails;
  previewableImagesCount: number;
  isSubmitting: boolean;
  isConverting: boolean;
  onOpenReviewTab: () => void;
  onMarketingFinalApprove: (approved: boolean, remark?: string) => Promise<void>;
  onConvertToSampling: () => Promise<void>;
}

export const InspectorSheetHeader: React.FC<InspectorSheetHeaderProps> = ({
  request,
  activeRequest,
  trackType,
  displayType,
  primaryTitle,
  feasibilityDetails,
  previewableImagesCount,
  isSubmitting,
  isConverting,
  onOpenReviewTab,
  onMarketingFinalApprove,
  onConvertToSampling,
}) => {
  return (
    <>
      {/* Enterprise Smart Stat Buttons Ribbon (Top-Right of Sheet) */}
      <div className="flex justify-between items-center border-b border-[#E2E8F0] dark:border-white/10 bg-[#FBFBFC] dark:bg-zinc-900/40 flex-wrap">
        <div className="px-5 py-2 flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-[#714B67] dark:text-purple-300">
            PMT No: {request.srNumber || `SR-${request.id}`}
          </span>
          <span className="text-neutral-300">/</span>
          <span className="font-mono text-[11px] text-neutral-500">
            Track:{" "}
            {trackType === "feasibility_check"
              ? "Feasibility Check"
              : trackType === "program_planning"
              ? "Program Planning"
              : "Sampling"}
          </span>
          <span className="text-neutral-300">/</span>
          <span className="bg-purple-100 dark:bg-purple-950/60 text-[#714B67] dark:text-purple-300 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded">
            Active Snapshot: V1.0
          </span>
        </div>

        <div className="flex items-center flex-wrap">
          {/* Stat 1: SLA Target */}
          <div className="oe_stat_button text-left" title="Target SLA Due Date">
            <div className="text-[#017E84]">
              <Clock className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-mono">
                {request.sampleRequiredDate || request.dateRequestCreated || "2026-10-12"}
              </div>
              <div className="text-[10px] text-neutral-500">Target SLA Date</div>
            </div>
          </div>

          {/* Stat 2: Facility */}
          <div className="oe_stat_button text-left" title="Assigned Fulfillment Plant">
            <div className="text-[#714B67]">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate max-w-[120px]">
                {request.targetPlant
                  ? request.targetPlant.replace(/^\d{4}-?\s*/, "").trim()
                  : "Plant 1 (Pune)"}
              </div>
              <div className="text-[10px] text-neutral-500">Plant Facility</div>
            </div>
          </div>

          {/* Stat 3: Attachments / Materials */}
          <div className="oe_stat_button text-left" title="Evidence & Specifications">
            <div className="text-amber-600">
              <FileText className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-mono">
                {previewableImagesCount + feasibilityDetails.referenceLinks.length} Files
              </div>
              <div className="text-[10px] text-neutral-500">Attachments</div>
            </div>
          </div>
        </div>
      </div>

      {/* User-Friendly Workflow Guidance Callout Banner (Feasibility Track) */}
      {trackType === "feasibility_check" && (
        <div className="border-b border-[#E2E8F0] dark:border-white/10 px-6 py-3 bg-gradient-to-r from-neutral-50 via-white to-neutral-50 dark:from-zinc-900/80 dark:via-zinc-900/40 dark:to-zinc-900/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                activeRequest.convertedSrNumber
                  ? "bg-purple-100 dark:bg-purple-950/60 text-[#714B67] dark:text-purple-300"
                  : activeRequest.marketingDecision === "Accepted"
                  ? "bg-purple-100 dark:bg-purple-950/60 text-[#714B67] dark:text-purple-300 animate-pulse"
                  : activeRequest.samplingFeasibilityResponse
                  ? "bg-teal-100 dark:bg-teal-950/60 text-[#017E84] dark:text-teal-300"
                  : activeRequest.takenBySamp
                  ? "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300"
                  : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
              }`}
            >
              {activeRequest.convertedSrNumber ? (
                <Package className="w-4 h-4" />
              ) : activeRequest.marketingDecision === "Accepted" ? (
                <Sparkles className="w-4 h-4" />
              ) : activeRequest.samplingFeasibilityResponse ? (
                <ThumbsUp className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-400">
                  {activeRequest.convertedSrNumber
                    ? "Stage 4: Active Sampling Created"
                    : activeRequest.marketingDecision === "Accepted"
                    ? "Stage 4: Ready to Convert to Sampling"
                    : activeRequest.samplingFeasibilityResponse
                    ? "Stage 3: Marketing Sign-Off Needed"
                    : activeRequest.takenBySamp
                    ? `Stage 2: In Review by ${activeRequest.takenBySamp}`
                    : "Stage 2: Awaiting SAMP Team Claim"}
                </span>
                {activeRequest.samplingFeasibilityResponse && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                      activeRequest.samplingFeasibilityResponse === "Yes"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : activeRequest.samplingFeasibilityResponse === "No"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    Verdict: {activeRequest.samplingFeasibilityResponse}
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-neutral-700 dark:text-zinc-300 mt-0.5">
                {activeRequest.convertedSrNumber ? (
                  <span>
                    Commercial Sample Request{" "}
                    <span className="font-mono font-bold text-[#714B67] dark:text-purple-300">
                      {activeRequest.convertedSrNumber}
                    </span>{" "}
                    has been generated in active sampling pipeline.
                  </span>
                ) : activeRequest.marketingDecision === "Accepted" ? (
                  <span>
                    Feasibility confirmed and accepted! You can now commission physical sample manufacturing.
                  </span>
                ) : activeRequest.marketingDecision === "Rejected" ? (
                  <span>
                    This feasibility check was dropped/rejected by Marketing. No further actions required.
                  </span>
                ) : activeRequest.samplingFeasibilityResponse ? (
                  <span>
                    SAMP technical assessment complete. Marketing authority must accept or reject to proceed.
                  </span>
                ) : activeRequest.takenBySamp ? (
                  <span>
                    Currently claimed by{" "}
                    <strong className="text-neutral-900 dark:text-zinc-100">
                      {activeRequest.takenBySamp}
                    </strong>
                    . Review specifications and submit technical verdict.
                  </span>
                ) : (
                  <span>
                    Marketing submitted this feasibility check. SAMP team engineer needs to claim and evaluate.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Contextual Quick Action Button */}
          <div className="flex items-center gap-2">
            {!activeRequest.takenBySamp && !activeRequest.samplingFeasibilityResponse && (
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300/60 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Awaiting SAMP Claim</span>
              </span>
            )}

            {!activeRequest.samplingFeasibilityResponse && (
              <button
                type="button"
                onClick={onOpenReviewTab}
                className="bg-white dark:bg-zinc-800 border border-[#CED4DA] dark:border-zinc-700 hover:border-[#017E84] text-neutral-700 dark:text-zinc-200 text-xs font-semibold px-3 py-1.5 rounded shadow-2xs cursor-pointer transition flex items-center gap-1"
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-[#017E84]" />
                <span>Open Technical Review</span>
              </button>
            )}

            {activeRequest.samplingFeasibilityResponse && !activeRequest.marketingDecision && (
              <>
                <button
                  type="button"
                  onClick={() => onMarketingFinalApprove(true)}
                  disabled={isSubmitting}
                  className="bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-bold px-3 py-1.5 rounded shadow-xs cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept Feasibility</span>
                </button>
                <button
                  type="button"
                  onClick={() => onMarketingFinalApprove(false)}
                  disabled={isSubmitting}
                  className="bg-white dark:bg-zinc-800 text-rose-600 border border-rose-300 hover:bg-rose-50 text-xs font-semibold px-3 py-1.5 rounded cursor-pointer transition disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}

            {activeRequest.marketingDecision === "Accepted" && !activeRequest.convertedSrNumber && (
              <button
                type="button"
                onClick={onConvertToSampling}
                disabled={isConverting}
                className="bg-[#714B67] hover:bg-[#5B3C53] text-white text-xs font-bold px-3.5 py-1.5 rounded shadow-xs cursor-pointer transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Package className={`w-3.5 h-3.5 ${isConverting ? "animate-spin" : ""}`} />
                <span>{isConverting ? "Generating..." : "Request Sampling (Convert)"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Opportunity / Sample Title and Rating */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] uppercase font-bold tracking-wider text-neutral-400 dark:text-zinc-500 mb-1 font-mono">
              SAMPLE TITLE / OPPORTUNITY NAME
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-zinc-100 tracking-tight leading-snug">
              {primaryTitle || `${request.customer || "General"} · ${displayType}`}
            </h1>
          </div>

          <div
            className="flex items-center space-x-0.5 text-amber-400 text-lg shrink-0"
            title="Priority Level: High"
          >
            <span>★</span>
            <span>★</span>
            <span>★</span>
            <span className="text-neutral-300 dark:text-zinc-600">★</span>
          </div>
        </div>

        {/* 2-Column Master Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2.5 pt-3 pb-3 border-t border-b border-[#E2E8F0] dark:border-white/10 text-xs mt-4">
          {/* Left Column */}
          <div className="space-y-2">
            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">Customer</span>
              <span className="flex-1 font-semibold text-neutral-900 dark:text-zinc-100">
                {request.customer || "Unassigned Account"}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">Category / Type</span>
              <span className="flex-1 font-semibold text-[#714B67] dark:text-purple-300">
                {displayType}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">Program Name</span>
              <span className="flex-1 text-neutral-800 dark:text-zinc-200">
                {request.programName || request.programCampaignTitle || "Annual Sampling Plan"}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">Sales Team Owner</span>
              <span className="flex-1 text-neutral-800 dark:text-zinc-200">
                {request.createdBy || "Parin D (Sales Team)"}
              </span>
            </div>

            {feasibilityDetails.referenceLinks.length > 0 && (
              <div className="flex items-baseline">
                <span className="w-36 text-neutral-500 font-medium shrink-0">Reference Link</span>
                <span className="flex-1 font-mono flex items-center gap-1.5 truncate">
                  <ExternalLink className="w-3.5 h-3.5 text-[#017E84] shrink-0" />
                  <a
                    href={
                      feasibilityDetails.referenceLinks[0].startsWith("http")
                        ? feasibilityDetails.referenceLinks[0]
                        : `https://${feasibilityDetails.referenceLinks[0]}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#017E84] hover:underline font-semibold truncate"
                    title={feasibilityDetails.referenceLinks[0]}
                  >
                    <span className="truncate">
                      {feasibilityDetails.referenceLinks[0].replace(/^https?:\/\//, "")}
                    </span>
                  </a>
                  {feasibilityDetails.referenceLinks.length > 1 && (
                    <span className="text-[10px] text-neutral-400 font-normal shrink-0">
                      (+{feasibilityDetails.referenceLinks.length - 1} more)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-2">
            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">Assigned Plant</span>
              <span className="flex-1 text-neutral-800 dark:text-zinc-200">
                {request.targetPlant || "Plant 1 (Central Notebooks & Wiro)"}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">Requested Pieces</span>
              <span className="flex-1 font-mono text-neutral-800 dark:text-zinc-200">
                {request.qtyForSampling ? `${request.qtyForSampling} Finished Mockups` : "6 Finished Mockups"}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">Customer Due Date</span>
              <span className="flex-1 font-mono font-semibold text-[#017E84] dark:text-teal-400">
                {request.sampleRequiredDate || request.dateRequestCreated || "20-11-2026"}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">Business Year</span>
              <span className="flex-1 font-mono text-neutral-800 dark:text-zinc-200">
                {request.year ? `FY ${request.year}` : "FY 2026–2027 (Oct → Sep Model)"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
