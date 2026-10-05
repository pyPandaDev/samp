import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ArrowRight,
  Palette,
  Box,
  Sparkles,
  Calculator,
  Check,
  CheckCircle2,
  Calendar,
  Package,
  ClipboardCheck,
  Image as ImageIcon,
  Link2,
  ExternalLink,
  Plus,
  Trash2,
  UploadCloud,
  FolderGit2,
} from "lucide-react";
import { CustomerCombobox, OperationalDatePicker } from "@/components/erp";
import { isDateRestricted } from "@/lib/holidayUtils";
import { getBusinessYearInfo } from "@/lib/businessYear";
import { SampleRequestItem } from "../types";
import { useMasterData } from "../hooks/useMasterData";
import { fetchProgramRequestsApi } from "@/infrastructure/api/programsApi";

export interface NewSampleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newRequest: Partial<SampleRequestItem>) => Promise<boolean | SampleRequestItem>;
  initialTrack?: TrackType;
  lockTrack?: boolean;
  requestCreatedBy?: string;
}

type TrackType = "marketing_request" | "feasibility_check" | "program_planning";

export interface MarketingDeliverableType {
  id: "design" | "mockup" | "sample" | "costing";
  code: string;
  label: string;
  department: string;
  tag: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: {
    borderActive: string;
    bgActive: string;
    badge: string;
    text: string;
    ring: string;
  };
}

export const MARKETING_REQUEST_TYPES: MarketingDeliverableType[] = [
  {
    id: "design",
    code: "01",
    label: "Design",
    department: "Creative Studio",
    tag: "Artwork & Styling",
    desc: "Cover artwork, graphic themes, illustrations, typography & creative brief",
    icon: Palette,
    tone: {
      borderActive: "border-brand-600 dark:border-brand-500",
      bgActive: "bg-brand-50/50 dark:bg-brand-950/25",
      badge: "bg-brand-50 text-brand-800 border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800/80",
      text: "text-brand-600 dark:text-brand-400",
      ring: "ring-brand-500/20",
    },
  },
  {
    id: "mockup",
    code: "02",
    label: "Mockup",
    department: "Studio CAD",
    tag: "CAD Dummy & Die-line",
    desc: "CAD structural white dummy, die-line verification, folding format & digital 3D proof",
    icon: Box,
    tone: {
      borderActive: "border-brand-600 dark:border-brand-500",
      bgActive: "bg-brand-50/50 dark:bg-brand-950/25",
      badge: "bg-brand-50 text-brand-800 border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800/80",
      text: "text-brand-600 dark:text-brand-400",
      ring: "ring-brand-500/20",
    },
  },
  {
    id: "sample",
    code: "03",
    label: "Sampling",
    department: "SAMP Tech Lab",
    tag: "Physical Finished Prototype",
    desc: "Finished physical prototype with actual binding, ruling, paper stock & cover finishes",
    icon: Sparkles,
    tone: {
      borderActive: "border-brand-600 dark:border-brand-500",
      bgActive: "bg-brand-50/50 dark:bg-brand-950/25",
      badge: "bg-brand-50 text-brand-800 border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800/80",
      text: "text-brand-600 dark:text-brand-400",
      ring: "ring-brand-500/20",
    },
  },
  {
    id: "costing",
    code: "04",
    label: "Costing",
    department: "Commercial PMT",
    tag: "BOM & Volume Pricing",
    desc: "Comprehensive Bill of Materials costing, machine run-rates & volume tiered pricing",
    icon: Calculator,
    tone: {
      borderActive: "border-brand-600 dark:border-brand-500",
      bgActive: "bg-brand-50/50 dark:bg-brand-950/25",
      badge: "bg-brand-50 text-brand-800 border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800/80",
      text: "text-brand-600 dark:text-brand-400",
      ring: "ring-brand-500/20",
    },
  },
];

const FEASIBILITY_TYPES = [
  {
    id: "new_category",
    label: "New Category",
    desc: "Introduce new product lines or unlisted classifications",
  },
  {
    id: "new_format",
    label: "New Format",
    desc: "Custom sizes, unique binding structures, or novel layouts",
  },
  {
    id: "new_finish",
    label: "New Finish",
    desc: "Special cover treatments, foil, embossing, or lamination effects",
  },
  {
    id: "new_accessories",
    label: "New Accessories",
    desc: "Custom ribbons, elastic bands, pockets, stickers, or clasps",
  },
  {
    id: "other",
    label: "Other Custom",
    desc: "Specific bespoke requirement or custom manufacturing check",
  },
];

export const NewSampleRequestModal: React.FC<NewSampleRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialTrack,
  lockTrack = false,
  requestCreatedBy,
}) => {
  const navigate = useNavigate();

  const resolveTrack = (track?: TrackType): "marketing_request" | "feasibility_check" | "program_planning" => {
    if (track === "marketing_request" || track === "feasibility_check" || track === "program_planning") {
      return track;
    }
    return "feasibility_check";
  };

  const [selectedTrack, setSelectedTrack] = useState<"marketing_request" | "feasibility_check" | "program_planning">(() => resolveTrack(initialTrack));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    customers,
    plants,
    isLoading: isMasterDataLoading,
    error: masterDataError,
  } = useMasterData(isOpen);

  // Common fields
  const [customer, setCustomer] = useState("");
  const [targetPlant, setTargetPlant] = useState("");

  // Dynamic Business Year Information (Oct–Sep cycle)
  const byInfo = useMemo(() => getBusinessYearInfo(), [isOpen]);

  // Track 1: Marketing Request Intake fields
  const [marketingCustomer, setMarketingCustomer] = useState("");
  const [marketingProgramName, setMarketingProgramName] = useState("");
  const [marketingProgramYear, setMarketingProgramYear] = useState(() => getBusinessYearInfo().seasonYearOptions[0]);
  const [marketingTargetPlant, setMarketingTargetPlant] = useState("");

  // Track 2: Feasibility Check fields
  const [selectedFeasibilityType, setSelectedFeasibilityType] = useState<string>("new_category");
  const [customTypeOther, setCustomTypeOther] = useState("");
  const [feasibilityDescription, setFeasibilityDescription] = useState("");
  const [releaseRemarks, setReleaseRemarks] = useState("");
  const [feasibilityTargetDate, setFeasibilityTargetDate] = useState("");

  // Multi-Image & Multi-Link State (combined max 5 items total)
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; url: string; name: string; size?: string }>>([]);
  const [webLinks, setWebLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState<string>("");
  const [mediaTab, setMediaTab] = useState<"files" | "links">("files");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalAttachments = uploadedImages.length + webLinks.length;

  // Track 3: Program Planning fields (Setup step 1 parameters)
  const [programPlanName, setProgramPlanName] = useState("");
  const [programPlanYear, setProgramPlanYear] = useState(() => getBusinessYearInfo().businessYearStr);

  // Open Seasonal Programs for selected Customer (Walmart, etc.)
  const [availablePrograms, setAvailablePrograms] = useState<SampleRequestItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchProgramRequestsApi()
        .then((items) => setAvailablePrograms(items || []))
        .catch((err) => console.error("Could not fetch seasonal programs for picker:", err));
    }
  }, [isOpen]);

  const matchingPrograms = useMemo(() => {
    if (!marketingCustomer.trim()) return [];
    const custClean = marketingCustomer.trim().toLowerCase();
    return availablePrograms.filter((p) => {
      const pCust = (p.customer || "").trim().toLowerCase();
      return pCust === custClean || pCust.includes(custClean) || custClean.includes(pCust);
    });
  }, [marketingCustomer, availablePrograms]);

  // Reset all fields whenever modal opens so every new request starts completely fresh and empty
  useEffect(() => {
    if (isOpen) {
      setSelectedTrack(resolveTrack(initialTrack));
      setError(null);
      setMarketingCustomer("");
      setMarketingProgramName("");
      setMarketingProgramYear(byInfo.seasonYearOptions[0]);
      setMarketingTargetPlant(plants[0]?.name || "Navneet - Khaniwade");
      setCustomer("");
      setTargetPlant("");
      setProgramPlanName("");
      setProgramPlanYear(byInfo.businessYearStr);
      setFeasibilityDescription("");
      setFeasibilityTargetDate("");
      setReleaseRemarks("");
      setUploadedImages([]);
      setWebLinks([]);
      setLinkInput("");
    }
  }, [isOpen, initialTrack, byInfo, plants]);

  // Default plant selection once plants master data loads (if not already set)
  useEffect(() => {
    if (!isOpen || !plants.length) return;
    const firstPlant = plants[0]?.name || "";
    setTargetPlant((current) => current || firstPlant);
    setMarketingTargetPlant((current) => current || firstPlant);
  }, [isOpen, plants]);

  useEffect(() => {
    if (isOpen && masterDataError) setError(masterDataError);
  }, [isOpen, masterDataError]);

  // Compress to a database-safe JPEG size before including the image in the create request.
  const compressImageFile = (file: File, maxDim = 800): Promise<{ url: string; sizeKb: number }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            for (const quality of [0.5, 0.4, 0.3]) {
              const dataUrl = canvas.toDataURL("image/jpeg", quality);
              const encoded = dataUrl.slice(dataUrl.indexOf(",") + 1);
              const sizeBytes = Math.floor(encoded.length * 3 / 4);
              if (sizeBytes <= 1_048_576) {
                resolve({ url: dataUrl, sizeKb: Math.max(1, Math.ceil(sizeBytes / 1024)) });
                return;
              }
            }
            resolve({ url: "", sizeKb: 0 });
          } else {
            resolve({ url: "", sizeKb: 0 });
          }
        };
        img.onerror = () => resolve({ url: "", sizeKb: 0 });
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve({ url: "", sizeKb: 0 });
      reader.readAsDataURL(file);
    });
  };

  // Allow up to 2 compressed images and 1 web link per feasibility request.
  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remainingSlots = 2 - uploadedImages.length;
    if (remainingSlots <= 0) {
      setError("Maximum 2 images are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const filesToProcess = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setError(`Only ${remainingSlots} more image slot(s) available. Added ${remainingSlots} image(s).`);
    } else {
      setError(null);
    }

    for (const file of filesToProcess) {
      const { url, sizeKb } = await compressImageFile(file);
      if (!url) {
        setError(`${file.name} could not be compressed below the 1 MB image limit. Try a smaller image.`);
        continue;
      }
      setUploadedImages((prev) => {
        if (prev.length >= 2) return prev;
        return [
          ...prev,
          {
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            url,
            name: file.name,
            size: `${sizeKb} KB`,
          },
        ];
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Allow one reference link in addition to the two image attachments.
  const handleAddWebLink = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    const trimmed = linkInput.trim();
    if (!trimmed) return;
    if (webLinks.length >= 1) {
      setError("Maximum 1 reference link is allowed.");
      return;
    }
    const formatted = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    if (webLinks.includes(formatted)) {
      setError("This web link has already been added.");
      return;
    }
    setWebLinks((prev) => [...prev, formatted]);
    setLinkInput("");
    setError(null);
  };

  const handleRemoveWebLink = (idx: number) => {
    setWebLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const effectiveTypeLabel = useMemo(() => {
    if (selectedFeasibilityType === "other") {
      return customTypeOther.trim() || "Bespoke / Custom";
    }
    const found = FEASIBILITY_TYPES.find((t) => t.id === selectedFeasibilityType);
    return found ? found.label : "Feasibility Check";
  }, [selectedFeasibilityType, customTypeOther]);

  if (!isOpen) return null;


  // Create the request first, then open product staging for the saved request.
  const handleSubmitSampling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!marketingCustomer.trim()) {
      setError("Please select a customer account.");
      return;
    }
    if (!marketingProgramName.trim()) {
      setError("Please enter a program name.");
      return;
    }
    const payload: Partial<SampleRequestItem> = {
      customer: marketingCustomer,
      programName: marketingProgramName,
      programYear: marketingProgramYear,
      year: byInfo.businessYearStr,
      targetPlant: marketingTargetPlant || undefined,
      productDescription: `${marketingProgramName.trim()} — Product staging pending`,
      requestTypes: [],
      status: "Draft (Pre-SMT)",
      createdBy: requestCreatedBy || "Marketing Team (Corporate)",
      dateRequestCreated: new Date().toISOString().split("T")[0],
      creationMode: "marketing_request",
    };

    setIsSubmitting(true);
    try {
      const saved = await onSubmit(payload);
      if (!saved || typeof saved !== "object") {
        setError("The sampling request could not be saved. Please check the details and try again.");
        return;
      }
      const stagingContext = {
        customer: marketingCustomer,
        programName: marketingProgramName.trim(),
        programYear: marketingProgramYear,
        year: byInfo.businessYearStr,
        targetPlant: marketingTargetPlant,
        parentRequestId: saved.id,
        parentSrNumber: saved.srNumber,
      };
      sessionStorage.setItem("samp_active_program_form", JSON.stringify(stagingContext));
      sessionStorage.removeItem("samp_active_staged_products");
      onClose();
      navigate("/sample-requests/product-staging", { state: stagingContext });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The sampling request could not be saved.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Handler: Track 2 (Feasibility Check)
  const handleSubmitFeasibility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!customer.trim()) {
      setError("Please select a customer account.");
      return;
    }
    if (selectedFeasibilityType === "other" && !customTypeOther.trim()) {
      setError("Please specify the custom requirement.");
      return;
    }
    if (!feasibilityDescription.trim()) {
      setError("Please provide description and technical notes.");
      return;
    }
    if (!feasibilityTargetDate.trim()) {
      setError("Please select a required target date.");
      return;
    }
    if (isDateRestricted(feasibilityTargetDate)) {
      setError("The selected required date falls on a factory holiday (Sundays and even Saturdays are plant off days). Please select an active working day.");
      return;
    }

    const sections: string[] = [
      feasibilityDescription.trim(),
    ];

    if (releaseRemarks.trim()) {
      sections.push(`Marketing Remarks:\n${releaseRemarks.trim()}`);
    }

    if (webLinks.length > 0) {
      sections.push(
        `Reference Web Links (${webLinks.length}):\n` +
        webLinks.map((l, i) => `${i + 1}. ${l}`).join("\n")
      );
    }

    if (uploadedImages.length > 0) {
      sections.push(
        `Attached Images (${uploadedImages.length}):\n` +
        uploadedImages.map((img, i) => `${i + 1}. ${img.name}`).join("\n")
      );
    }

    const fullDescriptionWithMetadata = sections.join("\n\n");

    const payload: Partial<SampleRequestItem> = {
      customer,
      productDescription: fullDescriptionWithMetadata,
      descriptionNotes: fullDescriptionWithMetadata,
      programName: `${customer} · ${effectiveTypeLabel}`,
      programYear: byInfo.businessYearStr,
      year: byInfo.businessYearStr,
      sampleRequiredDate: feasibilityTargetDate || undefined,
      qtyForSampling: 1,
      qtyDesignCosting: 0,
      requestTypes: [] as any,
      status: "Pending Feasibility",
      samplingFeasibilityResponse: null,
      samplingFeasibilityRemark: null,
      feasibilityClosedBy: null,
      feasibilityClosedAt: null,
      createdBy: requestCreatedBy || "Marketing Team (Corporate)",
      dateRequestCreated: new Date().toISOString().split("T")[0],
      creationMode: "feasibility_check",
      productImagePath: uploadedImages[0]?.url || (webLinks[0]?.startsWith("http") ? webLinks[0] : undefined),
      referenceImages: uploadedImages.map((img) => img.url),
      referenceImageNames: uploadedImages.map((img) => img.name),
      referenceLinks: webLinks,
      feasibilityType: selectedFeasibilityType,
      customFeasibilityType: selectedFeasibilityType === "other" ? customTypeOther.trim() : null,
      feasibilityDescription: feasibilityDescription.trim(),
      marketingRemarks: releaseRemarks.trim() || null,
    };

    setIsSubmitting(true);
    try {
      const saved = await onSubmit(payload);
      if (saved) onClose();
      else setError("The feasibility request could not be saved. Please check the details and try again.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The feasibility request could not be saved.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Proceed Handler: Track 3 -> Navigate to Dedicated Planning Page
  const handleProceedToPlanning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim()) {
      setError("Please select a customer account.");
      return;
    }
    if (!targetPlant.trim()) {
      setError("Please select a target plant.");
      return;
    }
    if (!programPlanName.trim()) {
      setError("Please provide a program campaign title.");
      return;
    }
    if (!programPlanYear.trim()) {
      setError("Please specify the program year.");
      return;
    }
    setError(null);
    onClose();
    navigate("/sample-requests/program-planning", {
      state: {
        customer,
        targetPlant,
        programPlanName,
        programPlanYear,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 animate-smooth-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-5">
        <div className="relative w-full max-w-4xl bg-[#F1F3F5] dark:bg-[#12141a] border border-[#D8DADD] dark:border-white/[0.08] rounded-xl shadow-xl select-text overflow-hidden animate-smooth-modal">
          
          {/* Enterprise ERP Header Bar */}
          <div className="flex items-center justify-between px-6 py-3.5 bg-[#714B67] text-white shrink-0 border-b border-[#5B3C53]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white/15 flex items-center justify-center text-white shrink-0">
                {selectedTrack === "feasibility_check" ? (
                  <ClipboardCheck className="w-4 h-4 stroke-[2.2]" />
                ) : selectedTrack === "program_planning" ? (
                  <Calendar className="w-4 h-4 stroke-[2.2]" />
                ) : (
                  <Package className="w-4 h-4 stroke-[2.2]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {selectedTrack === "feasibility_check" && "Technical Feasibility Check"}
                    {selectedTrack === "marketing_request" && "Commercial Sample Request"}
                    {selectedTrack === "program_planning" && "Seasonal Program Planning"}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-white/20 text-white tracking-wider uppercase">
                    {selectedTrack === "feasibility_check" ? "FC-2026" : selectedTrack === "program_planning" ? "PLN-2026" : "SR-2026"}
                  </span>
                </div>
                <p className="text-[11px] text-white/80 mt-0.5 font-normal">
                  {selectedTrack === "feasibility_check" &&
                    "Sampling feasibility assessment, paper GSM & prototype specification evaluation"}
                  {selectedTrack === "marketing_request" &&
                    "Create a sampling request, then add products and specifications"}
                  {selectedTrack === "program_planning" &&
                    "Define customer account, target plant, campaign title, and seasonal pipeline"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center text-[10.5px] font-mono font-semibold px-2.5 py-1 rounded bg-white/20 text-white tracking-wide">
                DRAFT INTAKE
              </span>

              <button
                type="button"
                onClick={onClose}
                className="h-7 w-7 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Enterprise ERP Track Switcher Tabs (Only shown when not locked to a specific track) */}
          {!lockTrack && (
            <div className="flex items-center gap-1 px-6 bg-[#F8F9FA] dark:bg-[#161822] border-b border-[#D8DADD] dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setSelectedTrack("feasibility_check");
                  setError(null);
                }}
                className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors duration-100 cursor-pointer select-none ${
                  selectedTrack === "feasibility_check"
                    ? "border-[#714B67] text-[#714B67] dark:text-[#E8D7E3] bg-white dark:bg-[#1f212a] font-bold shadow-2xs"
                    : "border-transparent text-[#64748B] hover:text-[#1E293B] hover:bg-black/[0.02]"
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Feasibility Check</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTrack("marketing_request");
                  setError(null);
                }}
                className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors duration-100 cursor-pointer select-none ${
                  selectedTrack === "marketing_request"
                    ? "border-[#714B67] text-[#714B67] dark:text-[#E8D7E3] bg-white dark:bg-[#1f212a] font-bold shadow-2xs"
                    : "border-transparent text-[#64748B] hover:text-[#1E293B] hover:bg-black/[0.02]"
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Standard Sampling</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTrack("program_planning");
                  setError(null);
                }}
                className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors duration-100 cursor-pointer select-none ${
                  selectedTrack === "program_planning"
                    ? "border-[#714B67] text-[#714B67] dark:text-[#E8D7E3] bg-white dark:bg-[#1f212a] font-bold shadow-2xs"
                    : "border-transparent text-[#64748B] hover:text-[#1E293B] hover:bg-black/[0.02]"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Program Planning</span>
              </button>
            </div>
          )}

          {/* Modal Body: Single Page Document Sheet */}
          <div className="p-5 sm:p-6 max-h-[78vh] overflow-y-auto">
            {error && (
              <div className="mb-4 px-3.5 py-2.5 rounded border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            {/* TAB 1: FEASIBILITY CHECK FORM (Enterprise Document Sheet) */}
            {selectedTrack === "feasibility_check" && (
              <form onSubmit={handleSubmitFeasibility} className="space-y-4">
                <div className="bg-white dark:bg-[#1a1c24] border border-[#D8DADD] dark:border-white/[0.08] rounded-lg p-5 sm:p-6 shadow-2xs space-y-5">
                  {/* Sheet Header Row */}
                  <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-zinc-800 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#1E293B] dark:text-zinc-100">
                          Sampling Feasibility Specification
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-[#017E84] border border-[#017E84]/30 font-bold">
                          ACTIVE ASSESSMENT
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] dark:text-zinc-400 mt-0.5">
                        Define customer account, feasibility classification, technical specifications, and reference materials.
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 bg-[#F8F9FA] dark:bg-zinc-800 border border-[#CED4DA] dark:border-zinc-700 px-3 py-1 rounded">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase">SLA TARGET</span>
                      <span className="text-xs font-mono font-bold text-[#017E84]">48 Hours</span>
                    </div>
                  </div>

                  {/* Two-Column Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left Column (7 cols) */}
                    <div className="lg:col-span-7 space-y-4">
                      {/* Customer Account */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 mb-1.5 font-sans">
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

                      {/* Feasibility Type Selection Cards */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 mb-1.5 font-sans">
                          Feasibility Classification <span className="text-rose-500">*</span>
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {FEASIBILITY_TYPES.map((type) => {
                            const isSelected = selectedFeasibilityType === type.id;
                            const isOther = type.id === "other";
                            return (
                              <button
                                key={type.id}
                                type="button"
                                onClick={() => setSelectedFeasibilityType(type.id)}
                                className={`text-left p-3 rounded-lg border transition-colors duration-100 cursor-pointer select-none flex flex-col justify-between gap-1 relative ${
                                  isOther ? "sm:col-span-2" : ""
                                } ${
                                  isSelected
                                    ? "border-[#714B67] bg-[#714B67]/[0.06] ring-1 ring-[#714B67]/30 shadow-xs"
                                    : "border-[#CED4DA] dark:border-white/[0.08] hover:border-[#714B67]/50 bg-[#F8F9FA] dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-850 text-neutral-700 dark:text-zinc-300"
                                }`}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span
                                    className={`text-xs tracking-tight ${
                                      isSelected
                                        ? "text-[#714B67] dark:text-[#E8D7E3] font-bold"
                                        : "font-semibold text-neutral-900 dark:text-zinc-100"
                                    }`}
                                  >
                                    {type.label}
                                  </span>
                                  <span
                                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                      isSelected
                                        ? "bg-[#714B67] text-white"
                                        : "border border-neutral-300 dark:border-zinc-600"
                                    }`}
                                  >
                                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </span>
                                </div>
                                <p className="text-[11px] text-neutral-500 dark:text-zinc-400 leading-snug">
                                  {type.desc}
                                </p>
                              </button>
                            );
                          })}
                        </div>

                        {selectedFeasibilityType === "other" && (
                          <div className="mt-2.5">
                            <input
                              type="text"
                              required
                              placeholder="Specify bespoke requirement (e.g., Embossed Metallic Foil Spine, Novel Die Cut)..."
                              value={customTypeOther}
                              onChange={(e) => setCustomTypeOther(e.target.value)}
                              className="w-full h-9 px-3 rounded-lg border border-[#714B67] bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none ring-2 ring-[#714B67]/15 shadow-2xs"
                            />
                          </div>
                        )}
                      </div>

                      {/* Technical Description & Notes */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 mb-1.5 font-sans">
                          Technical Description &amp; Specifications <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Provide complete technical context, material GSM, binding dimensions, special coatings, machine tolerances, and manufacturing evaluation criteria..."
                          value={feasibilityDescription}
                          onChange={(e) => setFeasibilityDescription(e.target.value)}
                          className="w-full p-3 rounded-lg border border-[#CED4DA] dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/15 outline-none transition-colors duration-100 resize-none leading-relaxed shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Right Column (5 cols) */}
                    <div className="lg:col-span-5 space-y-4">
                      {/* Required Target Date */}
                      <div>
                        <OperationalDatePicker
                          label="Required Target Date"
                          required
                          value={feasibilityTargetDate}
                          onChange={(val) => {
                            setFeasibilityTargetDate(val);
                            if (error) setError(null);
                          }}
                          minDate={new Date().toISOString().split("T")[0]}
                          placeholder="Select required target date..."
                        />
                      </div>

                      {/* Marketing Remarks / Notes */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 font-sans">
                            Marketing Remarks / Notes
                          </label>
                          <span className="text-[10px] text-zinc-400 font-medium">Optional</span>
                        </div>
                        <textarea
                          rows={3}
                          placeholder="Enter any additional marketing remarks, client constraints, or special evaluation instructions..."
                          value={releaseRemarks}
                          onChange={(e) => setReleaseRemarks(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-[#CED4DA] dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/15 outline-none transition-colors duration-100 resize-none leading-relaxed shadow-2xs"
                        />
                      </div>

                      {/* Attachments Section */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 font-sans">
                            Reference Attachments
                          </label>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                              uploadedImages.length >= 2 && webLinks.length >= 1
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40"
                                : totalAttachments > 0
                                ? "bg-[#017E84]/10 text-[#017E84] dark:bg-[#017E84]/20 dark:text-teal-300 border border-[#017E84]/20"
                                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}
                          >
                            {uploadedImages.length}/2 images · {webLinks.length}/1 link
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          <div className="inline-flex w-full rounded-lg bg-[#F8F9FA] dark:bg-zinc-800/80 p-1 text-[11px] border border-[#CED4DA] dark:border-zinc-700/60">
                            <button
                              type="button"
                              onClick={() => setMediaTab("files")}
                              className={`flex-1 py-1.5 rounded-md text-[11px] transition-colors duration-100 cursor-pointer flex items-center justify-center gap-1.5 ${
                                mediaTab === "files"
                                  ? "bg-white dark:bg-zinc-700 text-[#714B67] dark:text-[#E8D7E3] shadow-xs font-bold"
                                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 font-medium"
                              }`}
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>Image Upload</span>
                              {uploadedImages.length > 0 && (
                                <span className="ml-1 text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-[#714B67]/10 text-[#714B67] dark:bg-[#714B67]/30 dark:text-[#E8D7E3]">
                                  {uploadedImages.length}
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setMediaTab("links")}
                              className={`flex-1 py-1.5 rounded-md text-[11px] transition-colors duration-100 cursor-pointer flex items-center justify-center gap-1.5 ${
                                mediaTab === "links"
                                  ? "bg-white dark:bg-zinc-700 text-[#714B67] dark:text-[#E8D7E3] shadow-xs font-bold"
                                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 font-medium"
                              }`}
                            >
                              <Link2 className="w-3.5 h-3.5" />
                              <span>Web URL Link</span>
                              {webLinks.length > 0 && (
                                <span className="ml-1 text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-[#714B67]/10 text-[#714B67] dark:bg-[#714B67]/30 dark:text-[#E8D7E3]">
                                  {webLinks.length}
                                </span>
                              )}
                            </button>
                          </div>

                          {mediaTab === "files" && (
                            <div>
                              <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleMultipleImageUpload}
                                className="hidden"
                              />
                              {uploadedImages.length < 2 ? (
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="w-full py-2.5 px-3 rounded-lg border-2 border-dashed border-[#CED4DA] dark:border-zinc-700 hover:border-[#017E84] bg-[#F8F9FA] dark:bg-zinc-900/40 hover:bg-[#017E84]/[0.03] text-zinc-600 dark:text-zinc-400 hover:text-[#017E84] flex items-center justify-between text-xs font-medium transition-colors duration-100 cursor-pointer group shadow-2xs"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-md bg-white dark:bg-zinc-800 group-hover:bg-[#017E84]/10 text-zinc-400 group-hover:text-[#017E84] flex items-center justify-center transition-colors border border-[#CED4DA]">
                                      <UploadCloud className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                      <span className="block font-semibold text-[#1E293B] dark:text-zinc-200 group-hover:text-[#017E84] transition-colors">
                                        Choose photos to upload
                                      </span>
                                      <span className="block text-[10px] text-[#64748B]">
                                        Supports PNG, JPG, WEBP
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-500 border border-[#CED4DA] group-hover:bg-[#017E84]/10 group-hover:text-[#017E84] transition-colors">
                                    {2 - uploadedImages.length} slot{2 - uploadedImages.length === 1 ? "" : "s"} left
                                  </span>
                                </button>
                              ) : (
                                <div className="w-full h-9 px-3 rounded-lg bg-[#F8F9FA] dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-xs font-medium flex items-center justify-center border border-[#CED4DA]">
                                  Maximum 2 images reached
                                </div>
                              )}
                            </div>
                          )}

                          {mediaTab === "links" && (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="url"
                                placeholder={
                                  webLinks.length >= 1
                                    ? "Maximum 1 reference link reached"
                                    : "Paste URL (e.g. drive.google.com, figma...)"
                                }
                                disabled={webLinks.length >= 1}
                                value={linkInput}
                                onChange={(e) => setLinkInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddWebLink(e);
                                  }
                                }}
                                className="flex-1 h-9 px-3 rounded-lg border border-[#CED4DA] dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-[#017E84] focus:ring-2 focus:ring-[#017E84]/15 outline-none disabled:opacity-50 transition-colors duration-100 shadow-2xs"
                              />
                              <button
                                type="button"
                                onClick={handleAddWebLink}
                                disabled={webLinks.length >= 1 || !linkInput.trim()}
                                className="h-9 px-3.5 rounded-lg bg-[#017E84] hover:bg-[#00666A] active:bg-[#005256] text-white text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-100 shadow-xs flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </button>
                            </div>
                          )}

                          {totalAttachments > 0 ? (
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                              {uploadedImages.map((img) => (
                                <div
                                  key={img.id}
                                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-[#CED4DA] dark:border-zinc-800 bg-[#F8F9FA] dark:bg-zinc-900 text-xs shadow-2xs group"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <img
                                      src={img.url}
                                      alt={img.name}
                                      className="w-7 h-7 rounded-md object-cover border border-[#CED4DA] dark:border-zinc-800 shrink-0"
                                    />
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#714B67]/10 text-[#714B67] dark:bg-[#714B67]/20 border border-[#714B67]/20 shrink-0">
                                      IMG
                                    </span>
                                    <span className="truncate font-medium text-zinc-800 dark:text-zinc-200 text-xs" title={img.name}>
                                      {img.name}
                                    </span>
                                    {img.size && (
                                      <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                                        ({img.size})
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(img.id)}
                                    title="Remove image"
                                    className="p-1 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}

                              {webLinks.map((url, idx) => (
                                <div
                                  key={`link-${idx}`}
                                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-[#CED4DA] dark:border-zinc-800 bg-[#F8F9FA] dark:bg-zinc-900 text-xs shadow-2xs group"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 shrink-0">
                                      URL
                                    </span>
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="truncate text-[#017E84] hover:underline flex items-center gap-1 text-xs font-medium"
                                      title={url}
                                    >
                                      <span className="truncate">{url}</span>
                                      <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                                    </a>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveWebLink(idx)}
                                    title="Remove link"
                                    className="p-1 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="px-3 py-2.5 rounded-lg border border-dashed border-[#CED4DA] dark:border-zinc-800 bg-[#F8F9FA] dark:bg-zinc-900/30 text-center">
                              <span className="text-[11px] text-[#64748B]">
                                No attachments yet (optional · up to 2 images and 1 link)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-9 px-4 rounded bg-white dark:bg-zinc-800 border border-[#CED4DA] dark:border-zinc-700 text-xs font-semibold text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8F9FA] transition-colors cursor-pointer shadow-2xs"
                  >
                    Discard
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#64748B] font-mono hidden sm:inline">
                      Ready to submit to Sampling Desk
                    </span>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-9 px-5 rounded bg-[#017E84] hover:bg-[#00666A] active:bg-[#005256] text-white text-xs font-bold cursor-pointer transition-colors duration-100 shadow-xs flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSubmitting ? "Submitting..." : "Submit Feasibility Check"}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: STANDARD SAMPLING FORM (Commercial Sample Request Step 1 Intake) */}
            {selectedTrack === "marketing_request" && (
              <form onSubmit={handleSubmitSampling} className="space-y-4">
                {/* Enterprise Step Flow Indicator */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#F8F9FA] dark:bg-zinc-800/70 border border-[#CED4DA] dark:border-zinc-700 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#714B67] text-white text-[11px] font-bold">
                      1
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Step 1: Program Header Setup
                    </span>
                    <ArrowRight className="w-3 h-3 text-zinc-400" />
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Step 2: Staging &amp; Deliverables
                    </span>
                  </div>
                  <span className="font-mono text-[10.5px] font-bold px-2 py-0.5 rounded bg-[#F3E8EE] text-[#714B67] dark:bg-[#3E2938] dark:text-[#E8D7E3] border border-[#714B67]/25">
                    COMMERCIAL INTAKE
                  </span>
                </div>

                {/* Form Sheet Content */}
                <div className="bg-white dark:bg-[#1a1c24] border border-[#CED4DA] dark:border-white/[0.08] rounded p-5 space-y-4 shadow-2xs">
                  {/* Row 1: Customer Account & Program Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 mb-1.5 font-sans">
                        Customer Account <span className="text-rose-500">*</span>
                      </label>
                      <CustomerCombobox
                        customers={customers}
                        value={marketingCustomer}
                        onChange={setMarketingCustomer}
                        disabled={isMasterDataLoading || customers.length === 0}
                        placeholder="Select target customer account..."
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 font-sans">
                          Program Name <span className="text-rose-500">*</span>
                        </label>
                        {matchingPrograms.length > 0 && (
                          <span className="text-[10px] font-mono text-[#017E84] dark:text-[#2dd4bf] font-bold">
                            {matchingPrograms.length} open program{matchingPrograms.length !== 1 ? "s" : ""} found
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        list="open-programs-datalist"
                        placeholder="e.g. Back to school, Hardcover Notebooks..."
                        value={marketingProgramName}
                        onChange={(e) => setMarketingProgramName(e.target.value)}
                        className="w-full h-10 px-3.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67] transition-colors duration-100"
                      />

                      <datalist id="open-programs-datalist">
                        {matchingPrograms.map((p) => (
                          <option key={p.id} value={p.programName || p.programCampaignTitle || ""}>
                            {p.programName || p.programCampaignTitle} (Season {p.programYear || "2026"})
                          </option>
                        ))}
                      </datalist>

                      {/* Open Seasonal Program Picker Pills */}
                      {matchingPrograms.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 animate-smooth-toast">
                          <span className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 font-semibold flex items-center gap-1">
                            <FolderGit2 className="w-3 h-3 text-[#714B67] dark:text-purple-400" />
                            Open:
                          </span>
                          {matchingPrograms.map((prog) => {
                            const progTitle = prog.programName || prog.programCampaignTitle || "";
                            const isCurrent =
                              marketingProgramName.trim().toLowerCase() === progTitle.trim().toLowerCase();
                            return (
                              <button
                                key={prog.id}
                                type="button"
                                onClick={() => {
                                  setMarketingProgramName(progTitle);
                                  if (prog.programYear) {
                                    setMarketingProgramYear(prog.programYear);
                                  }
                                }}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono transition cursor-pointer ${
                                  isCurrent
                                    ? "bg-[#714B67] text-white font-bold shadow-2xs"
                                    : "bg-[#F3E8EE] dark:bg-[#3E2938]/60 text-[#714B67] dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-950/60"
                                }`}
                                title={`Click to select: ${progTitle} (${prog.programYear || "2026"})`}
                              >
                                <span>{progTitle}</span>
                                <span className="text-[9.5px] opacity-80">({prog.programYear || "2026"})</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Program Year Horizon & Target Fulfillment Plant */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 mb-1.5 font-sans">
                        Program Year Horizon <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {byInfo.seasonYearOptions.map((year) => {
                          const isSelected = marketingProgramYear === year;
                          return (
                            <button
                              key={year}
                              type="button"
                              onClick={() => setMarketingProgramYear(year)}
                              className={`h-10 px-2.5 rounded border text-xs font-semibold transition-colors duration-100 flex items-center justify-between cursor-pointer select-none ${
                                isSelected
                                  ? "border-[#714B67] bg-[#714B67]/10 dark:bg-[#714B67]/20 text-[#714B67] dark:text-[#E8D7E3] font-bold ring-1 ring-[#714B67]/30"
                                  : "border-[#CED4DA] dark:border-zinc-800 bg-[#F8F9FA] dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 hover:bg-white"
                              }`}
                            >
                              <span className="font-mono text-xs">{year}</span>
                              {isSelected && <Check className="w-3 h-3 text-[#714B67] dark:text-[#E8D7E3] stroke-[2.5]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 mb-1.5 font-sans">
                        Target Fulfillment Plant <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={marketingTargetPlant}
                        onChange={(e) => setMarketingTargetPlant(e.target.value)}
                        className="w-full h-10 px-3 rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67] transition-colors duration-100 cursor-pointer"
                      >
                        {plants.length > 0 ? (
                          plants.map((plant) => (
                            <option key={plant.id} value={plant.name}>
                              {plant.name}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="Navneet - Khaniwade">Navneet - Khaniwade</option>
                            <option value="Navneet - Dantali">Navneet - Dantali</option>
                            <option value="Navneet - Silvassa">Navneet - Silvassa</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Informational Guidance Callout */}
                  <div className="flex items-start gap-2.5 p-3 rounded bg-[#017E84]/5 dark:bg-[#017E84]/10 border border-[#017E84]/20 text-xs text-zinc-700 dark:text-zinc-300">
                    <Package className="w-4 h-4 text-[#017E84] shrink-0 mt-0.5" />
                    <div className="text-[11.5px] leading-relaxed">
                      <span className="font-semibold text-[#017E84] dark:text-teal-400">Next in Product Staging:</span>{" "}
                      Attach multiple products, define artwork briefs or physical sample specifications, and assign commercial deliverables across <strong className="text-zinc-900 dark:text-zinc-100">Design</strong>, <strong className="text-zinc-900 dark:text-zinc-100">Mockup</strong>, <strong className="text-zinc-900 dark:text-zinc-100">Sampling</strong>, and <strong className="text-zinc-900 dark:text-zinc-100">Costing</strong>.
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-9 px-4 rounded bg-white dark:bg-zinc-800 border border-[#CED4DA] dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 hover:bg-[#F8F9FA] transition-colors cursor-pointer"
                  >
                    Discard
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-9 px-5 rounded bg-[#017E84] hover:bg-[#00666A] active:bg-[#005256] text-white text-xs font-bold cursor-pointer transition-colors duration-100 shadow-xs flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                    >
                      {isSubmitting ? (
                        <span>Initializing Staging...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Create &amp; Add Products</span>
                          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 3: PROGRAM PLANNING FORM (Single-Page Setup) */}
            {selectedTrack === "program_planning" && (
              <form onSubmit={handleProceedToPlanning} className="space-y-4">
                <div className="bg-white dark:bg-[#1a1c24] border border-[#D8DADD] dark:border-white/[0.08] rounded-lg p-5 sm:p-6 shadow-2xs space-y-5">
                  {/* Sheet Header Row */}
                  <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-zinc-800 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#1E293B] dark:text-zinc-100">
                          Seasonal Program Planning Setup
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                          CAMPAIGN SETUP
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] dark:text-zinc-400 mt-0.5">
                        Initialize high-volume seasonal line, define target facility, and setup planning workspace.
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 bg-[#F8F9FA] dark:bg-zinc-800 border border-[#CED4DA] dark:border-zinc-700 px-3 py-1 rounded">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase">PLANNING CYCLE</span>
                      <span className="text-xs font-mono font-bold text-[#714B67]">{byInfo.businessYearStr}</span>
                    </div>
                  </div>

                  {/* Customer Account & Target Plant */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 mb-1.5 font-sans">
                        Customer Name <span className="text-rose-500">*</span>
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
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 mb-1.5 font-sans">
                        Target Plant <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={targetPlant}
                        disabled={isMasterDataLoading || plants.length === 0}
                        onChange={(e) => setTargetPlant(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-[#CED4DA] dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/15 transition-colors duration-100 cursor-pointer shadow-2xs"
                      >
                        {plants.map((item) => (
                          <option key={item.id} value={item.name}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Program Campaign Title */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 mb-1.5 font-sans">
                      Program Campaign Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={programPlanName}
                      onChange={(e) => setProgramPlanName(e.target.value)}
                      placeholder="e.g. Back-to-School 2026-2027 Hardcover Line"
                      className="w-full h-10 px-3.5 rounded-lg border border-[#CED4DA] dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/15 transition-colors duration-100 shadow-2xs"
                    />
                  </div>

                  {/* Program Business Year */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400 mb-1.5 font-sans">
                      Program Business Year <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={programPlanYear}
                      onChange={(e) => setProgramPlanYear(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#CED4DA] dark:border-zinc-700/80 bg-white dark:bg-zinc-900/80 text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/15 cursor-pointer transition-colors duration-100 shadow-2xs"
                    >
                      {byInfo.businessYearOptions.map((by) => (
                        <option key={by} value={by}>{by}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-9 px-4 rounded bg-white dark:bg-zinc-800 border border-[#CED4DA] dark:border-zinc-700 text-xs font-semibold text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8F9FA] transition-colors cursor-pointer shadow-2xs"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-5 rounded bg-[#017E84] hover:bg-[#00666A] active:bg-[#005256] text-white text-xs font-bold cursor-pointer transition-colors duration-100 shadow-sm inline-flex items-center justify-center gap-1.5 select-none"
                  >
                    <span>Initialize Program Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSampleRequestModal;
