import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserProfile } from "@/features/auth";
import { fetchCreativeBriefsApi, updateCreativeBriefApi } from "@/infrastructure/api/downstreamApi";
import { fetchAllMarketingRequestsApi } from "@/infrastructure/api/sampleRequestsApi";
import { useBusinessYear } from "@/context/BusinessYearContext";
import { CreativeBriefItem, SampleRequestItem } from "@/features/sample-requests/types";
import { CreativeOverviewPage } from "./CreativeOverviewPage";
import { CreativeDesignPage } from "./CreativeDesignPage";
import { CreativeSamplingMockupPage } from "./CreativeSamplingMockupPage";
import { CreativeInspectorModal } from "./CreativeInspectorModal";
import { SampleRequestInspector } from "@/features/sample-requests/components/SampleRequestInspector";
import { Palette, Box, Sparkles, LayoutDashboard, Layers } from "lucide-react";

export interface CreativeWorkDeskProps {
  user?: UserProfile | null;
}

export const CreativeWorkDesk: React.FC<CreativeWorkDeskProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedYear } = useBusinessYear();

  // Active sub-view: "overview" | "design" | "sampling"
  const activeView: "overview" | "design" | "sampling" = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes("/design")) return "design";
    if (path.includes("/sampling") || path.includes("/mockup")) return "sampling";
    return "overview";
  }, [location.pathname]);

  const handleSelectTab = (tab: "overview" | "design" | "sampling") => {
    if (tab === "overview") navigate("/creative-work");
    else if (tab === "design") navigate("/creative-work/design");
    else if (tab === "sampling") navigate("/creative-work/sampling");
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

  // Data state
  const [briefs, setBriefs] = useState<CreativeBriefItem[]>([]);
  const [allRequests, setAllRequests] = useState<SampleRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inspector states
  const [selectedBrief, setSelectedBrief] = useState<CreativeBriefItem | null>(null);
  const [isBriefInspectorOpen, setIsBriefInspectorOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SampleRequestItem | null>(null);
  const [isRequestInspectorOpen, setIsRequestInspectorOpen] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Load briefs & sample requests
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [liveBriefs, requests] = await Promise.all([
        fetchCreativeBriefsApi().catch(() => []),
        fetchAllMarketingRequestsApi(selectedYear).catch(() => []),
      ]);

      setBriefs(Array.isArray(liveBriefs) ? liveBriefs : []);
      setAllRequests(Array.isArray(requests) ? requests : []);
    } catch (err) {
      console.error("Failed to load creative data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleRefresh = (event: Event) => {
      event.preventDefault();
      void loadData().finally(() => window.dispatchEvent(new Event("app:refresh-complete")));
    };
    const handleRequestsChanged = () => {
      void loadData();
    };
    window.addEventListener("app:refresh-requested", handleRefresh);
    window.addEventListener("samp:requests-changed", handleRequestsChanged);
    return () => {
      window.removeEventListener("app:refresh-requested", handleRefresh);
      window.removeEventListener("samp:requests-changed", handleRequestsChanged);
    };
  }, [loadData]);

  // Design scoped requests
  const designRequests = useMemo(() => {
    return allRequests.filter((r) => {
      const scopes = r.requestTypes || [];
      const s = String(r.status || "").toLowerCase();
      const code = String(r.materialCode || "");
      return (
        scopes.includes("design") ||
        s.includes("creative") ||
        code.startsWith("DSG-") ||
        r.requestKind === "design"
      );
    });
  }, [allRequests]);

  // Sampling & Mockup requests (come together)
  const samplingMockupRequests = useMemo(() => {
    return allRequests.filter((r) => {
      const scopes = r.requestTypes || [];
      const hasMockup = scopes.includes("mockup") || r.mockupRequired === "Yes";
      const hasSample = scopes.includes("sample");
      return hasMockup || hasSample;
    });
  }, [allRequests]);

  // Counts for tabs
  const designCount = briefs.length + designRequests.length;
  const samplingMockupCount = samplingMockupRequests.length;

  const handleUpdateCurrentBriefStatus = async (
    newStatus: CreativeBriefItem["proofStatus"],
    notes?: string
  ) => {
    if (!selectedBrief) return;
    try {
      await updateCreativeBriefApi(selectedBrief.id, { proofStatus: newStatus, clientFeedback: notes });
      setBriefs((prev) =>
        prev.map((b) => (b.id === selectedBrief.id ? { ...b, proofStatus: newStatus } : b))
      );
      showToast(`✓ Proof status updated to "${newStatus}"!`);
      setIsBriefInspectorOpen(false);
    } catch {
      showToast("Error updating proof status");
    }
  };

  const handleUpdateDesignStatus = async (
    id: string,
    newStatus: CreativeBriefItem["proofStatus"],
    notes?: string
  ) => {
    try {
      await updateCreativeBriefApi(id, { proofStatus: newStatus, clientFeedback: notes });
      setBriefs((prev) =>
        prev.map((b) => (b.id === id ? { ...b, proofStatus: newStatus } : b))
      );
      showToast(`✓ Proof status updated to "${newStatus}"!`);
    } catch {
      showToast("Error updating proof status");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8F9FA] dark:bg-[#0b0c10] overflow-hidden select-none relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-6 z-50 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[12px] font-semibold px-4 py-2 rounded-lg shadow-xl border border-zinc-700/50 flex items-center gap-2 animate-in fade-in duration-200">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Enterprise ERP Navigation Tabs Ribbon */}
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

          {/* Tab 2: Design */}
          <button
            type="button"
            onClick={() => handleSelectTab("design")}
            className={`px-3 py-1.5 rounded font-mono text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeView === "design"
                ? "bg-[#714B67] text-white shadow-2xs"
                : "text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-white/[0.04]"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Design</span>
            <span
              className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-mono ${
                activeView === "design"
                  ? "bg-white/20 text-white"
                  : "bg-neutral-200/70 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400"
              }`}
            >
              {designCount}
            </span>
          </button>

          {/* Tab 3: Sampling & Mockup */}
          <button
            type="button"
            onClick={() => handleSelectTab("sampling")}
            className={`px-3 py-1.5 rounded font-mono text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeView === "sampling"
                ? "bg-[#714B67] text-white shadow-2xs"
                : "text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-white/[0.04]"
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Sampling &amp; Mockup</span>
            <span
              className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-mono ${
                activeView === "sampling"
                  ? "bg-white/20 text-white"
                  : "bg-neutral-200/70 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400"
              }`}
            >
              {samplingMockupCount}
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
        <CreativeOverviewPage
          briefs={briefs}
          designRequests={designRequests}
          samplingMockupRequests={samplingMockupRequests}
          isLoading={isLoading}
          selectedYear={selectedYear}
          selectedPlant={selectedPlant}
          onNavigateToTab={(tab) => handleSelectTab(tab)}
          onInspectBrief={(brief) => {
            setSelectedBrief(brief);
            setIsBriefInspectorOpen(true);
          }}
          onInspectRequest={(req) => {
            setSelectedRequest(req);
            setIsRequestInspectorOpen(true);
          }}
        />
      )}

      {activeView === "design" && (
        <CreativeDesignPage
          briefs={briefs}
          designRequests={designRequests}
          selectedYear={selectedYear}
          onInspectBrief={(brief) => {
            setSelectedBrief(brief);
            setIsBriefInspectorOpen(true);
          }}
          onInspectRequest={(req: SampleRequestItem) => {
            setSelectedRequest(req);
            setIsBriefInspectorOpen(true);
          }}
          onUpdateStatus={handleUpdateDesignStatus}
        />
      )}

      {activeView === "sampling" && (
        <CreativeSamplingMockupPage
          requests={samplingMockupRequests}
          selectedYear={selectedYear}
          selectedPlant={selectedPlant}
          onInspectRequest={(req: SampleRequestItem) => {
            setSelectedRequest(req);
            setIsRequestInspectorOpen(true);
          }}
        />
      )}

      {/* Brief Inspector Modal */}
      <CreativeInspectorModal
        isOpen={isBriefInspectorOpen}
        onClose={() => setIsBriefInspectorOpen(false)}
        brief={selectedBrief}
        request={selectedRequest}
        onUpdateStatus={handleUpdateCurrentBriefStatus}
      />

      {/* Sample Request Inspector Modal for Sampling & Mockup requests */}
      {selectedRequest && isRequestInspectorOpen && (
        <SampleRequestInspector
          request={selectedRequest}
          isOpen={isRequestInspectorOpen}
          onClose={() => setIsRequestInspectorOpen(false)}
        />
      )}
    </div>
  );
};

export default CreativeWorkDesk;
