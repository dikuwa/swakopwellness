"use client";

import { useCallback, useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { createPortal } from "react-dom";

type DatePickerProps = Omit<ComponentProps<"input">, "value" | "onChange" | "type" | "readOnly"> & {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  minDate?: string;
  maxDate?: string;
  showClear?: boolean;
};

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateString(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;
  return date;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isDateDisabled(date: Date, minDate?: string, maxDate?: string): boolean {
  if (minDate) {
    const min = parseDateString(minDate);
    if (min && date < min) return true;
  }
  if (maxDate) {
    const max = parseDateString(maxDate);
    if (max && date > max) return true;
  }
  return false;
}

function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();
  const days: Date[] = [];

  for (let i = 0; i < startingDay; i++) {
    const prevMonthDay = new Date(year, month, i - startingDay + 1);
    days.push(prevMonthDay);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const nextMonthDay = new Date(year, month + 1, i);
    days.push(nextMonthDay);
  }

  return days;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  required = false,
  name,
  id,
  minDate,
  maxDate,
  showClear = false,
  className = "",
  ...props
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(() => {
    const date = value ? parseDateString(value) : new Date();
    return date ? { year: date.getFullYear(), month: date.getMonth() } : { year: new Date().getFullYear(), month: new Date().getMonth() };
  });
  const [focusedDay, setFocusedDay] = useState<Date | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const monthYearId = `datepicker-monthyear-${id || uid}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = value ? parseDateString(value) : null;



  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const positionPopover = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const estimatedHeight = 340;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
      setPopoverStyle({
        top: rect.top - 4,
        left: rect.left,
        minWidth: rect.width,
        transform: "translateY(-100%)",
      });
    } else {
      setPopoverStyle({
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: rect.width,
      });
    }
  }, []);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!isOpen) return;
    positionPopover();
    const onScroll = () => positionPopover();
    const onResize = () => positionPopover();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen, positionPopover]);

  const openPopover = useCallback(() => {
    if (disabled) return;
    // Sync display month from current value when opening
    if (value) {
      const parsed = parseDateString(value);
      if (parsed) {
        setDisplayMonth({ year: parsed.getFullYear(), month: parsed.getMonth() });
      }
    }
    positionPopover();
    setIsOpen(true);
  }, [disabled, value, positionPopover]);

  const handleInputClick = useCallback(() => {
    openPopover();
  }, [openPopover]);

  const handleInputKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      openPopover();
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }, [openPopover]);

  const handleClear = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onChange?.("");
    setIsOpen(false);
  }, [onChange]);

  const handleDayClick = useCallback((day: Date) => {
    if (isDateDisabled(day, minDate, maxDate)) return;
    const formatted = formatDateForInput(day);
    onChange?.(formatted);
    setIsOpen(false);
    inputRef.current?.focus();
  }, [onChange, minDate, maxDate]);

  const handleKeyNavigation = useCallback((event: React.KeyboardEvent, day: Date) => {
    if (isDateDisabled(day, minDate, maxDate)) return;

    let newDay: Date | null = null;
    switch (event.key) {
      case "ArrowLeft":
        newDay = new Date(day);
        newDay.setDate(day.getDate() - 1);
        break;
      case "ArrowRight":
        newDay = new Date(day);
        newDay.setDate(day.getDate() + 1);
        break;
      case "ArrowUp":
        newDay = new Date(day);
        newDay.setDate(day.getDate() - 7);
        break;
      case "ArrowDown":
        newDay = new Date(day);
        newDay.setDate(day.getDate() + 7);
        break;
      case "Home":
        newDay = new Date(day);
        newDay.setDate(day.getDate() - day.getDay());
        break;
      case "End":
        newDay = new Date(day);
        newDay.setDate(day.getDate() + (6 - day.getDay()));
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        handleDayClick(day);
        return;
      default:
        return;
    }

    if (newDay) {
      event.preventDefault();
      setFocusedDay(newDay);
      if (newDay.getMonth() !== displayMonth.month || newDay.getFullYear() !== displayMonth.year) {
        setDisplayMonth({ year: newDay.getFullYear(), month: newDay.getMonth() });
      }
    }
  }, [displayMonth, handleDayClick, minDate, maxDate]);

  const prevMonth = useCallback(() => {
    setDisplayMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  }, []);

  const nextMonth = useCallback(() => {
    setDisplayMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  }, []);

  const monthName = new Date(displayMonth.year, displayMonth.month).toLocaleDateString("en-NA", { month: "long", year: "numeric" });
  const days = getMonthDays(displayMonth.year, displayMonth.month);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const popoverContent = (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className="fixed z-50 rounded-2xl border border-border bg-surface p-3 shadow-[0_20px_40px_oklch(0.235_0.025_158_/_0.15)]"
      role="dialog"
      aria-label="Choose date"
    >
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          aria-label="Previous month"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-surface-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <span id={monthYearId} className="font-semibold text-foreground">
          {monthName}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="Next month"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-surface-muted transition-colors"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
        {weekdays.map((day) => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1" role="grid" aria-labelledby={monthYearId}>
        {days.map((day, index) => {
          const isCurrentMonth = day.getMonth() === displayMonth.month;
          const isToday = isSameDay(day, today);
          const isSelected = !!selectedDate && isSameDay(day, selectedDate);
          const isDisabled = isDateDisabled(day, minDate, maxDate);
          const isFocused = focusedDay && isSameDay(day, focusedDay);

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDayClick(day)}
              onKeyDown={(e) => handleKeyNavigation(e, day)}
              disabled={isDisabled || !isCurrentMonth}
              tabIndex={isFocused || (isSelected && !focusedDay) ? 0 : -1}
              onFocus={() => setFocusedDay(day)}
              onBlur={() => setFocusedDay(null)}
              aria-label={day.toLocaleDateString("en-NA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              aria-selected={isSelected}
              aria-disabled={isDisabled || !isCurrentMonth}
              aria-current={isToday ? "date" : undefined}
              className={`relative h-9 w-full rounded-xl text-sm font-medium transition-all duration-150 ${
                isDisabled || !isCurrentMonth
                  ? "text-muted-foreground/30 cursor-not-allowed"
                  : isSelected
                  ? "bg-primary text-primary-foreground shadow-[0_2px_8px_oklch(0.355_0.074_159_/_0.25)]"
                  : isToday
                  ? "text-primary font-semibold ring-2 ring-primary/30"
                  : "text-foreground hover:bg-surface-muted"
              } ${isFocused ? "ring-2 ring-primary/50" : ""}`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      {(showClear || value) && (
        <button
          type="button"
          onClick={handleClear}
          className="mt-3 w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );

  const displayValue = value ? (() => {
    const parsed = parseDateString(value);
    if (!parsed) return "";
    return parsed.toLocaleDateString("en-NA", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "/");
  })() : "";

  return (
    <div className="relative" style={{ zIndex: isOpen ? 50 : "auto" }}>
      {/* Hidden input to submit the ISO date value with forms */}
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      <div className="relative">
        <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          id={id}
          onClick={handleInputClick}
          onKeyDown={handleInputKeyDown}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-required={required || undefined}
          className={`h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm transition-colors duration-200 placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/10 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
          {...props}
        />
        {(showClear || value) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear date"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {isOpen && createPortal(popoverContent, document.body)}
    </div>
  );
}