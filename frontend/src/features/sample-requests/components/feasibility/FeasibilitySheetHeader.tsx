import React from "react";
import { SampleRequestItem } from "../../types";
import { formatErpDate } from "../../utils/dateUtils";
import {
  Calendar,
  FileText,
  Package,
  UserCheck,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

export interface FeasibilitySheetHeaderProps {
  activeRequest: SampleRequestItem;
  classificationLabel: string;
  previewableImagesCount: number;
  referenceLinks: string[];
  canEvaluateTechnical: boolean;
  canMakeCommercialDecision: boolean;
  isClaiming: boolean;
  isSubmittingDecision: boolean;
  isConverting: boolean;
  onClaimTask: () => void;
  onOpenReviewTab: () => void;
  onMarketingFinalApprove: (approved: boolean) => void;
  onConvertToSampling: () => void;
}

export const FeasibilitySheetHeader: React.FC<FeasibilitySheetHeaderProps> = ({
  activeRequest,
  classificationLabel,
  previewableImagesCount,
  referenceLinks,
}) => {
  return (
    <div className="border-b border-[#E2E8F0] dark:border-white/10">
      {/* ── Enterprise Smart Stat Buttons Ribbon ── */}
      <div className="flex justify-between items-center border-b border-[#E2E8F0] dark:border-white/10 bg-[#FBFBFC] dark:bg-zinc-900/40 flex-wrap px-5 py-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-[#714B67] dark:text-purple-300">
            {activeRequest.srNumber || activeRequest.materialCode || `FS-${activeRequest.id}`}
          </span>
          <span className="text-neutral-300 dark:text-zinc-600">/</span>
          <span className="font-mono text-[11px] text-neutral-500 dark:text-zinc-400">
            Feasibility Check
          </span>
          <span className="text-neutral-300 dark:text-zinc-600">/</span>
          <span className="bg-purple-100 dark:bg-purple-950/60 text-[#714B67] dark:text-purple-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
            {classificationLabel}
          </span>
        </div>

        {/* Smart Stat KPIs */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Stat 1: SLA Target Date */}
          <div
            className="px-3 py-1.5 rounded border border-[#E2E8F0] dark:border-white/[0.08] bg-white dark:bg-zinc-800/80 flex items-center gap-2"
            title="Required Target SLA Date"
          >
            <Calendar className="w-4 h-4 text-[#017E84]" />
            <div className="leading-tight">
              <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-mono">
                {activeRequest.sampleRequiredDate
                  ? formatErpDate(activeRequest.sampleRequiredDate)
                  : "Flexible"}
              </div>
              <div className="text-[9.5px] text-neutral-400 font-mono">Target SLA</div>
            </div>
          </div>

          {/* Stat 2: Evidence Files & Links */}
          <div
            className="px-3 py-1.5 rounded border border-[#E2E8F0] dark:border-white/[0.08] bg-white dark:bg-zinc-800/80 flex items-center gap-2"
            title="Attached Images & Links"
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <div className="leading-tight">
              <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-mono">
                {previewableImagesCount + referenceLinks.length} Files
              </div>
              <div className="text-[9.5px] text-neutral-400 font-mono">Evidence</div>
            </div>
          </div>

          {/* Stat 3: Pipeline Stage */}
          <div
            className="px-3 py-1.5 rounded border border-[#E2E8F0] dark:border-white/[0.08] bg-white dark:bg-zinc-800/80 flex items-center gap-2"
            title="Commercial Status"
          >
            <Package
              className={`w-4 h-4 ${
                activeRequest.convertedSrNumber
                  ? "text-[#714B67] dark:text-purple-400"
                  : activeRequest.marketingDecision === "Accepted"
                  ? "text-emerald-600"
                  : "text-neutral-400"
              }`}
            />
            <div className="leading-tight">
              <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-mono truncate max-w-[120px]">
                {activeRequest.convertedSrNumber
                  ? activeRequest.convertedSrNumber
                  : activeRequest.marketingDecision || (activeRequest.samplingFeasibilityResponse ? "Evaluated" : "In Review")}
              </div>
              <div className="text-[9.5px] text-neutral-400 font-mono">Pipeline</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Document Title and Master Data Grid ── */}
      <div className="px-6 py-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-zinc-500 mb-1 font-mono">
              FEASIBILITY OPPORTUNITY / INTAKE REFERENCE
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-zinc-100 tracking-tight leading-snug">
              {activeRequest.customer || "General Customer"} · {classificationLabel}
            </h1>
          </div>

          {/* Verdict Status Badge */}
          <div className="flex items-center gap-2">
            {activeRequest.samplingFeasibilityResponse === "Yes" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Feasible (Yes)</span>
              </span>
            ) : activeRequest.samplingFeasibilityResponse === "Maybe" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Conditional (Maybe)</span>
              </span>
            ) : activeRequest.samplingFeasibilityResponse === "No" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Not Feasible (No)</span>
              </span>
            ) : activeRequest.takenBySamp ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold bg-sky-50 text-sky-800 border border-sky-300 dark:bg-sky-950/40 dark:text-sky-300">
                <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>Under Review ({activeRequest.takenBySamp})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Awaiting SAMP Claim</span>
              </span>
            )}

            {activeRequest.convertedSrNumber && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold bg-purple-100 text-[#714B67] border border-purple-300 dark:bg-purple-950/60 dark:text-purple-300">
                <Package className="w-3.5 h-3.5" />
                <span>Converted: {activeRequest.convertedSrNumber}</span>
              </span>
            )}
          </div>
        </div>

        {/* 2-Column Clean Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2.5 pt-3 mt-3 border-t border-[#E2E8F0] dark:border-white/10 text-xs">
          {/* Left Column */}
          <div className="space-y-1.5">
            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">Customer Account:</span>
              <span className="flex-1 font-semibold text-neutral-900 dark:text-zinc-100">
                {activeRequest.customer || "—"}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">Feasibility Type:</span>
              <span className="flex-1 font-semibold text-[#714B67] dark:text-purple-300">
                {classificationLabel}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">Requested By:</span>
              <span className="flex-1 text-neutral-800 dark:text-zinc-200">
                {activeRequest.createdBy || "Marketing Specialist"}
              </span>
            </div>

            {referenceLinks.length > 0 && (
              <div className="flex items-baseline">
                <span className="w-36 text-neutral-500 font-medium shrink-0">Reference Link:</span>
                <div className="flex-1 min-w-0">
                  <a
                    href={referenceLinks[0].startsWith("http") ? referenceLinks[0] : `https://${referenceLinks[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono text-[#017E84] hover:underline truncate max-w-full font-semibold"
                    title={referenceLinks[0]}
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{referenceLinks[0].replace(/^https?:\/\//, "")}</span>
                  </a>
                  {referenceLinks.length > 1 && (
                    <span className="ml-1.5 text-[10px] font-mono text-neutral-400">
                      (+{referenceLinks.length - 1} more)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-1.5">
            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">Required Target Date:</span>
              <span className="flex-1 font-mono font-semibold text-[#017E84] dark:text-teal-400">
                {activeRequest.sampleRequiredDate
                  ? formatErpDate(activeRequest.sampleRequiredDate)
                  : "Flexible"}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">Logged Date:</span>
              <span className="flex-1 font-mono text-neutral-700 dark:text-zinc-300">
                {formatErpDate(activeRequest.dateRequestCreated || activeRequest.createdAt)}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="w-36 text-neutral-500 font-medium shrink-0">SAMP Lab Owner:</span>
              <span className="flex-1 font-medium text-neutral-800 dark:text-zinc-200">
                {activeRequest.takenBySamp ? (
                  <span className="text-sky-700 dark:text-sky-300 font-semibold font-mono">
                    {activeRequest.takenBySamp}
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 italic">Unclaimed</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeasibilitySheetHeader;
