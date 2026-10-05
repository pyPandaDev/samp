import React from "react";
import { Layers, Plus, Eye, Copy, Trash2, Calendar, Clock, PlusCircle } from "lucide-react";
import { StagedProductItem, DELIVERABLES } from "../../types/staging";

export interface StagingProductListProps {
  stagedProducts: StagedProductItem[];
  onOpenAddModal: () => void;
  onInspectProduct: (item: StagedProductItem) => void;
  onDuplicateProduct: (item: StagedProductItem) => void;
  onRemoveProduct: (id: string) => void;
}

export const StagingProductList: React.FC<StagingProductListProps> = ({
  stagedProducts,
  onOpenAddModal,
  onInspectProduct,
  onDuplicateProduct,
  onRemoveProduct,
}) => {
  if (stagedProducts.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded border-2 border-dashed border-[#CED4DA] dark:border-zinc-800 bg-white dark:bg-[#12141d] px-6 py-12 text-center shadow-2xs">
        <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded bg-[#F3E8EE] text-[#714B67] border border-[#714B67]/20 dark:bg-[#3E2938] dark:text-[#E8D7E3]">
          <Layers className="h-6 w-6 stroke-[1.8]" />
        </div>

        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          No Products Staged in Batch
        </h3>
        <p className="mt-1 max-w-md text-xs leading-relaxed text-[#64748B] dark:text-zinc-400">
          This sample request currently has no staged items. Add product specifications, configure artwork briefs or prototype samples, and assign commercial deliverables.
        </p>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="mt-4 inline-flex h-8 items-center gap-1.5 rounded bg-[#714B67] hover:bg-[#5B3C53] active:bg-[#4b3145] px-4 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add First Product</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#12141d] border border-[#CED4DA] dark:border-white/[0.08] rounded shadow-2xs overflow-hidden">
      {/* Table Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#F8F9FA] dark:bg-zinc-800/60 border-b border-[#CED4DA] dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-sans">
            Staged Products Queue
          </span>
          <span className="font-mono text-[10.5px] font-bold px-2 py-0.2 rounded bg-white dark:bg-zinc-900 border border-[#CED4DA] dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
            {stagedProducts.length} item{stagedProducts.length !== 1 ? "s" : ""}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#714B67] hover:text-[#5B3C53] dark:text-purple-300 hover:underline cursor-pointer"
        >
          <Plus className="w-3 h-3 stroke-[2.5]" />
          <span>Add Product</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F8F9FA] dark:bg-zinc-900/60 text-[10.5px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-[#CED4DA] dark:border-zinc-700">
              <th className="py-2.5 px-3 border-r border-[#CED4DA] dark:border-zinc-700 w-12 text-center">
                #
              </th>
              <th className="py-2.5 px-3.5 border-r border-[#CED4DA] dark:border-zinc-700 w-44">
                Material / Ref Code
              </th>
              <th className="py-2.5 px-4 border-r border-[#CED4DA] dark:border-zinc-700">
                Product Nomenclature &amp; Specifications
              </th>
              <th className="py-2.5 px-3.5 border-r border-[#CED4DA] dark:border-zinc-700 w-56">
                Deliverables Scope
              </th>
              <th className="py-2.5 px-3.5 border-r border-[#CED4DA] dark:border-zinc-700 w-36">
                Staged Date
              </th>
              <th className="py-2.5 px-3 text-right w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] dark:divide-white/[0.06]">
            {stagedProducts.map((prod, idx) => (
              <tr
                key={prod.id}
                className="hover:bg-[#F8F9FA] dark:hover:bg-zinc-800/50 transition-colors"
              >
                {/* 1. Line # */}
                <td className="py-3 px-3 border-r border-[#E2E8F0] dark:border-zinc-800 text-center font-mono text-[11px] font-semibold text-zinc-400">
                  {String(idx + 1).padStart(2, "0")}
                </td>

                {/* 2. Material Code */}
                <td className="py-3 px-3.5 border-r border-[#E2E8F0] dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => onInspectProduct(prod)}
                    className="font-mono text-xs font-bold text-[#714B67] hover:underline cursor-pointer flex items-center gap-1.5 dark:text-purple-300"
                    title="Click to inspect this staged specification"
                  >
                    <span>{prod.materialCode}</span>
                  </button>
                </td>

                {/* 3. Product Nomenclature & Specs */}
                <td className="py-3 px-4 border-r border-[#E2E8F0] dark:border-zinc-800">
                  <div
                    onClick={() => onInspectProduct(prod)}
                    className="cursor-pointer group"
                  >
                    <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-[#714B67] dark:group-hover:text-purple-300 transition-colors">
                      {prod.productDescription}
                    </p>

                    {prod.designMetadata ? (
                      <div className="mt-0.5 text-[11px] text-[#64748B] dark:text-zinc-400 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#714B67] dark:text-purple-300">
                          {prod.designMetadata.numberOfDesigns} Design Variant{prod.designMetadata.numberOfDesigns > 1 ? "s" : ""}
                        </span>
                        {prod.designMetadata.designRequiredDate && (
                          <span>• Due: {prod.designMetadata.designRequiredDate}</span>
                        )}
                        {(prod.designMetadata.images.length > 0 || prod.designMetadata.webLinks.length > 0) && (
                          <span>• {prod.designMetadata.images.length + prod.designMetadata.webLinks.length} reference file(s)</span>
                        )}
                      </div>
                    ) : prod.samplingMetadata ? (
                      <div className="mt-0.5 text-[11px] text-[#64748B] dark:text-zinc-400 flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase font-mono ${
                            prod.samplingMetadata.sampleType === "full"
                              ? "bg-[#F3E8EE] text-[#714B67] border border-[#714B67]/25"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {prod.samplingMetadata.sampleType === "full" ? "Full Sample" : "Partial Sample"}
                        </span>
                        {prod.samplingMetadata.bindingType1 && (
                          <span>• {prod.samplingMetadata.bindingType1} {prod.samplingMetadata.bindingType2 ? `(${prod.samplingMetadata.bindingType2})` : ""}</span>
                        )}
                        {prod.samplingMetadata.sourceSrNumber && (
                          <span className="font-mono text-[10.5px] text-zinc-400">Ref: {prod.samplingMetadata.sourceSrNumber}</span>
                        )}
                      </div>
                    ) : prod.catalogMetadata ? (
                      <div className="mt-0.5 text-[11px] text-[#64748B] dark:text-zinc-400 font-mono">
                        <span>Catalog Ref: {prod.catalogMetadata.sourceMaterialCode}</span>
                        {prod.catalogMetadata.sourceRequestNumber && (
                          <span> · {prod.catalogMetadata.sourceRequestNumber}</span>
                        )}
                      </div>
                    ) : (
                      <div className="mt-0.5 text-[10.5px] text-zinc-400 font-mono">
                        Standard Request Line Item
                      </div>
                    )}
                  </div>
                </td>

                {/* 4. Deliverables Scope Chips */}
                <td className="py-3 px-3.5 border-r border-[#E2E8F0] dark:border-zinc-800">
                  <div className="flex items-center gap-1 flex-wrap">
                    {prod.scopes.map((scope) => {
                      const def = DELIVERABLES.find((d) => d.id === scope);
                      const isDesign = scope === "design";
                      const isMockup = scope === "mockup";
                      const isSample = scope === "sample";
                      const isCosting = scope === "costing";

                      const badgeStyle = isDesign
                        ? "bg-[#F3E8EE] text-[#714B67] border-[#714B67]/25"
                        : isMockup
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : isSample
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : isCosting
                        ? "bg-teal-50 text-[#017E84] border-teal-200"
                        : "bg-zinc-100 text-zinc-800 border-zinc-200";

                      return (
                        <span
                          key={scope}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeStyle}`}
                        >
                          {def?.label.toUpperCase() || scope.toUpperCase()}
                        </span>
                      );
                    })}
                  </div>
                </td>

                {/* 5. Staged Date Column */}
                <td className="py-3 px-3.5 border-r border-[#E2E8F0] dark:border-zinc-800 font-mono text-[11px]">
                  <div className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span>{prod.stagedDate || "2026-10-01"}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5 shrink-0" />
                    <span>{prod.timestamp || "Just now"}</span>
                  </div>
                </td>

                {/* 6. Action Icons */}
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onInspectProduct(prod)}
                      className="h-7 w-7 rounded border border-[#CED4DA] bg-white text-zinc-600 hover:text-[#714B67] hover:border-[#714B67] hover:bg-[#F3E8EE] flex items-center justify-center transition-colors cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      title="Inspect Specification"
                      aria-label="Inspect Specification"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateProduct(prod)}
                      className="h-7 w-7 rounded border border-[#CED4DA] bg-white text-zinc-600 hover:text-[#714B67] hover:border-[#714B67] hover:bg-[#F3E8EE] flex items-center justify-center transition-colors cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      title="Duplicate Line Item"
                      aria-label="Duplicate Line Item"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveProduct(prod.id)}
                      className="h-7 w-7 rounded border border-[#CED4DA] bg-white text-rose-600 hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-rose-950/40"
                      title="Remove Item from Batch"
                      aria-label="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enterprise Style "+ Add a Line" Footer Bar */}
      <div className="p-2.5 bg-[#F8F9FA] dark:bg-zinc-900/60 border-t border-[#CED4DA] dark:border-zinc-700">
        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#714B67] hover:text-[#5B3C53] dark:text-purple-300 px-3 py-1.5 rounded hover:bg-[#F3E8EE] dark:hover:bg-[#3E2938]/60 transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Add a line</span>
        </button>
      </div>
    </div>
  );
};

export default StagingProductList;
