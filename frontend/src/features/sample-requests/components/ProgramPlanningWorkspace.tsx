import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Layers,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Pencil,
  X,
  Package,
  Send,
  Building2,
  Calendar,
  Sparkles,
  Info,
} from "lucide-react";
import { UserProfile } from "@/features/auth";
import { createProgramRequestApi, createSampleRequestApi } from "../api";
import { CreateProgramRequestPayload } from "../types";
import { useMasterData } from "../hooks/useMasterData";
import { CustomerCombobox } from "@/components/erp";

export interface ProgramMaterialRow {
  id: string;
  materialType: string;
  supplierInfo: string;
  grade: string;
  colorVariant: string;
  caliperWt: string;
  qty: string;
  unit: string;
  remark: string;
}

export interface ProgramPlanningWorkspaceProps {
  user?: UserProfile | null;
}

interface LocationState {
  customer?: string;
  targetPlant?: string;
  programPlanName?: string;
  programName?: string;
  programPlanYear?: string;
  programYear?: string;
}

const currentYearNum = new Date().getFullYear();
const SINGLE_YEARS = [String(currentYearNum), String(currentYearNum + 1), String(currentYearNum + 2)];

export const ProgramPlanningWorkspace: React.FC<ProgramPlanningWorkspaceProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) || {};
  const { customers, plants, isLoading: isMasterDataLoading, error: masterDataError } = useMasterData();

  const currentYearStr = new Date().getFullYear().toString();

  // Operational Campaign Parameters
  const [customer, setCustomer] = useState(state.customer || "");
  const [targetPlant, setTargetPlant] = useState(state.targetPlant || "");
  const [programPlanName, setProgramPlanName] = useState(
    state.programPlanName || state.programName || "Seasonal Scholastic Line"
  );
  const [programPlanYear, setProgramPlanYear] = useState(
    state.programPlanYear || state.programYear || currentYearStr
  );

  // Toggle inline editing of parameters
  const [isEditingSetup, setIsEditingSetup] = useState(false);

  // Material Specification Matrix
  const [materialRows, setMaterialRows] = useState<ProgramMaterialRow[]>([
    {
      id: "mat-1",
      materialType: "",
      supplierInfo: "",
      grade: "",
      colorVariant: "",
      caliperWt: "",
      qty: "",
      unit: "pcs",
      remark: "",
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (!customers.length || !plants.length) return;
    const customerNames = new Set(customers.map((item: { name: string }) => item.name));
    const plantNames = new Set(plants.map((item: { name: string }) => item.name));
    setCustomer((current) => (current && customerNames.has(current) ? current : customers[0].name));
    setTargetPlant((current) => (current && plantNames.has(current) ? current : plants[0].name));
  }, [customers, plants]);

  useEffect(() => {
    if (masterDataError) setError(masterDataError);
  }, [masterDataError]);

  // Row Manipulation
  const handleAddRow = () => {
    const nextId = `mat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setMaterialRows((prev) => [
      ...prev,
      {
        id: nextId,
        materialType: "",
        supplierInfo: "",
        grade: "",
        colorVariant: "",
        caliperWt: "",
        qty: "",
        unit: "pcs",
        remark: "",
      },
    ]);
    setTimeout(() => {
      const el = document.getElementById(`mat-type-${nextId}`);
      if (el) el.focus();
    }, 40);
  };

  const handleDuplicateRow = (row: ProgramMaterialRow) => {
    setMaterialRows((prev) => [
      ...prev,
      {
        ...row,
        id: `mat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setMaterialRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const updateRow = (id: string, field: keyof ProgramMaterialRow, value: string) => {
    setMaterialRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Live Summary Aggregations
  const summaryStats = useMemo(() => {
    const filledRows = materialRows.filter((r) => r.materialType.trim());
    const totalQty = filledRows.reduce((acc, r) => acc + (Number(r.qty) || 0), 0);
    return {
      totalConfigured: materialRows.length,
      totalFilled: filledRows.length,
      totalQty,
    };
  }, [materialRows]);

  // Submit to Backend & Send to Sampling Team
  const handleSubmitProgramRequest = async () => {
    if (!customer.trim()) {
      setError("Please specify a customer account.");
      return;
    }
    if (!targetPlant.trim()) {
      setError("Please specify a target manufacturing facility.");
      return;
    }
    if (!programPlanName.trim()) {
      setError("Please provide a program campaign title.");
      return;
    }

    const filledRows = materialRows.filter((r) => r.materialType.trim());
    if (filledRows.length === 0) {
      setError("Please enter at least one material specification row with a material type.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const apiPayload: CreateProgramRequestPayload = {
      customer_name: customer.trim(),
      target_plant: targetPlant.trim(),
      program_campaign_title: programPlanName.trim(),
      program_year: programPlanYear.trim(),
      created_by: user?.name || user?.userid || "Marketing Specialist",
      materials: filledRows.map((r) => ({
        material_type: r.materialType.trim() || null,
        supplier_name: r.supplierInfo.trim() || null,
        grade: r.grade.trim() || null,
        color_variant: r.colorVariant.trim() || null,
        caliper_wt: r.caliperWt.trim() || null,
        quantity: r.qty.trim() || null,
        unit: r.unit.trim() || "pcs",
        remark: r.remark.trim() || null,
      })),
    };

    try {
      const record = await createProgramRequestApi(apiPayload);
      setSuccessToast(
        `✓ Program Request ${record.srNumber} (${record.requestCode}) submitted to Sampling Team for technical review!`
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("samp:requests-changed"));
      }
      setTimeout(() => {
        navigate("/sample-requests/programs");
      }, 900);
    } catch (err: any) {
      console.error("Failed to create program request in database, applying fallback:", err);
      // Fallback: createSampleRequestApi
      const matrixSection =
        "\n\nMaterial Specification Matrix:\n" +
        filledRows
          .map(
            (r, i) =>
              `#${i + 1} | Type: ${r.materialType || "—"} | Supplier: ${r.supplierInfo || "—"} | Grade: ${r.grade || "—"} | Color: ${r.colorVariant || "—"} | Caliper: ${r.caliperWt || "—"} | Qty: ${r.qty || "0"} ${r.unit || "pcs"} | Remark: ${r.remark || "—"}`
          )
          .join("\n");
      const fallbackSrNum = `SR-26-${String(Math.floor(100 + Math.random() * 900))}`;
      try {
        await createSampleRequestApi({
          srNumber: fallbackSrNum,
          customer,
          targetPlant,
          productDescription: `[Seasonal Program: ${programPlanName.trim()}]\nProgram Year: ${programPlanYear}\nTarget Plant: ${targetPlant}${matrixSection}`,
          materialCode: `PG-PL-${Math.floor(1000 + Math.random() * 9000)}`,
          programName: programPlanName.trim(),
          programYear: programPlanYear,
          year: programPlanYear,
          requestTypes: ["sample", "costing", "design"] as any,
          status: "Pending SAMP Review",
          createdBy: user?.name || "Program Planner",
          dateRequestCreated: new Date().toISOString().split("T")[0],
          creationMode: "program_planning",
        } as any);
        setSuccessToast(`✓ Program Request ${fallbackSrNum} submitted to Sampling Team!`);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("samp:requests-changed"));
        }
        setTimeout(() => {
          navigate("/sample-requests/programs");
        }, 900);
      } catch (fallbackErr) {
        setError("Could not register program request. Please verify backend connection.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FA] dark:bg-[#0b0c10] text-zinc-900 dark:text-zinc-100 overflow-y-auto select-text">
      {/* ── 1. Page Header (Exact Match to Image 1 & 3 Breadcrumbs) ── */}
      <header className="border-b border-[#E2E8F0] dark:border-white/[0.08] bg-white dark:bg-[#12141d] px-6 py-3 sticky top-0 z-20 shadow-2xs">
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/sample-requests/programs")}
              className="p-1.5 -ml-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              title="Return to Program Planning Desk"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                <span
                  onClick={() => navigate("/sample-requests/programs")}
                  className="hover:text-[#017E84] cursor-pointer transition-colors"
                >
                  Marketing Work
                </span>
                <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
                <span className="text-zinc-900 dark:text-zinc-100 font-medium">Seasonal Program Planning</span>
              </div>
              <h1 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight truncate mt-0.5">
                Seasonal Program Planning Workspace
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="inline-flex items-center px-2.5 py-1 rounded bg-[#017E84]/10 text-[#017E84] dark:bg-[#017E84]/20 dark:text-[#2dd4bf] border border-[#017E84]/30 font-mono text-[10px] font-bold uppercase tracking-wider">
              Track 03 • Operational Planning
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Success Toast */}
        {successToast && (
          <div className="px-4 py-3 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-smooth-toast">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="px-4 py-3 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center justify-between animate-smooth-toast">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => setError(null)} className="p-1 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── 2. Master Parameters Ribbon Card (Exact Image 3 Aesthetic, Polished) ── */}
        <div className="rounded-xl border border-[#CED4DA] dark:border-white/[0.08] bg-white dark:bg-[#12141d] px-5 py-3.5 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/50 text-[#714B67] dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60">
                PLANNING FOR
              </span>

              <span className="font-bold text-neutral-900 dark:text-white text-sm">
                {customer || "Unspecified Customer"}
              </span>

              <span className="text-neutral-300 dark:text-zinc-700">•</span>

              <span className="font-semibold text-[#017E84] dark:text-[#2dd4bf]">
                &quot;{programPlanName}&quot;
              </span>

              <span className="text-neutral-300 dark:text-zinc-700">•</span>

              <span className="font-mono text-neutral-700 dark:text-zinc-300 font-medium">
                Season {programPlanYear}
              </span>

              <span className="text-neutral-300 dark:text-zinc-700">•</span>

              <span className="font-mono text-neutral-600 dark:text-zinc-400 font-medium">
                Plant: {targetPlant || "1505"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingSetup((prev) => !prev)}
              className="text-xs font-semibold text-neutral-500 hover:text-[#017E84] flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{isEditingSetup ? "Close Editor" : "Edit Parameters"}</span>
            </button>
          </div>

          {/* Collapsible Parameter Editor */}
          {isEditingSetup && (
            <div className="mt-3.5 pt-3.5 border-t border-neutral-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs animate-smooth-toast">
              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1 font-mono">
                  Customer
                </label>
                <CustomerCombobox
                  customers={customers}
                  value={customer}
                  onChange={setCustomer}
                  disabled={isMasterDataLoading || customers.length === 0}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1 font-mono">
                  Program Title
                </label>
                <input
                  type="text"
                  value={programPlanName}
                  onChange={(e) => setProgramPlanName(e.target.value)}
                  className="w-full h-8.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold outline-none focus:border-[#017E84]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1 font-mono">
                  Program Year (Single Year)
                </label>
                <select
                  value={programPlanYear}
                  onChange={(e) => setProgramPlanYear(e.target.value)}
                  className="w-full h-8.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono font-bold outline-none focus:border-[#017E84]"
                >
                  {SINGLE_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1 font-mono">
                  Target Facility
                </label>
                <select
                  value={targetPlant}
                  disabled={isMasterDataLoading || plants.length === 0}
                  onChange={(e) => setTargetPlant(e.target.value)}
                  className="w-full h-8.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold outline-none focus:border-[#017E84]"
                >
                  {plants.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ── 3. Hero Component: Material Specification Matrix Card ── */}
        <div className="rounded-xl border border-[#CED4DA] dark:border-white/[0.08] bg-white dark:bg-[#12141d] overflow-hidden shadow-2xs">
          {/* Matrix Header */}
          <div className="p-4 sm:p-5 border-b border-[#E2E8F0] dark:border-white/[0.08] bg-[#FBFBFC] dark:bg-[#161822] flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#017E84]/10 dark:bg-[#017E84]/20 text-[#017E84] dark:text-[#2dd4bf] flex items-center justify-center border border-[#017E84]/20 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-zinc-50 tracking-tight">
                  Material Specification Matrix
                </h2>
                <p className="text-[11px] text-neutral-500 dark:text-zinc-400">
                  Specify raw materials, grades, and quantities planned for this program
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddRow}
              className="h-8.5 px-4 rounded-lg bg-[#017E84] hover:bg-[#00666A] active:bg-[#005256] text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer self-start md:self-center active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Row</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-white/[0.08] text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 select-none">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-2 min-w-[140px]">MATERIAL TYPE *</th>
                  <th className="py-2.5 px-2 min-w-[130px]">SUPPLIER INFO</th>
                  <th className="py-2.5 px-2 min-w-[120px]">GRADE</th>
                  <th className="py-2.5 px-2 min-w-[120px]">COLOR VARIANT</th>
                  <th className="py-2.5 px-2 min-w-[110px]">CALIPER / WT</th>
                  <th className="py-2.5 px-2 w-24">QTY</th>
                  <th className="py-2.5 px-2 w-28">UNIT</th>
                  <th className="py-2.5 px-2 min-w-[180px]">REMARK</th>
                  <th className="py-2.5 px-3 w-16 text-right">ACTIONS</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.05]">
                {materialRows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30 transition-colors">
                    {/* # */}
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-400 text-[11px]">
                      {index + 1}
                    </td>

                    {/* Material Type */}
                    <td className="py-2 px-2">
                      <input
                        id={`mat-type-${row.id}`}
                        type="text"
                        required
                        placeholder="e.g. Kappa Board"
                        value={row.materialType}
                        onChange={(e) => updateRow(row.id, "materialType", e.target.value)}
                        className="w-full h-8 px-2.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-[#017E84] focus:ring-1 focus:ring-[#017E84]/20 transition font-semibold"
                      />
                    </td>

                    {/* Supplier Info */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        placeholder="e.g. BILT / ITC"
                        value={row.supplierInfo}
                        onChange={(e) => updateRow(row.id, "supplierInfo", e.target.value)}
                        className="w-full h-8 px-2.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-[#017E84] focus:ring-1 focus:ring-[#017E84]/20 transition"
                      />
                    </td>

                    {/* Grade */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        placeholder="e.g. Grade A"
                        value={row.grade}
                        onChange={(e) => updateRow(row.id, "grade", e.target.value)}
                        className="w-full h-8 px-2.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-[#017E84] focus:ring-1 focus:ring-[#017E84]/20 transition"
                      />
                    </td>

                    {/* Color Variant */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        placeholder="e.g. Natural White"
                        value={row.colorVariant}
                        onChange={(e) => updateRow(row.id, "colorVariant", e.target.value)}
                        className="w-full h-8 px-2.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-[#017E84] focus:ring-1 focus:ring-[#017E84]/20 transition"
                      />
                    </td>

                    {/* Caliper / WT */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        placeholder="e.g. 70 GSM"
                        value={row.caliperWt}
                        onChange={(e) => updateRow(row.id, "caliperWt", e.target.value)}
                        className="w-full h-8 px-2.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-[#017E84] focus:ring-1 focus:ring-[#017E84]/20 transition"
                      />
                    </td>

                    {/* Qty */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        placeholder="5000"
                        value={row.qty}
                        onChange={(e) => updateRow(row.id, "qty", e.target.value)}
                        className="w-full h-8 px-2.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-[#017E84] focus:ring-1 focus:ring-[#017E84]/20 transition font-bold"
                      />
                    </td>

                    {/* Unit */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        placeholder="e.g. pcs, sheets, kg"
                        value={row.unit}
                        onChange={(e) => updateRow(row.id, "unit", e.target.value)}
                        className="w-full h-8 px-2.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-[#017E84] focus:ring-1 focus:ring-[#017E84]/20 transition"
                      />
                    </td>

                    {/* Remark */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        placeholder="Notes... (Tab to add row)"
                        value={row.remark}
                        onChange={(e) => updateRow(row.id, "remark", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Tab" && !e.shiftKey && index === materialRows.length - 1) {
                            e.preventDefault();
                            handleAddRow();
                          }
                        }}
                        className="w-full h-8 px-2.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-[#017E84] focus:ring-1 focus:ring-[#017E84]/20 transition"
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateRow(row)}
                          className="h-7 w-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                          title="Duplicate row"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          disabled={materialRows.length <= 1}
                          className="h-7 w-7 rounded-md flex items-center justify-center text-rose-500/70 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                          title="Remove row"
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

          {/* Matrix Footer Counts */}
          <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-wrap items-center justify-between text-xs text-zinc-500 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#017E84]" />
              <span>
                {summaryStats.totalConfigured} row{summaryStats.totalConfigured !== 1 ? "s" : ""} configured • {summaryStats.totalFilled} completed
              </span>
            </div>

            <div>
              Total Raw Materials Planned: <strong className="text-zinc-900 dark:text-zinc-100">{summaryStats.totalQty.toLocaleString()} units</strong>
            </div>
          </div>
        </div>

        {/* ── 4. Bottom Action Card (APA Theme Solid Teal Button) ── */}
        <div className="rounded-xl border border-[#CED4DA] dark:border-white/[0.08] bg-white dark:bg-[#12141d] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-neutral-800 dark:text-zinc-200">
              Ready to initialize seasonal program for <strong className="text-neutral-900 dark:text-white">{customer}</strong> (&quot;{programPlanName}&quot;)
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-zinc-400 font-mono mt-0.5">
              Will be routed to Sampling Team for technical specification matrix evaluation
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubmitProgramRequest}
            disabled={isSubmitting}
            className="h-10 px-6 rounded-lg bg-[#017E84] hover:bg-[#00666A] active:bg-[#005256] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 tracking-tight shrink-0 active:scale-95"
          >
            {isSubmitting ? (
              <span className="animate-spin text-white font-mono">•</span>
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{isSubmitting ? "Submitting to Sampling..." : "Create Program Request"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgramPlanningWorkspace;
