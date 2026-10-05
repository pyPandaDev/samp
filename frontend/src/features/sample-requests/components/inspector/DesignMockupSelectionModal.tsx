import React, { useState } from "react";
import { X, Check, Box, Sparkles, RefreshCw, CheckSquare, Square } from "lucide-react";
import { SubmittedDesignItem } from "../../types";
import { requestDesignMockupApi } from "@/infrastructure/api/sampleRequestsApi";

export interface DesignMockupSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string | number;
  submittedDesigns: SubmittedDesignItem[];
  currentlySelectedDesigns?: string[];
  productDescription?: string;
  onMockupRequested?: (selectedCodes: string[]) => void;
}

export const DesignMockupSelectionModal: React.FC<DesignMockupSelectionModalProps> = ({
  isOpen,
  onClose,
  requestId,
  submittedDesigns,
  currentlySelectedDesigns = [],
  productDescription,
  onMockupRequested,
}) => {
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(() => {
    return new Set(currentlySelectedDesigns);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSelect = (code: string) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedCodes(new Set(submittedDesigns.map((d) => d.code)));
  };

  const handleClearAll = () => {
    setSelectedCodes(new Set());
  };

  const handleSubmit = async () => {
    if (selectedCodes.size === 0) {
      setErrorMessage("Please select at least one design variant to request a CAD Mockup.");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const codesArray = Array.from(selectedCodes);
      await requestDesignMockupApi(requestId, {
        selected_designs: codesArray,
      });
      if (onMockupRequested) {
        onMockupRequested(codesArray);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to trigger CAD mockup request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-3 sm:p-5 select-none animate-smooth-backdrop"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl bg-white dark:bg-[#0f1118] border border-[#CED4DA] dark:border-white/10 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-smooth-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="px-5 py-3.5 border-b border-[#CED4DA] dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-[#12141d] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#714B67]/10 dark:bg-purple-950/60 flex items-center justify-center text-[#714B67] dark:text-purple-300">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>Select Designs for Physical CAD Mockup</span>
              </h3>
              <p className="text-[11px] text-zinc-500">
                Choose which specific graphic variants need dieline samples from Studio CAD.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {productDescription && (
            <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">Product: </span>
              {productDescription}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-200 text-xs">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-[11px] text-zinc-500">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono text-xs">
                {selectedCodes.size}
              </span>{" "}
              of {submittedDesigns.length} designs selected
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-semibold text-[#714B67] hover:underline cursor-pointer flex items-center gap-1"
              >
                <CheckSquare className="w-3 h-3" />
                Select All
              </button>
              <span className="text-zinc-300">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-semibold text-zinc-500 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Square className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>

          {/* Design Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {submittedDesigns.map((design) => {
              const isSelected = selectedCodes.has(design.code);
              return (
                <div
                  key={design.code}
                  onClick={() => toggleSelect(design.code)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors duration-100 flex items-start gap-3 ${
                    isSelected
                      ? "border-[#714B67] bg-[#714B67]/5 dark:bg-purple-950/20 shadow-xs ring-1 ring-[#714B67]/30"
                      : "border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(design.code)}
                      className="rounded accent-[#714B67] w-4 h-4 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-bold text-xs text-[#714B67] dark:text-purple-300 px-1.5 py-0.2 rounded bg-[#714B67]/10 border border-[#714B67]/20">
                        {design.code}
                      </span>
                      {design.shutterstockNo && (
                        <span className="font-mono text-[10px] text-zinc-500 truncate">
                          SS: {design.shutterstockNo}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {design.remark || "Standard packaging design artwork"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#CED4DA] dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-[#12141d] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-8.5 px-3.5 rounded border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedCodes.size === 0}
            className="h-8.5 px-4 rounded bg-[#714B67] hover:bg-[#5c3c54] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sending to Studio CAD...</span>
              </>
            ) : (
              <>
                <Box className="w-3.5 h-3.5" />
                <span>Request Mockups ({selectedCodes.size} Selected)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
