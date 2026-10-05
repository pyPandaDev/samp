import React, { useRef } from "react";
import {
  X,
  ArrowLeft,
  Lock,
  UploadCloud,
  ImageIcon,
  Link2,
  ExternalLink,
  Plus,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { OperationalDatePicker } from "@/components/erp";
import { DeliverableScopeId } from "../../types/staging";

export interface AddProductDesignStepProps {
  programContext: {
    customer: string;
    programName: string;
    programYear: string;
  };
  selectedScopes: DeliverableScopeId[];
  designDesc: string;
  designCount: number | "";
  designDueDate: string;
  designTrend: string;
  designAudience: string;
  designRemarks: string;
  uploadedImages: Array<{ id: string; url: string; name: string; size?: string }>;
  webLinks: string[];
  linkInput: string;
  mediaTab: "files" | "links";
  modalError: string | null;
  onSetDesignDesc: (val: string) => void;
  onSetDesignCount: (val: number | "") => void;
  onSetDesignDueDate: (val: string) => void;
  onSetDesignTrend: (val: string) => void;
  onSetDesignAudience: (val: string) => void;
  onSetDesignRemarks: (val: string) => void;
  onSetLinkInput: (val: string) => void;
  onSetMediaTab: (tab: "files" | "links") => void;
  onSetModalError: (err: string | null) => void;
  onMultipleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
  onAddWebLink: (e: React.MouseEvent | React.KeyboardEvent) => void;
  onRemoveWebLink: (index: number) => void;
  onBackToScopes: () => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddProductDesignStep: React.FC<AddProductDesignStepProps> = ({
  programContext,
  selectedScopes,
  designDesc,
  designCount,
  designDueDate,
  designTrend,
  designAudience,
  designRemarks,
  uploadedImages,
  webLinks,
  linkInput,
  mediaTab,
  modalError,
  onSetDesignDesc,
  onSetDesignCount,
  onSetDesignDueDate,
  onSetDesignTrend,
  onSetDesignAudience,
  onSetDesignRemarks,
  onSetLinkInput,
  onSetMediaTab,
  onSetModalError,
  onMultipleImageUpload,
  onRemoveImage,
  onAddWebLink,
  onRemoveWebLink,
  onBackToScopes,
  onClose,
  onSubmit,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalAttachments = uploadedImages.length + webLinks.length;

  return (
    <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xl animate-smooth-modal dark:border-white/[0.08] dark:bg-[#12141d]">
      {/* Enterprise ERP Modal Header */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-[#714B67] text-white shrink-0 border-b border-[#5B3C53]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-white/15 flex items-center justify-center text-white shrink-0">
            <ImageIcon className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Creative Design Brief
              </h3>
              <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-white/20 text-white tracking-wider uppercase">
                DESIGN SPEC
              </span>
            </div>
            <p className="text-[11px] text-white/80 mt-0.5">
              Add product specifications, creative direction, target due date, and reference artwork
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form Error Message */}
      {modalError && (
        <div className="mx-5 mt-4 flex items-center justify-between rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 sm:mx-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{modalError}</span>
          </div>
          <button
            type="button"
            onClick={() => onSetModalError(null)}
            className="p-1 hover:opacity-75 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Form Body - Balanced 2-Column Grid */}
      <form onSubmit={onSubmit} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-6">
          {/* LEFT COLUMN: Customer Account, Product Description, Trend & Audience, Remarks */}
          <div className="space-y-4 lg:col-span-7">
            {/* 1. Customer Account */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Customer Account &amp; Program
              </label>
              <div className="flex min-h-10 w-full items-center justify-between gap-3 rounded-md border border-zinc-200 bg-[#F8F7F8] px-3 py-2 text-[13px] font-medium text-zinc-900 dark:border-zinc-700 dark:bg-[#171923] dark:text-zinc-100">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                    {programContext.customer || "General Account"}
                  </span>
                  <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {programContext.programName} · {programContext.programYear}
                  </span>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded border border-zinc-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:bg-[#12141d] dark:text-zinc-400">
                  <Lock className="h-3 w-3" /> Locked
                </span>
              </div>
            </div>

            {/* 2. Product Description (MANDATORY) */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Product Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Provide detailed product description, cover specifications, ruling/page requirements, finish accents (foil, deboss, spot UV), and creative direction..."
                value={designDesc}
                onChange={(e) => onSetDesignDesc(e.target.value)}
                className="w-full resize-none rounded-md border border-zinc-200 bg-white p-3 text-[13px] leading-relaxed text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-[#714B67]/60 focus:ring-2 focus:ring-[#714B67]/15 dark:border-zinc-700 dark:bg-[#171923] dark:text-zinc-100"
              />
            </div>

            {/* 3. Trend / Theme & Target Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 truncate">
                    Trend / Theme
                  </label>
                  <span className="text-[9.5px] text-zinc-400 font-mono">Optional</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Botanical Floral, Geometric Minimalist"
                  value={designTrend}
                  onChange={(e) => onSetDesignTrend(e.target.value)}
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#714B67]/60 focus:ring-2 focus:ring-[#714B67]/15 dark:border-zinc-700 dark:bg-[#171923] dark:text-zinc-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 truncate">
                    Target Audience
                  </label>
                  <span className="text-[9.5px] text-zinc-400 font-mono">Optional</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. College Students, Kids (6-12)"
                  value={designAudience}
                  onChange={(e) => onSetDesignAudience(e.target.value)}
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#714B67]/60 focus:ring-2 focus:ring-[#714B67]/15 dark:border-zinc-700 dark:bg-[#171923] dark:text-zinc-100"
                />
              </div>
            </div>

            {/* 4. Remarks / Special Notes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Remarks / Special Notes
                </label>
                <span className="text-[9.5px] text-zinc-400 font-mono">Optional</span>
              </div>
              <textarea
                rows={2}
                placeholder="Specific instructions, special packaging requirements, or design notes..."
                value={designRemarks}
                onChange={(e) => onSetDesignRemarks(e.target.value)}
                className="w-full resize-none rounded-md border border-zinc-200 bg-white p-3 text-[13px] leading-relaxed text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-[#714B67]/60 focus:ring-2 focus:ring-[#714B67]/15 dark:border-zinc-700 dark:bg-[#171923] dark:text-zinc-100"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Number of Designs, Design Required Date, Reference Attachments */}
            <div className="space-y-4 rounded-md border border-zinc-200 bg-[#F8F7F8] p-4 dark:border-white/[0.08] dark:bg-white/[0.025] lg:col-span-5">
            {/* Number of Designs */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Number of Designs <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={100}
                  placeholder="e.g. 3"
                  required
                  value={designCount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      onSetDesignCount("");
                    } else {
                      const parsed = parseInt(val, 10);
                      onSetDesignCount(isNaN(parsed) ? "" : Math.max(1, parsed));
                    }
                  }}
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono text-sm font-semibold text-zinc-900 outline-none placeholder:font-sans placeholder:font-normal placeholder:text-zinc-400 focus:border-[#714B67]/60 focus:ring-2 focus:ring-[#714B67]/15 dark:border-zinc-700 dark:bg-[#171923] dark:text-zinc-100"
                />
                {designCount !== "" && (
                  <span className="absolute right-2.5 top-1.5 text-[10px] font-mono text-zinc-400 pointer-events-none">
                    variant{Number(designCount) > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Design Required Date */}
            <div>
              <OperationalDatePicker
                label="Design Required Date"
                required
                value={designDueDate}
                onChange={(val) => {
                  onSetDesignDueDate(val);
                  if (modalError) onSetModalError(null);
                }}
                minDate={new Date().toISOString().split("T")[0]}
                placeholder="Select required date..."
              />
            </div>

            {/* Reference Attachments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Reference Image / Moodboard
                </label>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded font-mono transition-colors ${
                    uploadedImages.length >= 2 && webLinks.length >= 1
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40"
                      : totalAttachments > 0
                      ? "border border-[#714B67]/15 bg-[#F3E8EE] text-[#714B67] dark:border-purple-300/15 dark:bg-[#3E2938]/50 dark:text-purple-200"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {uploadedImages.length}/2 images · {webLinks.length}/1 link
                </span>
              </div>

              {/* Segmented Mode Control */}
              <div className="space-y-2">
                <div className="inline-flex w-full rounded-md border border-zinc-200 bg-zinc-100/80 p-1 text-[11px] dark:border-zinc-700 dark:bg-[#171923]">
                  <button
                    type="button"
                    onClick={() => onSetMediaTab("files")}
                    className={`flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded px-2 text-xs transition-colors duration-100 ${
                      mediaTab === "files"
                        ? "bg-white font-semibold text-[#714B67] shadow-sm dark:bg-[#3E2938] dark:text-purple-200"
                        : "font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>Upload Image</span>
                    {uploadedImages.length > 0 && (
                      <span className="ml-1 rounded bg-[#F3E8EE] px-1 text-[10px] font-mono text-[#714B67] dark:bg-[#50384A] dark:text-purple-200">
                        {uploadedImages.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetMediaTab("links")}
                    className={`flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded px-2 text-xs transition-colors duration-100 ${
                      mediaTab === "links"
                        ? "bg-white font-semibold text-[#714B67] shadow-sm dark:bg-[#3E2938] dark:text-purple-200"
                        : "font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Link2 className="w-3 h-3" />
                    <span>Paste Web Link</span>
                    {webLinks.length > 0 && (
                      <span className="ml-1 rounded bg-[#F3E8EE] px-1 text-[10px] font-mono text-[#714B67] dark:bg-[#50384A] dark:text-purple-200">
                        {webLinks.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* File Upload Trigger */}
                {mediaTab === "files" && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={onMultipleImageUpload}
                      className="hidden"
                    />
                    {uploadedImages.length < 2 ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="group flex min-h-10 w-full items-center justify-between gap-3 rounded-md border border-dashed border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-[#714B67]/50 hover:bg-[#FBF9FA] hover:text-[#714B67] dark:border-zinc-700 dark:bg-[#12141d] dark:text-zinc-400 dark:hover:border-purple-300/40 dark:hover:bg-[#3E2938]/25 dark:hover:text-purple-200"
                      >
                        <div className="flex items-center gap-2">
                          <UploadCloud className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-[#714B67] dark:group-hover:text-purple-200" />
                          <span>Choose photos (PNG, JPG, WEBP)</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                          {2 - uploadedImages.length} slot{2 - uploadedImages.length === 1 ? "" : "s"} left
                        </span>
                      </button>
                    ) : (
                      <div className="flex min-h-10 w-full items-center justify-center rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-400">
                        Maximum 2 images reached
                      </div>
                    )}
                  </div>
                )}

                {/* Web Link Input */}
                {mediaTab === "links" && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="url"
                      placeholder={
                        webLinks.length >= 1
                          ? "Maximum 1 reference link reached"
                          : "Paste URL (e.g. drive.google.com, pinterest, etc.)"
                      }
                      disabled={webLinks.length >= 1}
                      value={linkInput}
                      onChange={(e) => onSetLinkInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          onAddWebLink(e);
                        }
                      }}
                      className="h-10 min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#714B67]/60 focus:ring-2 focus:ring-[#714B67]/15 disabled:opacity-50 dark:border-zinc-700 dark:bg-[#171923] dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={onAddWebLink}
                      disabled={webLinks.length >= 1 || !linkInput.trim()}
                      className="inline-flex h-10 shrink-0 items-center gap-1 rounded-md bg-[#714B67] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#5B3C53] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                )}

                {/* Attached Items List */}
                {totalAttachments > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                    {/* Images */}
                    {uploadedImages.map((img) => (
                      <div
                        key={img.id}
                        className="flex items-center justify-between gap-2 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 text-[11px] shadow-2xs group"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-6 h-6 rounded object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                          />
                          <span className="shrink-0 rounded border border-[#714B67]/15 bg-[#F3E8EE] px-1 py-0.5 text-[10px] font-bold text-[#714B67] dark:border-purple-300/15 dark:bg-[#3E2938]/50 dark:text-purple-200">
                            IMG
                          </span>
                          <span className="truncate font-medium text-zinc-800 dark:text-zinc-200" title={img.name}>
                            {img.name}
                          </span>
                          {img.size && (
                            <span className="text-[9.5px] text-zinc-400 font-mono shrink-0">
                              ({img.size})
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveImage(img.id)}
                          title="Remove image"
                          className="shrink-0 rounded p-1 text-rose-600/70 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400/70 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                          aria-label={`Remove ${img.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Web Links */}
                    {webLinks.map((url, idx) => (
                      <div
                        key={`link-${idx}`}
                        className="flex items-center justify-between gap-2 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 text-[11px] shadow-2xs group"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="shrink-0 rounded border border-[#017E84]/15 bg-[#E7F4F4] px-1 py-0.5 text-[10px] font-bold text-[#017E84] dark:border-teal-300/15 dark:bg-[#173638] dark:text-teal-200">
                            URL
                          </span>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-w-0 items-center gap-1 truncate font-mono text-[11px] text-[#714B67] hover:underline dark:text-purple-200"
                            title={url}
                          >
                            <span className="truncate">{url}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveWebLink(idx)}
                          title="Remove link"
                          className="shrink-0 rounded p-1 text-rose-600/70 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400/70 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                          aria-label="Remove reference link"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-2.5 py-1.5 rounded-md border border-dashed border-zinc-200 dark:border-zinc-800/80 text-center">
                    <span className="text-[10px] text-zinc-400 font-mono">
                      No attachments yet (optional · up to 2 images and 1 link)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#CED4DA] dark:border-zinc-700 bg-[#F8F9FA] px-6 py-3 dark:border-white/[0.08] dark:bg-[#161822]">
          <button
            type="button"
            onClick={onBackToScopes}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-[#CED4DA] bg-white px-3.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-[#F8F9FA] cursor-pointer dark:border-zinc-700 dark:bg-[#12141d] dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Deliverables</span>
          </button>

          <button
            type="submit"
            className="inline-flex h-8 items-center gap-1.5 rounded bg-[#017E84] hover:bg-[#00666A] active:bg-[#005256] px-4 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            {selectedScopes.includes("mockup") ? (
              <>
                <span>Next: Choose Product</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Stage Product</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
