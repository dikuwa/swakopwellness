"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps, ReactNode } from "react";
import { ChevronDown, ChevronUp, X, Search, Check } from "lucide-react";
import { createPortal } from "react-dom";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  [key: string]: unknown; // Allow other data
}

type SelectProps = Omit<ComponentProps<"input">, "value" | "onChange" | "type" | "readOnly"> & {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  options: SelectOption[];
  searchable?: boolean;
  showClear?: boolean;
  maxHeight?: string;
  renderOption?: (option: SelectOption) => ReactNode;
};

export function Select({
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  required = false,
  name,
  id,
  options,
  searchable = false,
  showClear = false,
  maxHeight = "240px",
  renderOption,
  className = "",
  ...props
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);
  const selectedIndex = filteredOptions.findIndex((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchQuery("");
          setHighlightedIndex(-1);
        }
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
        setHighlightedIndex(-1);
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
    const estimatedHeight = 280;
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
    positionPopover();
    setIsOpen(true);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [disabled, selectedIndex, positionPopover]);

  const handleInputClick = useCallback(() => {
    openPopover();
  }, [openPopover]);

  const handleInputKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      openPopover();
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setSearchQuery("");
      setHighlightedIndex(-1);
    }
  }, [openPopover]);

  const handleOptionClick = useCallback((optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, [onChange]);

  const handleOptionKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
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
        setHighlightedIndex(filteredOptions.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        handleOptionClick(filteredOptions[index].value);
        break;
      case "Escape":
        setIsOpen(false);
        setSearchQuery("");
        setHighlightedIndex(-1);
        inputRef.current?.focus();
        break;
    }
  }, [filteredOptions, handleOptionClick]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setHighlightedIndex(0);
  }, []);

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
      style={{ ...popoverStyle, maxHeight }}
      className="fixed z-50 rounded-2xl border border-border bg-surface shadow-[0_20px_40px_oklch(0.235_0.025_158_/_0.15)] w-full max-w-[90vw] sm:max-w-md"
      role="dialog"
      aria-label="Choose option"
    >
      {searchable && (
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search..."
              className="h-9 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
          </div>
        </div>
      )}

      <div
        ref={optionsRef}
        className="grid gap-1 p-2 max-h-60 overflow-y-auto"
        role="listbox"
      >
        {filteredOptions.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">No options found</div>
        ) : (
          filteredOptions.map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleOptionClick(option.value)}
              onKeyDown={(e) => handleOptionKeyDown(e, index)}
              disabled={option.disabled}
              tabIndex={index === highlightedIndex ? 0 : -1}
              onFocus={() => setHighlightedIndex(index)}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled}
              className={`w-full rounded-xl p-3 text-sm font-medium text-left transition-all duration-150 ${
                option.disabled
                  ? "text-muted-foreground/30 cursor-not-allowed"
                  : option.value === value
                  ? "bg-primary text-primary-foreground"
                  : index === highlightedIndex
                  ? "bg-surface-muted text-foreground"
                  : "text-foreground hover:bg-surface-muted"
              }`}
            >
              {renderOption ? renderOption(option) : (
                <span className="flex items-center justify-between">
                  {option.label}
                  {option.value === value && <Check className="h-4 w-4" aria-hidden="true" />}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {(showClear || value) && (
        <button
          type="button"
          onClick={handleClear}
          className="mx-2 mb-2 w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-t border-border pt-2"
        >
          Clear
        </button>
      )}
    </div>
  );

  const displayValue = selectedOption?.label || "";

  return (
    <div className="relative" style={{ zIndex: isOpen ? 50 : "auto" }}>
      {/* Hidden input to submit the actual value with forms */}
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      <div className="relative">
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
          className={`h-11 w-full rounded-xl border border-border bg-background pl-4 pr-10 text-sm transition-colors duration-200 placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/10 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
          {...props}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          )}
          {(showClear || value) && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {isOpen && createPortal(popoverContent, document.body)}
    </div>
  );
}