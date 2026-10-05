import React from "react";

export interface StageStep {
  id: string;
  stepNumber?: string;
  label: string;
  count: number;
  sublabel?: string;
}

export interface ProcessStageRibbonProps {
  stages: StageStep[];
  selectedStageId: string;
  onSelectStage: (stageId: string) => void;
  className?: string;
}

export const ProcessStageRibbon: React.FC<ProcessStageRibbonProps> = ({
  stages,
  selectedStageId,
  onSelectStage,
  className = "",
}) => {
  const activeIndex = stages.findIndex((s) => s.id === selectedStageId);

  return (
    <div
      className={`border-b border-[#e2e8f0] dark:border-white/[0.08] bg-[#f8f9fa] dark:bg-[#0e1017] px-4 sm:px-6 py-2 overflow-x-auto select-none no-scrollbar flex items-center justify-between gap-4 ${className}`}
    >
      {/* Enterprise ERP Polygon Chevron Statusbar */}
      <div className="o_statusbar_status select-none shadow-2xs">
        {stages.map((stage, idx) => {
          const isSelected = selectedStageId === stage.id;
          const isDone = !isSelected && activeIndex > -1 && idx < activeIndex;

          const buttonClass = [
            "o_arrow_button",
            isSelected ? "active" : isDone ? "done" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onSelectStage(stage.id)}
              className={buttonClass}
              title={`${stage.label} (${stage.count} requests)`}
            >
              <span>{stage.label}</span>
              <span
                className={`ml-1.5 font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                  isSelected
                    ? "bg-white/25 text-white"
                    : isDone
                    ? "bg-[#017e84]/15 text-[#017e84] dark:bg-[#017e84]/30 dark:text-[#2dd4bf]"
                    : stage.count > 0
                    ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                    : "bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {stage.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="hidden lg:flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-[#714B67] dark:bg-purple-400" />
        <span>Navneet Enterprise Operational Flow</span>
      </div>
    </div>
  );
};

export default ProcessStageRibbon;
