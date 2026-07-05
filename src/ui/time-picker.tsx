"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import { Clock, ChevronUp, ChevronDown, X } from "lucide-react";
import { createPortal } from "react-dom";

type TimePickerProps = ComponentProps<"input"> & {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  minTime?: string;
  maxTime?: string;
  stepMinutes?: number;
  showClear?: boolean;
};

function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return { hours, minutes };
}

function formatTimeForInput(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatTimeForDisplay(timeStr: string): string {
  const parsed = parseTimeString(timeStr);
  if (!parsed) return "";
  const { hours, minutes } = parsed;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${String(displayHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
}

function isTimeInRange(timeStr: string, minTime?: string, maxTime?: string): boolean {
  const time = parseTimeString(timeStr);
  if (!time) return false;
  const minutes = time.hours * 60 + time.minutes;

  if (minTime) {
    const min = parseTimeString(minTime);
    if (min && minutes < min.hours * 60 + min.minutes) return false;
  }
  if (maxTime) {
    const max = parseTimeString(maxTime);
    if (max && minutes > max.hours * 60 + max.minutes) return false;
  }
  return true;
}

function generateTimeSlots(minTime?: string, maxTime?: string, stepMinutes = 30): string[] {
  const slots: string[] = [];

  const min = minTime ? parseTimeString(minTime) : { hours: 0, minutes: 0 };
  const max = maxTime ? parseTimeString(maxTime) : { hours: 23, minutes: 59 };

  let currentMinutes = min.hours * 60 + min.minutes;
  const maxMinutes = max.hours * 60 + max.minutes;

  while (currentMinutes <= maxMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    slots.push(formatTimeForInput(hours, minutes));
    currentMinutes += stepMinutes;
  }

  return slots;
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  disabled = false,
  required = false,
  name,
  id,
  minTime,
  maxTime,
  stepMinutes = 30,
  showClear = false,
  className = "",
  ...props
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const timeSlots = useMemo(() => generateTimeSlots(minTime, maxTime, stepMinutes), [minTime, maxTime, stepMinutes]);

  const selectedIndex = value ? timeSlots.indexOf(value) : -1;

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

  const handleInputClick = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [disabled, selectedIndex]);

  const handleInputKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      if (!disabled) {
        setIsOpen(true);
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }, [disabled, selectedIndex]);

  const handleOptionClick = useCallback((time: string) => {
    onChange?.(time);
    setIsOpen(false);
    inputRef.current?.focus();
  }, [onChange]);

  const handleOptionKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, timeSlots.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        setHighlightedIndex(0);
        break;
      case "End":
        event.preventDefault();
        setHighlightedIndex(timeSlots.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        handleOptionClick(timeSlots[index]);
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.focus();
        break;
    }
  }, [timeSlots, handleOptionClick]);

  const handleClear = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onChange?.("");
    setIsOpen(false);
  }, [onChange]);

  useEffect(() => {
    if (isOpen && optionsRef.current && highlightedIndex >= 0) {
      const option = optionsRef.current.children[highlightedIndex] as HTMLElement;
      if (option) {
        option.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, highlightedIndex]);

  const popoverContent = (
    <div
      ref={popoverRef}
      className="fixed z-50 rounded-2xl border border-border bg-surface p-2 shadow-[0_20px_40px_oklch(0.235_0.025_158_/_0.15)] max-h-64 overflow-hidden"
      role="dialog"
      aria-label="Choose time"
    >
      <div ref={optionsRef} className="grid gap-1 max-h-56 overflow-y-auto pr-1">
        {timeSlots.map((time, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleOptionClick(time)}
            onKeyDown={(e) => handleOptionKeyDown(e, index)}
            tabIndex={index === highlightedIndex ? 0 : -1}
            onFocus={() => setHighlightedIndex(index)}
            aria-selected={index === selectedIndex}
            className={`w-full h-10 rounded-xl px-3 text-sm font-medium text-left transition-all duration-150 ${
              index === selectedIndex
                ? "bg-primary text-primary-foreground"
                : index === highlightedIndex
                ? "bg-surface-muted text-foreground"
                : "text-foreground hover:bg-surface-muted"
            }`}
          >
            {formatTimeForDisplay(time)}
          </button>
        ))}
      </div>

      {(showClear || value) && (
        <button
          type="button"
          onClick={handleClear}
          className="mt-2 w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );

  const displayValue = value ? formatTimeForDisplay(value) : "";

  return (
    <div className="relative" style={{ zIndex: isOpen ? 50 : "auto" }}>
      <div className="relative">
        <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          name={name}
          id={id}
          onClick={handleInputClick}
          onKeyDown={handleInputKeyDown}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={isOpen ? popoverRef.current?.id : undefined}
          className={`h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm transition-colors duration-200 placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/10 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
          {...props}
        />
        {(showClear || value) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 right-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear time"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {isOpen && createPortal(popoverContent, document.body)}
    </div>
  );
}

// Need to import useMemo
import { useMemo } from "react";