import React from "react";
import { SampleRequestItem } from "../../types";
import { Copy, Check, Trash2, X, PanelRightClose } from "lucide-react";

export interface FeasibilityControlPanelProps {
  activeRequest: SampleRequestItem;
  copiedCode: boolean;
  showChatter?: boolean;
  onToggleChatter?: () => void;
  onClose: () => void;
  onCopyCode: () => void;
  onDeleteRequest?: (req: SampleRequestItem) => void;
}

export const FeasibilityControlPanel: React.FC<FeasibilityControlPanelProps> = ({
  activeRequest,
  copiedCode,
  showChatter = true,
  onToggleChatter,
  onClose,
  onCopyCode,
  onDeleteRequest,
}) => {
  return (
    <div className="bg-white dark:bg-[#1a1c24] border-b border-[#D8DADD] dark:border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
      {/* Left Action Buttons */}
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

        <div className="h-4 w-px bg-neutral-300 dark:bg-zinc-700 mx-1"></div>

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
            onClick={() => onDeleteRequest(activeRequest)}
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

        {/* Modal Close [X] */}
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
