import React, { useState, useMemo } from "react";
import { SampleRequestItem, ProgramActivityItem } from "../../types";
import { formatErpDate, formatLogDate } from "../../utils/dateUtils";
import {
  MessageSquare,
  Clock,
  Highlighter,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  Send,
  User,
  ShieldCheck,
  Sparkles,
  Filter,
  Plus,
  Trash2,
  FileText,
} from "lucide-react";
import { UserProfile } from "@/features/auth";

export interface ProgramMaterialReviewItem {
  id: number | string;
  materialType?: string;
  supplierName?: string;
  grade?: string;
  colorVariant?: string;
  caliperWt?: string;
  quantity?: string;
  unit?: string;
  remark?: string;
  highlightedCols: string[];
  sampRemarkText: string;
  createdAt?: string;
  isNewAdded?: boolean;
}

export interface ProgramChatterFeedProps {
  request: SampleRequestItem;
  materialRows: ProgramMaterialReviewItem[];
  isSamplingMode?: boolean;
  onAddNote?: (note: string) => Promise<void>;
  currentUser?: UserProfile | null;
}

// Calculate if a material row was added within the last 1 day (24 hours)
export function isMaterialAddedRecently(createdAt?: string | Date | null): boolean {
  if (!createdAt) return false;
  try {
    const d = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
    const diffMs = Date.now() - d.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return diffMs >= -60000 && diffMs <= oneDayMs;
  } catch {
    return false;
  }
}

interface TimelineEvent {
  id: string | number;
  actorName: string;
  actorDepartment: string;
  action: string;
  title: string;
  body: string | React.ReactNode;
  timestamp: string;
  badge?: {
    text: string;
    variant: "purple" | "teal" | "amber" | "emerald" | "rose" | "neutral";
  };
  isNote?: boolean;
}

export const ProgramChatterFeed: React.FC<ProgramChatterFeedProps> = ({
  request,
  materialRows,
  isSamplingMode,
  onAddNote,
  currentUser,
}) => {
  const [filterMode, setFilterMode] = useState<"all" | "audit" | "notes">("all");
  const [isComposingNote, setIsComposingNote] = useState(false);
  const [quickNote, setQuickNote] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickNote.trim();
    if (!clean || isSubmittingNote || !onAddNote) return;

    setIsSubmittingNote(true);
    try {
      await onAddNote(clean);
      setQuickNote("");
      setIsComposingNote(false);
    } catch (err) {
      console.error("Failed to post chatter note:", err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const flaggedRows = useMemo(
    () => materialRows.filter((r) => r.highlightedCols.length > 0 || r.sampRemarkText.trim()),
    [materialRows]
  );

  const totalFlagsCount = useMemo(
    () => materialRows.reduce((acc, r) => acc + r.highlightedCols.length, 0),
    [materialRows]
  );

  // Compile real database activities into timeline events
  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];
    const activities: ProgramActivityItem[] = Array.isArray(request.activities)
      ? (request.activities as unknown as ProgramActivityItem[])
      : [];


    const hasCreatedAction = activities.some((a) => a.action === "CREATED");

    // 1. Process persisted DB activities
    activities.forEach((act) => {
      const payload = act.payload || {};

      if (act.action === "CREATED") {
        events.push({
          id: act.id,
          actorName: act.actorName || request.createdBy || "Marketing",
          actorDepartment: act.actorDepartment || "Marketing",
          action: act.action,
          title: "Program Campaign Registered",
          body: `Seasonal Program "${payload.program_campaign_title || request.programName || "Program"}" initialized for account ${
            payload.customer_name || request.customer
          } with ${payload.material_count || materialRows.length} material specifications allocated to plant ${
            request.targetPlant || "Plant 1"
          }.`,
          timestamp: act.createdAt || request.createdAt || "",
          badge: { text: "Created", variant: "purple" },
        });
      } else if (act.action === "NOTE_POSTED") {
        events.push({
          id: act.id,
          actorName: act.actorName || "Team Member",
          actorDepartment: act.actorDepartment || (isSamplingMode ? "SAMP Lab" : "Marketing"),
          action: act.action,
          title: "Internal Note Logged",
          body: payload.note || "",
          timestamp: act.createdAt,
          isNote: true,
          badge: {
            text: act.actorDepartment?.toLowerCase().includes("samp") ? "SAMP Note" : "Marketing Note",
            variant: act.actorDepartment?.toLowerCase().includes("samp") ? "teal" : "purple",
          },
        });
      } else if (act.action === "STATUS_UPDATED") {
        events.push({
          id: act.id,
          actorName: act.actorName || "System",
          actorDepartment: act.actorDepartment || "System",
          action: act.action,
          title: "Program Status Advanced",
          body: `Stage changed from "${payload.old_status || "—"}" to "${payload.new_status || request.status}".`,
          timestamp: act.createdAt,
          badge: { text: "Status Update", variant: "emerald" },
        });
      } else if (act.action === "MATERIAL_ADDED") {
        events.push({
          id: act.id,
          actorName: act.actorName || "Marketing Team",
          actorDepartment: act.actorDepartment || "Marketing",
          action: act.action,
          title: "Material Specification Line Added",
          body: `Added matrix row: ${payload.material_type || "Material"} ${
            payload.supplier_name ? `(${payload.supplier_name})` : ""
          } — Qty: ${payload.quantity || "—"}.`,
          timestamp: act.createdAt,
          badge: { text: "Matrix Update", variant: "neutral" },
        });
      } else if (act.action === "MATERIAL_DELETED") {
        events.push({
          id: act.id,
          actorName: act.actorName || "Operator",
          actorDepartment: act.actorDepartment || "Marketing",
          action: act.action,
          title: "Material Specification Removed",
          body: `Removed specification row #${payload.material_id} (${payload.material_type || "item"}).`,
          timestamp: act.createdAt,
          badge: { text: "Line Removed", variant: "rose" },
        });
      } else if (act.action === "SAMP_REMARK_UPDATED" || act.action === "SAMP_REMARKS_UPDATED") {
        events.push({
          id: act.id,
          actorName: act.actorName || "SAMP Lab Specialist",
          actorDepartment: act.actorDepartment || "SAMP Lab",
          action: act.action,
          title: "Technical Review Remarks Recorded",
          body:
            act.action === "SAMP_REMARK_UPDATED"
              ? `Updated remarks on row #${payload.material_id} (${payload.material_type || "Material"}): "${payload.new_remark || "Remark cleared"}"`
              : `Batch updated technical evaluation remarks across ${payload.updated_count || 1} material lines.`,
          timestamp: act.createdAt,
          badge: { text: "Lab Review", variant: "teal" },
        });
      } else if (act.action === "UPDATED") {
        events.push({
          id: act.id,
          actorName: act.actorName || "Operator",
          actorDepartment: act.actorDepartment || "Marketing",
          action: act.action,
          title: "Program Metadata Modified",
          body: `Updated request parameters: ${(payload.fields || []).join(", ") || "details"}.`,
          timestamp: act.createdAt,
          badge: { text: "Edit", variant: "neutral" },
        });
      }
    });

    // 2. Synthesize baseline creation event if no persisted CREATED activity exists yet
    if (!hasCreatedAction) {
      events.unshift({
        id: "baseline-create",
        actorName: request.createdBy || "Marketing Specialist",
        actorDepartment: "Marketing",
        action: "CREATED",
        title: "Program Request Registered",
        body: `Seasonal Program "${request.programName || "Seasonal Program"}" registered for account ${
          request.customer
        } for season ${request.programYear || "2026-2027"} with ${
          materialRows.length
        } material specifications allocated to plant ${request.targetPlant || "Plant 1"}.`,
        timestamp: request.createdAt || request.dateRequestCreated || "",
        badge: { text: "Created", variant: "purple" },
      });
    }

    // Sort descending by timestamp (newest first for clean chatter feed)
    return events.sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    });
  }, [request, materialRows, isSamplingMode]);

  // Filtered list
  const filteredEvents = useMemo(() => {
    if (filterMode === "notes") {
      return timelineEvents.filter((e) => e.isNote);
    }
    if (filterMode === "audit") {
      return timelineEvents.filter((e) => !e.isNote);
    }
    return timelineEvents;
  }, [timelineEvents, filterMode]);

  const badgeStyles = {
    purple: "bg-purple-50 text-[#714B67] dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    teal: "bg-teal-50 text-[#017E84] dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    amber: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    emerald: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    rose: "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    neutral: "bg-neutral-100 text-neutral-700 dark:bg-zinc-800 dark:text-zinc-300 border-neutral-300 dark:border-zinc-700",
  };

  return (
    <div className="w-80 lg:w-96 h-full border-l border-[#D8DADD] dark:border-white/10 bg-white dark:bg-[#161822] flex flex-col shrink-0 overflow-hidden">
      {/* ── 1. Header Bar with Filter Tabs ── */}
      <div className="p-3 border-b border-[#D8DADD] dark:border-white/10 bg-[#FBFBFC] dark:bg-zinc-900/60 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-xs text-neutral-800 dark:text-zinc-200">
              Audit Trail &amp; Chatter
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
            Database Log
          </span>
        </div>

        {/* Filter Chips & Log Note Trigger */}
        <div className="flex items-center justify-between gap-1 pt-1">
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-zinc-800/80 p-0.5 rounded text-[11px]">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                filterMode === "all"
                  ? "bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white shadow-2xs font-semibold"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-zinc-300"
              }`}
            >
              All ({timelineEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("notes")}
              className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                filterMode === "notes"
                  ? "bg-white dark:bg-zinc-700 text-[#714B67] dark:text-purple-300 shadow-2xs font-semibold"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-zinc-300"
              }`}
            >
              Notes
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("audit")}
              className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                filterMode === "audit"
                  ? "bg-white dark:bg-zinc-700 text-[#017E84] dark:text-teal-300 shadow-2xs font-semibold"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-zinc-300"
              }`}
            >
              Audit
            </button>
          </div>

          {onAddNote && (
            <button
              type="button"
              onClick={() => setIsComposingNote((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#714B67] hover:bg-[#5B3C53] text-white text-[11px] font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-3 h-3" />
              <span>Log Note</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Live Note Composer Drawer ── */}
      {isComposingNote && onAddNote && (
        <form
          onSubmit={handlePostNote}
          className="p-3 border-b border-neutral-200 dark:border-zinc-800 bg-purple-50/30 dark:bg-purple-950/20 space-y-2 shrink-0 animate-fadeIn"
        >
          <div className="flex items-center justify-between text-[11px] text-neutral-600 dark:text-zinc-400">
            <span className="font-semibold flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-[#714B67]" />
              Post Internal Technical / Commercial Note
            </span>
            <span className="text-[10px] text-neutral-400">Ctrl+Enter to post</span>
          </div>
          <textarea
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                handlePostNote(e);
              }
            }}
            placeholder="Type your communication or lab note here..."
            rows={3}
            autoFocus
            className="w-full p-2 text-xs rounded border border-[#CED4DA] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-zinc-100 placeholder:text-neutral-400 outline-none focus:ring-1 focus:ring-[#714B67] transition"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsComposingNote(false);
                setQuickNote("");
              }}
              className="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-zinc-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!quickNote.trim() || isSubmittingNote}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#017E84] hover:bg-[#00666A] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmittingNote ? <Clock className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              <span>{isSubmittingNote ? "Posting..." : "Post Note"}</span>
            </button>
          </div>
        </form>
      )}

      {/* ── 3. Flagged Review Summary Card (when items are flagged) ── */}
      {flaggedRows.length > 0 && (
        <div className="p-3 mx-3 mt-3 rounded border border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20 shrink-0">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-1.5">
              <Highlighter className="w-3.5 h-3.5 text-amber-600" />
              <span>Active Review Flags</span>
            </div>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-800 text-amber-950 dark:text-amber-100">
              {totalFlagsCount} Flags / {flaggedRows.length} Lines
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-neutral-600 dark:text-zinc-400 space-y-1">
            {flaggedRows.slice(0, 3).map((r, i) => (
              <div key={r.id} className="truncate">
                <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                  #{i + 1} {r.materialType || "Item"}:
                </span>{" "}
                {r.highlightedCols.length > 0 && (
                  <span className="text-amber-700 dark:text-amber-400 font-mono font-medium">
                    [{r.highlightedCols.join(", ")}]
                  </span>
                )}{" "}
                {r.sampRemarkText && <span className="italic">"{r.sampRemarkText}"</span>}
              </div>
            ))}
            {flaggedRows.length > 3 && (
              <div className="text-[10px] text-amber-800 dark:text-amber-400 font-medium">
                + {flaggedRows.length - 3} more flagged line(s) in matrix table
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 4. Main Timeline Feed ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-neutral-400 dark:text-zinc-500 space-y-1">
            <Clock className="w-6 h-6 mx-auto stroke-1" />
            <div className="text-xs font-medium">No activity records match this filter</div>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const isNote = event.isNote;
            const deptLower = event.actorDepartment?.toLowerCase() || "";
            const isSamp = deptLower.includes("samp");
            const isMarketing = deptLower.includes("marketing");

            const avatarBg = isNote
              ? isSamp
                ? "bg-teal-100 text-[#017E84] dark:bg-teal-950/60 dark:text-teal-300"
                : "bg-purple-100 text-[#714B67] dark:bg-purple-950/60 dark:text-purple-300"
              : isSamp
              ? "bg-teal-50 text-[#017E84] dark:bg-teal-950/40 dark:text-teal-300"
              : isMarketing
              ? "bg-purple-50 text-[#714B67] dark:bg-purple-950/40 dark:text-purple-300"
              : "bg-neutral-100 text-neutral-700 dark:bg-zinc-800 dark:text-zinc-300";

            const initials = (event.actorName || "OP")
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={event.id}
                className="flex items-start gap-2.5 animate-fadeIn"
              >
                {/* Avatar Icon */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 uppercase border border-black/5 dark:border-white/5 ${avatarBg}`}
                  title={`${event.actorName} (${event.actorDepartment})`}
                >
                  {initials}
                </div>

                {/* Event Card Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-xs text-neutral-900 dark:text-zinc-100 truncate">
                        {event.actorName}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        • {event.actorDepartment}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                      {formatLogDate(event.timestamp)}
                    </span>
                  </div>

                  {/* Title & Badge */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-semibold text-neutral-700 dark:text-zinc-300">
                      {event.title}
                    </span>
                    {event.badge && (
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase ${
                          badgeStyles[event.badge.variant] || badgeStyles.neutral
                        }`}
                      >
                        {event.badge.text}
                      </span>
                    )}
                  </div>

                  {/* Body Text */}
                  {isNote ? (
                    <div className="mt-1 p-2 rounded bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 text-[11px] text-neutral-800 dark:text-zinc-200 leading-snug whitespace-pre-wrap">
                      "{event.body}"
                    </div>
                  ) : (
                    <div className="mt-1 text-[11px] text-neutral-600 dark:text-zinc-400 leading-snug">
                      {event.body}
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

export default ProgramChatterFeed;
