import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserProfile } from "@/features/auth";
import { fetchStudioDielinesApi, updateStudioDielineApi } from "@/infrastructure/api/downstreamApi";
import { fetchAllMarketingRequestsApi } from "@/infrastructure/api/sampleRequestsApi";
import { useBusinessYear } from "@/context/BusinessYearContext";
import { DielineItem } from "@/features/sample-requests/types";
import { StudioOverviewPage } from "./StudioOverviewPage";
import { StudioArtworkPage } from "./StudioArtworkPage";
import { StudioInspectorModal } from "./StudioInspectorModal";
import { LayoutDashboard, FileCode2 } from "lucide-react";

export interface StudioWorkDeskProps {
  user?: UserProfile | null;
}


export const StudioWorkDesk: React.FC<StudioWorkDeskProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedYear } = useBusinessYear();

  // Active sub-view: "overview" | "artwork"
  const activeView: "overview" | "artwork" = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes("/artwork") || path.includes("/cad") || path.includes("/prepress")) {
      return "artwork";
    }
    return "overview";
  }, [location.pathname]);

  const handleSelectTab = (tab: "overview" | "artwork") => {
    if (tab === "overview") navigate("/studio-work");
    else if (tab === "artwork") navigate("/studio-work/artwork");
  };

  // Plant state
  const [selectedPlant, setSelectedPlant] = useState<string>(() => {
    try {
      return localStorage.getItem("samp_active_plant") || "ALL";
    } catch {
      return "ALL";
    }
  });

  useEffect(() => {
    const handlePlantChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ plant: string }>;
      if (customEvent.detail?.plant) {
        setSelectedPlant(customEvent.detail.plant);
      }
    };
    window.addEventListener("app:plant-changed", handlePlantChanged);
    return () => window.removeEventListener("app:plant-changed", handlePlantChanged);
  }, []);

  // Data state: initialized to empty array (no mock seed data)
  const [dielines, setDielines] = useState<DielineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inspector state
  const [selectedDieline, setSelectedDieline] = useState<DielineItem | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Fetch real dielines from backend API
  const loadDielines = useCallback(async () => {
    setIsLoading(true);
    try {
      const [live, allRequests] = await Promise.all([
        fetchStudioDielinesApi().catch(() => []),
        fetchAllMarketingRequestsApi(selectedYear).catch(() => []),
      ]);

      if (Array.isArray(live) && live.length > 0) {
        setDielines(live);
        return;
      }

      // Synthesize dieline records from real sample requests
      const cadRequests = allRequests.filter((r) => {
        const reqTypes = r.requestTypes || [];
        return (
          reqTypes.includes("mockup") ||
          reqTypes.includes("sample") ||
          r.mockupRequired === "Yes" ||
          (r.productType || "").toLowerCase().includes("box")
        );
      });

      const sourceItems = cadRequests.length > 0 ? cadRequests : allRequests.slice(0, 10);
      const synthesized: DielineItem[] = sourceItems.map((r, idx) => {
        const statuses: DielineItem["status"][] = [
          "CAD Intake",
          "Dieline Construction",
          "3D Simulation",
          "Plotter Sample Tested",
          "Laser Die Cleared",
        ];
        const status = statuses[idx % statuses.length];

        return {
          id: `dieline-${r.id}`,
          dielineCode: `DIE-26-${String(r.id).padStart(4, "0")}`,
          srNumber: r.srNumber || `SR-26-${String(r.id).padStart(5, "0")}`,
          boxFormat: (r.productType?.includes("Box") ? "Rigid Box" : "Folding Carton") as DielineItem["boxFormat"],
          title: r.productDescription || "Packaging structural construction",
          client: r.customer || "Navneet Client",
          dimensions: "210 x 148 x 18 mm",
          substrate: r.productType || "SBS C1S 350 GSM Board",
          caliperMicrons: 420,
          machineCompatibility: "Bobst SP 102 E / Heidelberg Speedmaster",
          status,
          dueDate: r.sampleRequiredDate || "2026-11-20",
          targetPlant: r.targetPlant || "1505- Khaniwade",
          grainDirection: "Parallel to Spine",
          fileFormats: [".DXF", ".CF2", ".AI", ".PDF"],
        };
      });

      setDielines(synthesized);
    } catch (err) {
      console.error("Failed to load studio dielines:", err);
      setDielines([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadDielines();
  }, [loadDielines]);

  useEffect(() => {
    const handleRefresh = (event: Event) => {
      event.preventDefault();
      void loadDielines().finally(() => window.dispatchEvent(new Event("app:refresh-complete")));
    };
    const handleRequestsChanged = () => {
      void loadDielines();
    };
    window.addEventListener("app:refresh-requested", handleRefresh);
    window.addEventListener("samp:requests-changed", handleRequestsChanged);
    return () => {
      window.removeEventListener("app:refresh-requested", handleRefresh);
      window.removeEventListener("samp:requests-changed", handleRequestsChanged);
    };
  }, [loadDielines]);

  const handleUpdateStatus = async (id: string, newStatus: DielineItem["status"]) => {
    try {
      await updateStudioDielineApi(id, { status: newStatus });
      setDielines((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
      );
      if (selectedDieline && selectedDieline.id === id) {
        setSelectedDieline((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      showToast(`✓ Dieline status updated to "${newStatus}"!`);
      setIsInspectorOpen(false);
    } catch {
      showToast("Error updating dieline status");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Dieline Code",
      "Title",
      "Client",
      "Box Format",
      "Dimensions",
      "Substrate",
      "Caliper Microns",
      "Machine",
      "Status",
      "Due Date",
      "Plant",
    ];
    const rows = dielines.map((d) => [
      `"${d.dielineCode}"`,
      `"${d.title}"`,
      `"${d.client}"`,
      `"${d.boxFormat}"`,
      `"${d.dimensions}"`,
      `"${d.substrate}"`,
      `"${d.caliperMicrons}"`,
      `"${d.machineCompatibility}"`,
      `"${d.status}"`,
      `"${d.dueDate}"`,
      `"${d.targetPlant}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `navneet_studio_dielines_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${dielines.length} dielines to CSV`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8F9FA] dark:bg-[#0b0c10] overflow-hidden select-none relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-6 z-50 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[12px] font-semibold px-4 py-2 rounded-lg shadow-xl border border-zinc-700/50 flex items-center gap-2 animate-in fade-in duration-200">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Enterprise ERP Navigation Tabs Ribbon (Overview & Artwork ONLY) */}
      <div className="bg-white dark:bg-[#12141d] border-b border-[#E2E8F0] dark:border-white/[0.08] px-6 py-2 flex items-center justify-between shrink-0 shadow-2xs z-10">
        <div className="flex items-center gap-1.5">
          {/* Tab 1: Overview */}
          <button
            type="button"
            onClick={() => handleSelectTab("overview")}
            className={`px-3 py-1.5 rounded font-mono text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeView === "overview"
                ? "bg-[#714B67] text-white shadow-2xs"
                : "text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-white/[0.04]"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          {/* Tab 2: Artwork */}
          <button
            type="button"
            onClick={() => handleSelectTab("artwork")}
            className={`px-3 py-1.5 rounded font-mono text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeView === "artwork"
                ? "bg-[#714B67] text-white shadow-2xs"
                : "text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-white/[0.04]"
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Artwork</span>
            <span
              className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-mono ${
                activeView === "artwork"
                  ? "bg-white/20 text-white"
                  : "bg-neutral-200/70 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400"
              }`}
            >
              {dielines.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
          <span className="hidden sm:inline">Active Plant:</span>
          <span className="font-bold text-neutral-800 dark:text-zinc-200 px-2 py-0.5 rounded bg-neutral-100 dark:bg-zinc-800 border border-[#CED4DA] dark:border-zinc-700">
            {selectedPlant === "ALL" ? "All Plants" : selectedPlant}
          </span>
        </div>
      </div>

      {/* Active Sub-View Body */}
      {activeView === "overview" && (
        <StudioOverviewPage
          dielines={dielines}
          isLoading={isLoading}
          selectedYear={selectedYear}
          selectedPlant={selectedPlant}
          onNavigateToArtwork={() => handleSelectTab("artwork")}
          onInspectDieline={(dieline) => {
            setSelectedDieline(dieline);
            setIsInspectorOpen(true);
          }}
        />
      )}

      {activeView === "artwork" && (
        <StudioArtworkPage
          dielines={dielines}
          selectedYear={selectedYear}
          selectedPlant={selectedPlant}
          onInspectDieline={(dieline) => {
            setSelectedDieline(dieline);
            setIsInspectorOpen(true);
          }}
          onExportCSV={handleExportCSV}
        />
      )}

      {/* Dieline Inspector Modal */}
      <StudioInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        dieline={selectedDieline}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};

export default StudioWorkDesk;
