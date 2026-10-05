import React, { useState, useMemo } from "react";
import { SampleRequestItem, FeasibilityActivityItem } from "../../types";
import { formatErpDate, formatLogDate } from "../../utils/dateUtils";
import {
  Package,
  Send,
  MessageSquare,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Filter,
} from "lucide-react";
import { UserProfile } from "@/features/auth";

export interface FeasibilityChatterFeedProps {
  activeRequest: SampleRequestItem;
  classificationLabel: string;
  onAddNote?: (note: string) => Promise<void>;
  currentUser?: UserProfile | null;
}

interface DisplayEvent {
  id: string | number;
  actorName: string;
  actorDepartment: string;
  action: string;
  title: string;
  body: string;
  timestamp: string;
  badge?: {
    text: string;
    variant: "purple" | "teal" | "amber" | "emerald" | "rose" | "neutral";
  };
  isNote?: boolean;
}

export const FeasibilityChatterFeed: React.FC<FeasibilityChatterFeedProps> = ({
  activeRequest,
  classificationLabel,
  onAddNote,
  currentUser,
}) => {
  const [noteInput, setNoteInput] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "audit" | "notes">("all");

  const handleSubmitNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = noteInput.trim();
    if (!clean || isSubmittingNote || !onAddNote) return;

    setIsSubmittingNote(true);
    try {
      await onAddNote(clean);
      setNoteInput("");
    } catch (err) {
      console.error("Error posting chatter note:", err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Compile real database activities merged with canonical request milestones
  const displayEvents = useMemo<DisplayEvent[]>(() => {
    const events: DisplayEvent[] = [];
    const recordedActions = new Set<string>();

    const rawActivities: FeasibilityActivityItem[] = (Array.isArray(activeRequest.activities)
      ? activeRequest.activities
      : []) as FeasibilityActivityItem[];

    // 1. Process persisted DB activities (excluding spammy VIEWED events)
    rawActivities
      .filter((act) => act.action !== "VIEWED")
      .forEach((act) => {
        recordedActions.add(act.action);
        const payload = act.payload || {};

        if (act.action === "CREATED") {
          events.push({
            id: act.id,
            actorName: act.actorName || activeRequest.createdBy || "Marketing",
            actorDepartment: act.actorDepartment || "Marketing",
            action: act.action,
            title: "Request Logged into System",
            body: `Feasibility check registered for ${activeRequest.customer || "Customer"} (${classificationLabel}). Target SLA: ${
              activeRequest.sampleRequiredDate ? formatErpDate(activeRequest.sampleRequiredDate) : "Flexible"
            }.`,
            timestamp: act.createdAt || activeRequest.createdAt || activeRequest.dateRequestCreated || "",
            badge: { text: "Intake", variant: "purple" },
          });
        } else if (act.action === "TASK_CLAIMED") {
          events.push({
            id: act.id,
            actorName: act.actorName || activeRequest.takenBySamp || "SAMP Lab",
            actorDepartment: act.actorDepartment || "SAMP Lab",
            action: act.action,
            title: "Task Claimed & Under Review",
            body: `Assigned to SAMP engineer ${act.actorName || activeRequest.takenBySamp} for technical evaluation.`,
            timestamp: act.createdAt || activeRequest.takenAtSamp || "",
            badge: { text: "Reviewing", variant: "teal" },
          });
        } else if (act.action === "SAMP_EVALUATED") {
          const verdict = payload.verdict || activeRequest.samplingFeasibilityResponse || "Yes";
          const remark = payload.remark || activeRequest.samplingFeasibilityRemark || "Technical evaluation completed.";
          events.push({
            id: act.id,
            actorName: act.actorName || activeRequest.samplingFeasibilityApprovedBy || "SAMP Team",
            actorDepartment: act.actorDepartment || "SAMP Lab",
            action: act.action,
            title: `Technical Verdict: ${verdict}`,
            body: remark,
            timestamp: act.createdAt || activeRequest.feasibilityClosedAt || "",
            badge: {
              text: verdict,
              variant: verdict === "Yes" ? "emerald" : verdict === "No" ? "rose" : "amber",
            },
          });
        } else if (act.action === "MARKETING_DECIDED") {
          const decision = payload.decision || activeRequest.marketingDecision || "Accepted";
          const remark = payload.remark || activeRequest.marketingDecisionRemark || "Commercial decision finalized.";
          events.push({
            id: act.id,
            actorName: act.actorName || activeRequest.marketingDecisionBy || "Marketing Authority",
            actorDepartment: act.actorDepartment || "Marketing",
            action: act.action,
            title: `Commercial Decision: ${decision}`,
            body: remark,
            timestamp: act.createdAt || activeRequest.marketingDecisionAt || "",
            badge: {
              text: decision,
              variant: decision === "Accepted" ? "emerald" : "rose",
            },
          });
        } else if (act.action === "CONVERTED_TO_SAMPLING") {
          const srNum = payload.sample_sr_number || activeRequest.convertedSrNumber || "";
          events.push({
            id: act.id,
            actorName: act.actorName || activeRequest.convertedBy || "Marketing",
            actorDepartment: act.actorDepartment || "Marketing",
            action: act.action,
            title: "Converted to Sampling Request",
            body: `Official sample request generated: ${srNum} for active prototyping.`,
            timestamp: act.createdAt || activeRequest.convertedAt || "",
            badge: { text: srNum || "Sampling", variant: "purple" },
          });
        } else if (act.action === "NOTE_ADDED") {
          events.push({
            id: act.id,
            actorName: act.actorName || "Team Member",
            actorDepartment: act.actorDepartment || "Operations",
            action: act.action,
            title: "Internal Note",
            body: payload.note || "",
            timestamp: act.createdAt || "",
            isNote: true,
            badge: { text: "Note", variant: "neutral" },
          });
        }
      });

    // 2. Fallback milestone synthesis if direct activities weren't recorded in legacy DB records
    if (!recordedActions.has("CREATED")) {
      events.unshift({
        id: "synth-created",
        actorName: activeRequest.createdBy || "Marketing Specialist",
        actorDepartment: "Marketing",
        action: "CREATED",
        title: "Request Logged into System",
        body: `Feasibility assessment created for ${activeRequest.customer || "Customer"} (${classificationLabel}).`,
        timestamp: activeRequest.createdAt || activeRequest.dateRequestCreated || "",
        badge: { text: "Intake", variant: "purple" },
      });
    }

    if (!recordedActions.has("TASK_CLAIMED") && activeRequest.takenBySamp) {
      events.push({
        id: "synth-claim",
        actorName: activeRequest.takenBySamp,
        actorDepartment: "SAMP Lab",
        action: "TASK_CLAIMED",
        title: "Task Claimed & Under Review",
        body: `Assigned to SAMP engineer ${activeRequest.takenBySamp} for evaluation.`,
        timestamp: activeRequest.takenAtSamp || activeRequest.createdAt || "",
        badge: { text: "Reviewing", variant: "teal" },
      });
    }

    if (!recordedActions.has("SAMP_EVALUATED") && activeRequest.samplingFeasibilityResponse) {
      events.push({
        id: "synth-evaluated",
        actorName: activeRequest.samplingFeasibilityApprovedBy || "SAMP Team",
        actorDepartment: "SAMP Lab",
        action: "SAMP_EVALUATED",
        title: `Technical Verdict: ${activeRequest.samplingFeasibilityResponse}`,
        body: activeRequest.samplingFeasibilityRemark || "Technical specifications verified feasible.",
        timestamp: activeRequest.feasibilityClosedAt || activeRequest.takenAtSamp || "",
        badge: {
          text: activeRequest.samplingFeasibilityResponse,
          variant:
            activeRequest.samplingFeasibilityResponse === "Yes"
              ? "emerald"
              : activeRequest.samplingFeasibilityResponse === "No"
              ? "rose"
              : "amber",
        },
      });
    }

    if (!recordedActions.has("MARKETING_DECIDED") && activeRequest.marketingDecision) {
      events.push({
        id: "synth-decision",
        actorName: activeRequest.marketingDecisionBy || "Marketing Authority",
        actorDepartment: "Marketing",
        action: "MARKETING_DECIDED",
        title: `Commercial Decision: ${activeRequest.marketingDecision}`,
        body: activeRequest.marketingDecisionRemark || "Commercial sign-off recorded.",
        timestamp: activeRequest.marketingDecisionAt || "",
        badge: {
          text: activeRequest.marketingDecision,
          variant: activeRequest.marketingDecision === "Accepted" ? "emerald" : "rose",
        },
      });
    }

    if (!recordedActions.has("CONVERTED_TO_SAMPLING") && activeRequest.convertedSrNumber) {
      events.push({
        id: "synth-converted",
        actorName: activeRequest.convertedBy || "Marketing",
        actorDepartment: "Marketing",
        action: "CONVERTED_TO_SAMPLING",
        title: "Converted to Sampling Request",
        body: `Official sample request generated: ${activeRequest.convertedSrNumber} for physical prototyping.`,
        timestamp: activeRequest.convertedAt || "",
        badge: { text: activeRequest.convertedSrNumber, variant: "purple" },
      });
    }

    // Sort newest first or chronological based on timestamp
    return events.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });
  }, [activeRequest, classificationLabel]);

  // Apply quick filter: all / audit / notes
  const filteredEvents = useMemo(() => {
    if (filterMode === "notes") return displayEvents.filter((e) => e.isNote);
    if (filterMode === "audit") return displayEvents.filter((e) => !e.isNote);
    return displayEvents;
  }, [displayEvents, filterMode]);

  const notesCount = useMemo(() => displayEvents.filter((e) => e.isNote).length, [displayEvents]);

  return (
    <div className="w-80 lg:w-96 border-l border-[#D8DADD] dark:border-white/10 bg-[#FBFBFC] dark:bg-[#161822] flex flex-col shrink-0 overflow-hidden text-xs">
      {/* ── Enterprise Chatter Top Header Bar ── */}
      <div className="p-3 border-b border-[#D8DADD] dark:border-white/10 bg-white dark:bg-zinc-900/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs"></span>
          <span className="font-bold text-xs text-neutral-800 dark:text-zinc-200">
            Audit Trail &amp; Chatter
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 dark:bg-zinc-800 dark:text-zinc-400 font-bold">
            {displayEvents.length}
          </span>
        </div>

        {/* Filter Toggle Pills */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-zinc-800/80 p-0.5 rounded text-[10.5px] font-mono">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-2 py-0.5 rounded transition ${
              filterMode === "all"
                ? "bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white font-bold shadow-2xs"
                : "text-neutral-500 hover:text-neutral-800 dark:text-zinc-400"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("audit")}
            className={`px-2 py-0.5 rounded transition ${
              filterMode === "audit"
                ? "bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white font-bold shadow-2xs"
                : "text-neutral-500 hover:text-neutral-800 dark:text-zinc-400"
            }`}
          >
            Audit
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("notes")}
            className={`px-2 py-0.5 rounded transition flex items-center gap-1 ${
              filterMode === "notes"
                ? "bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white font-bold shadow-2xs"
                : "text-neutral-500 hover:text-neutral-800 dark:text-zinc-400"
            }`}
          >
            <span>Notes</span>
            {notesCount > 0 && <span className="text-[9px] font-bold">({notesCount})</span>}
          </button>
        </div>
      </div>

      {/* ── Quick Note Composer (Enterprise "Log Note" Bar) ── */}
      {onAddNote && (
        <form
          onSubmit={handleSubmitNote}
          className="p-3 border-b border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-zinc-900/40 shrink-0"
        >
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-[#714B67]/10 text-[#714B67] dark:bg-purple-950/60 dark:text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0 uppercase mt-0.5">
              {(currentUser?.name || "ME").slice(0, 2)}
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Log internal note or directive..."
                className="w-full pl-2.5 pr-8 py-1.5 rounded border border-[#CED4DA] dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-800/60 text-xs text-neutral-900 dark:text-zinc-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#714B67] focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={!noteInput.trim() || isSubmittingNote}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-[#714B67] dark:hover:text-purple-300 disabled:opacity-30 transition cursor-pointer"
                title="Post Note (Enter)"
              >
                <Send className={`w-3.5 h-3.5 ${isSubmittingNote ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-neutral-400 font-mono">
            <span>Visible to Marketing &amp; SAMP Lab</span>
            <span>Press Enter to send</span>
          </div>
        </form>
      )}

      {/* ── Chronological Activity Stream ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 font-mono text-[11px]">
            No activity log entries found.
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isMarketing =
              evt.actorDepartment.toLowerCase().includes("marketing") ||
              evt.action === "CREATED" ||
              evt.action === "MARKETING_DECIDED";
            const isSamp =
              evt.actorDepartment.toLowerCase().includes("samp") ||
              evt.actorDepartment.toLowerCase().includes("sampling") ||
              evt.action === "TASK_CLAIMED" ||
              evt.action === "SAMP_EVALUATED";

            const avatarBg = evt.isNote
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              : isSamp
              ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300"
              : "bg-purple-100 text-[#714B67] dark:bg-purple-950/60 dark:text-purple-300";

            return (
              <div key={evt.id} className="flex items-start gap-2.5 group">
                {/* Avatar Icon / Initials */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 uppercase shadow-2xs ${avatarBg}`}
                  title={`${evt.actorName} (${evt.actorDepartment})`}
                >
                  {evt.actorName ? evt.actorName.slice(0, 2) : "OP"}
                </div>

                {/* Event Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <span className="font-bold text-xs text-neutral-900 dark:text-zinc-100 truncate">
                        {evt.actorName}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                        · {evt.actorDepartment}
                      </span>
                    </div>

                    <span
                      className="text-[10px] text-neutral-400 font-mono shrink-0"
                      title={evt.timestamp || ""}
                    >
                      {formatLogDate(evt.timestamp)}
                    </span>
                  </div>

                  {/* Action Title & Optional Badge */}
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[10.5px] font-mono font-semibold text-neutral-700 dark:text-zinc-300 uppercase">
                      {evt.title}
                    </span>

                    {evt.badge && (
                      <span
                        className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                          evt.badge.variant === "emerald"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300/80 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : evt.badge.variant === "rose"
                            ? "bg-rose-50 text-rose-700 border-rose-300/80 dark:bg-rose-950/60 dark:text-rose-300"
                            : evt.badge.variant === "amber"
                            ? "bg-amber-50 text-amber-700 border-amber-300/80 dark:bg-amber-950/60 dark:text-amber-300"
                            : evt.badge.variant === "teal"
                            ? "bg-sky-50 text-sky-700 border-sky-300/80 dark:bg-sky-950/60 dark:text-sky-300"
                            : evt.badge.variant === "purple"
                            ? "bg-purple-50 text-[#714B67] border-purple-300/80 dark:bg-purple-950/60 dark:text-purple-300"
                            : "bg-neutral-100 text-neutral-600 border-neutral-300 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {evt.badge.text}
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  {evt.body && (
                    <div
                      className={`mt-1 p-2 rounded text-[11px] leading-relaxed font-sans ${
                        evt.isNote
                          ? "bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-amber-950 dark:text-amber-200"
                          : "bg-white dark:bg-zinc-850/70 border border-[#E2E8F0] dark:border-zinc-800 text-neutral-800 dark:text-zinc-200"
                      }`}
                    >
                      {evt.body}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FeasibilityChatterFeed;
