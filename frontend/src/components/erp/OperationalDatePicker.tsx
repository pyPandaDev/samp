import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  X,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
import {
  isSunday,
  isEvenSaturday,
  getSaturdayOccurrence,
  getHolidayInfo,
  formatYMD,
  parseYMD,
  formatDisplayDate,
  isDateRestricted,
  getNextWorkingDate,
} from "@/lib/holidayUtils";
import { cn } from "@/lib/utils";

export interface OperationalDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  hasError?: boolean;
  errorMessage?: string;
  label?: string;
  helperText?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const OperationalDatePicker: React.FC<OperationalDatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Select required target date...",
  disabled = false,
  required = false,
  className,
  id,
  name,
  hasError = false,
  errorMessage,
  label,
  helperText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rejectedAttemptMessage, setRejectedAttemptMessage] = useState<string | null>(null);

  // Parse current selected date
  const selectedDate = useMemo(() => parseYMD(value), [value]);

  // Current view year & month in the calendar popover
  const [viewYear, setViewYear] = useState<number>(() => {
    return selectedDate ? selectedDate.getFullYear() : new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    return selectedDate ? selectedDate.getMonth() : new Date().getMonth();
  });

  // Sync calendar view month when a new valid value is supplied
  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [selectedDate]);

  // Dismiss dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Clear transient reject attempt message after 3.5s
  useEffect(() => {
    if (rejectedAttemptMessage) {
      const t = setTimeout(() => setRejectedAttemptMessage(null), 3500);
      return () => clearTimeout(t);
    }
  }, [rejectedAttemptMessage]);

  // Check if selected value itself is accidentally a restricted date (e.g. from draft / initial seed)
  const isSelectedValueHoliday = useMemo(() => {
    return selectedDate ? isDateRestricted(selectedDate) : false;
  }, [selectedDate]);

  const selectedValueHolidayInfo = useMemo(() => {
    return selectedDate ? getHolidayInfo(selectedDate) : null;
  }, [selectedDate]);

  // Navigate months
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Generate calendar grid days
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: Array<{
      date: Date;
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isHoliday: boolean;
      holidayLabel?: string;
      isSundayDay: boolean;
      isEvenSaturdayDay: boolean;
      saturdayOcc?: number;
      isDisabled: boolean;
      disabledReason?: string;
    }> = [];

    const todayStr = formatYMD(new Date());
    const minD = minDate ? parseYMD(minDate) : null;
    const maxD = maxDate ? parseYMD(maxDate) : null;

    // Previous month padding days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonthIdx = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const d = new Date(prevYear, prevMonthIdx, dayNum);
      const dStr = formatYMD(d);
      const holiday = getHolidayInfo(d);

      days.push({
        date: d,
        dateStr: dStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: value === dStr,
        isHoliday: holiday.isHoliday,
        holidayLabel: holiday.label,
        isSundayDay: isSunday(d),
        isEvenSaturdayDay: isEvenSaturday(d),
        saturdayOcc: getSaturdayOccurrence(d),
        isDisabled: true, // padding days disabled
        disabledReason: "Outside current month",
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const d = new Date(viewYear, viewMonth, dayNum);
      const dStr = formatYMD(d);
      const holiday = getHolidayInfo(d);

      let isDisabled = false;
      let disabledReason: string | undefined;

      if (holiday.isHoliday) {
        isDisabled = true;
        disabledReason = holiday.label;
      } else if (minD && d < minD) {
        isDisabled = true;
        disabledReason = `Cannot select dates before ${minDate}`;
      } else if (maxD && d > maxD) {
        isDisabled = true;
        disabledReason = `Cannot select dates after ${maxDate}`;
      }

      days.push({
        date: d,
        dateStr: dStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        isSelected: value === dStr,
        isHoliday: holiday.isHoliday,
        holidayLabel: holiday.label,
        isSundayDay: isSunday(d),
        isEvenSaturdayDay: isEvenSaturday(d),
        saturdayOcc: getSaturdayOccurrence(d),
        isDisabled,
        disabledReason,
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remainingCells = (7 - (days.length % 7)) % 7;
    const totalNeeded = days.length + remainingCells < 35 ? 35 - days.length : remainingCells;
    for (let dayNum = 1; dayNum <= totalNeeded; dayNum++) {
      const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      const d = new Date(nextYear, nextMonthIdx, dayNum);
      const dStr = formatYMD(d);
      const holiday = getHolidayInfo(d);

      days.push({
        date: d,
        dateStr: dStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: value === dStr,
        isHoliday: holiday.isHoliday,
        holidayLabel: holiday.label,
        isSundayDay: isSunday(d),
        isEvenSaturdayDay: isEvenSaturday(d),
        saturdayOcc: getSaturdayOccurrence(d),
        isDisabled: true, // padding days disabled
        disabledReason: "Outside current month",
      });
    }

    return days;
  }, [viewYear, viewMonth, value, minDate, maxDate]);

  // Handle day click
  const handleDaySelect = (day: typeof calendarGrid[0]) => {
    if (day.isDisabled || day.isHoliday || !day.isCurrentMonth) {
      if (day.isHoliday) {
        setRejectedAttemptMessage(
          `Selection Restricted: ${day.holidayLabel} is an off-day. Only active working days are allowed.`
        );
      }
      return;
    }

    onChange(day.dateStr);
    setRejectedAttemptMessage(null);
    setIsOpen(false);
  };

  // Jump to Next Working Day action
  const handleSelectNextWorkingDay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextWorking = getNextWorkingDate(new Date(), 1);
    onChange(nextWorking);
    const parsed = parseYMD(nextWorking);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
    setIsOpen(false);
  };

  // Clear date
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Main Interactive Trigger */}
      <div
        id={id}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          "w-full h-8 px-2.5 rounded-md border flex items-center justify-between text-xs transition-colors cursor-pointer select-none",
          disabled && "opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800",
          !disabled && "bg-white dark:bg-zinc-900/90 hover:border-zinc-400 dark:hover:border-zinc-600",
          isSelectedValueHoliday || hasError
            ? "border-rose-500 bg-rose-50/20 text-rose-900 dark:text-rose-200 focus:ring-1 focus:ring-rose-500"
            : "border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67]/20"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <CalendarIcon
            className={cn(
              "w-4 h-4 shrink-0",
              isSelectedValueHoliday || hasError
                ? "text-rose-500"
                : "text-zinc-400 transition-colors dark:text-zinc-500 group-hover:text-[#714B67] dark:group-hover:text-purple-300"
            )}
          />
          {value ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-mono font-medium text-[12px]">{value}</span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                ({formatDisplayDate(value)})
              </span>
              {isSelectedValueHoliday && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
                  ⚠️ HOLIDAY ({selectedValueHolidayInfo?.badge})
                </span>
              )}
            </div>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-500 font-normal truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear date"
              className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[10px] text-zinc-400 font-mono">📅</span>
        </div>
      </div>

      {/* Hidden input to maintain native form compatibility if needed */}
      <input type="hidden" name={name} value={value} required={required} />

      {/* Holiday / Error banner below input */}
      {isSelectedValueHoliday && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>
            {selectedValueHolidayInfo?.label || "Plant Holiday"}: This date is restricted. Please select an active working day.
          </span>
        </div>
      )}

      {errorMessage && !isSelectedValueHoliday && (
        <p className="mt-1 text-[11px] text-rose-500 font-medium">{errorMessage}</p>
      )}

      {helperText && !isSelectedValueHoliday && !errorMessage && (
        <p className="text-[10px] text-zinc-400 font-mono mt-1">{helperText}</p>
      )}

      {/* Calendar Popover Modal */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 left-0 w-[310px] p-3 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0f1118] shadow-xl text-zinc-900 dark:text-zinc-100 select-none animate-in fade-in zoom-in-95 duration-100"
          style={{ minWidth: "300px" }}
        >
          {/* Calendar Header: Navigation & Month Selector */}
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-zinc-100 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
              <span className="font-medium text-[13px]">{MONTH_NAMES[viewMonth]}</span>
              <span className="font-mono text-zinc-500 dark:text-zinc-400">{viewYear}</span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Restriction Notice Banner (if user attempted to click holiday) */}
          {rejectedAttemptMessage && (
            <div className="mb-2 p-2 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-[11px] leading-tight flex items-start gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
              <span>{rejectedAttemptMessage}</span>
            </div>
          )}

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_NAMES.map((w, idx) => {
              const isSundayCol = idx === 0;
              const isSaturdayCol = idx === 6;
              return (
                <div
                  key={w}
                  className={cn(
                    "text-[10px] font-mono font-bold uppercase tracking-wider py-0.5",
                    isSundayCol
                      ? "text-rose-600 dark:text-rose-400"
                      : isSaturdayCol
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-zinc-400 dark:text-zinc-500"
                  )}
                  title={
                    isSundayCol
                      ? "Sundays: Weekly Plant Holidays (OFF)"
                      : isSaturdayCol
                      ? "Saturdays: 2nd & 4th are Off, 1st & 3rd are Working"
                      : undefined
                  }
                >
                  {w}
                </div>
              );
            })}
          </div>

          {/* Calendar Grid of Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarGrid.map((day, idx) => {
              const {
                dayNumber,
                isCurrentMonth,
                isToday,
                isSelected,
                isHoliday,
                holidayLabel,
                isSundayDay,
                isEvenSaturdayDay,
                isDisabled,
                disabledReason,
                dateStr,
              } = day;

              if (!isCurrentMonth) {
                return (
                  <div
                    key={`pad-${idx}`}
                    className="h-8 rounded flex items-center justify-center text-[11px] text-zinc-300 dark:text-zinc-700 font-mono opacity-40 cursor-not-allowed select-none"
                  >
                    {dayNumber}
                  </div>
                );
              }

              // Holiday cell styling (Sundays and 2nd/4th Saturdays)
              if (isHoliday) {
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => handleDaySelect(day)}
                    title={`Restricted: ${holidayLabel} (Plant Off)`}
                    className={cn(
                      "relative h-8 rounded flex flex-col items-center justify-center transition-colors duration-100 cursor-not-allowed",
                      "bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50",
                      "text-rose-600 dark:text-rose-400 hover:border-rose-400 active:scale-95"
                    )}
                  >
                    <span className="text-[11px] font-mono font-bold line-through opacity-85 leading-none">
                      {dayNumber}
                    </span>
                    <span className="text-[7.5px] font-mono font-black uppercase text-rose-700 dark:text-rose-300 bg-rose-200/80 dark:bg-rose-900/80 px-1 py-0.2 rounded-xs leading-none mt-0.5 tracking-tighter">
                      OFF
                    </span>
                  </button>
                );
              }

              // Normal Working Day cell styling
              const isWorkingSaturday = day.date.getDay() === 6;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleDaySelect(day)}
                  disabled={isDisabled}
                  title={
                    isWorkingSaturday
                      ? `Working Saturday (${day.saturdayOcc === 1 ? "1st" : day.saturdayOcc === 3 ? "3rd" : "5th"} Saturday of month)`
                      : disabledReason || `Working Day (${dateStr})`
                  }
                  className={cn(
                    "relative h-8 rounded flex flex-col items-center justify-center text-[11.5px] font-mono transition-colors",
                    isDisabled &&
                      "opacity-35 cursor-not-allowed text-zinc-400 dark:text-zinc-600 bg-zinc-50 dark:bg-zinc-900/30",
                    !isDisabled && !isSelected && [
                      "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer",
                      isToday && "border border-[#714B67]/70 font-semibold text-[#714B67] dark:text-purple-300",
                    ],
                    isSelected &&
                      "bg-[#714B67] text-white font-bold shadow-xs ring-2 ring-[#714B67]/30 cursor-pointer"
                  )}
                >
                  <span className="leading-none">{dayNumber}</span>
                  {isWorkingSaturday && !isSelected && (
                    <span className="text-[7px] font-sans text-emerald-600 dark:text-emerald-400 font-bold leading-none mt-0.5">
                      WORK
                    </span>
                  )}
                  {isToday && !isSelected && !isWorkingSaturday && (
                    <span className="mt-0.5 h-1 w-1 rounded-full bg-[#714B67] dark:bg-purple-300" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Operational Calendar Legend */}
          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-white/[0.06] space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <span className="inline-block px-1 py-0.2 rounded text-[7.5px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                  OFF
                </span>
                <span>Sundays & 2nd/4th Saturdays (Weekly Off)</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>1st, 3rd, 5th Sat & Mon–Fri (Open)</span>
              </div>

              <button
                type="button"
                onClick={handleSelectNextWorkingDay}
                className="flex items-center gap-1 text-[10px] font-medium text-[#714B67] hover:underline dark:text-purple-300"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Next Working Day</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalDatePicker;
