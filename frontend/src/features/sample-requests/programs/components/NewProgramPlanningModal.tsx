import React, { useState, useEffect, useMemo } from "react";
import { X, ArrowRight, FolderGit2, Calendar, Check } from "lucide-react";
import { useMasterData } from "../../hooks/useMasterData";
import { CustomerCombobox } from "@/components/erp";

export interface NewProgramPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (params: {
    customer: string;
    targetPlant: string;
    programName: string;
    programYear: string;
  }) => void;
}

export const getProgramYearOptions = (): string[] => {
  const currentYear = new Date().getFullYear();
  return [String(currentYear), String(currentYear + 1), String(currentYear + 2)];
};

export const NewProgramPlanningModal: React.FC<NewProgramPlanningModalProps> = ({
  isOpen,
  onClose,
  onProceed,
}) => {
  const { customers, plants, isLoading: isMasterDataLoading } = useMasterData();
  const yearOptions = useMemo(() => getProgramYearOptions(), []);

  const [customer, setCustomer] = useState("");
  const [targetPlant, setTargetPlant] = useState("");
  const [programName, setProgramName] = useState("");
  const [programYear, setProgramYear] = useState(() => getProgramYearOptions()[0]);
  const [error, setError] = useState<string | null>(null);

  // Initialize defaults
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setProgramName("");
      setProgramYear(getProgramYearOptions()[0]);
      if (customers.length > 0) setCustomer(customers[0].name);
      if (plants.length > 0) setTargetPlant(plants[0].name);
      else setTargetPlant("Plant 1");
    }
  }, [isOpen, customers, plants]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim()) {
      setError("Please select a customer account.");
      return;
    }
    if (!programName.trim()) {
      setError("Please provide a program campaign title.");
      return;
    }
    if (!programYear.trim()) {
      setError("Please specify the program year.");
      return;
    }

    setError(null);
    onProceed({
      customer: customer.trim(),
      targetPlant: targetPlant.trim() || "Plant 1",
      programName: programName.trim(),
      programYear: programYear.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 animate-smooth-backdrop"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white dark:bg-[#12141d] border border-zinc-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-smooth-modal flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-[#161822] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#017E84]/10 text-[#017E84] dark:bg-[#017E84]/20 dark:text-[#2dd4bf] flex items-center justify-center border border-[#017E84]/20 shadow-2xs shrink-0">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
                  New Seasonal Program Planning
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                  Define campaign master parameters and launch material matrix
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-medium text-xs">
                {error}
              </div>
            )}

            {/* 1. Customer Name */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-mono">
                Customer Account <span className="text-rose-500">*</span>
              </label>
              <CustomerCombobox
                customers={customers}
                value={customer}
                onChange={setCustomer}
                disabled={isMasterDataLoading || customers.length === 0}
                className="w-full"
              />
            </div>

            {/* 2. Program Campaign Title */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-mono">
                Program Campaign Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder="e.g. Back to school, Hardcover Notebooks Line, Corporate Diaries"
                className="w-full h-10 px-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/80 text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-[#017E84] focus:ring-2 focus:ring-[#017E84]/15 transition-colors duration-100 shadow-2xs"
              />
            </div>

            {/* 3. Program Year (Only current year + next 2 years) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-mono flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Program Year</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wider">
                  Active cycle + 2 year horizon
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {yearOptions.map((yr) => {
                  const isSelected = programYear === yr;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setProgramYear(yr)}
                      className={`h-11 px-3 rounded-xl border text-sm font-bold font-mono transition-colors duration-100 flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                        isSelected
                          ? "border-[#017E84] bg-[#017E84]/10 dark:bg-[#017E84]/20 text-[#017E84] dark:text-[#2dd4bf] shadow-xs ring-2 ring-[#017E84]/20"
                          : "border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 hover:bg-white dark:hover:bg-zinc-800"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      <span>{yr}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={onClose}
                className="h-9.5 px-4 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="h-9.5 px-5 rounded-lg bg-[#017E84] hover:bg-[#00666A] active:bg-[#005256] text-white text-xs font-bold transition-colors duration-100 shadow-xs hover:shadow-sm flex items-center gap-2 cursor-pointer tracking-tight active:scale-95"
              >
                <span>Proceed to Material Matrix</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
