"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import { ChevronDown, ChevronUp, X, Search, Check } from "lucide-react";
import { createPortal } from "react-dom";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

type SelectProps = ComponentProps<"select"> & {
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
  className = "",
  ...props
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
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
      setSearchQuery("");
      setHighlightedIndex(-1);
    }
  }, [disabled, selectedIndex]);

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
      className="fixed z-50 rounded-2xl border border-border bg-surface shadow-[0_20px_40px_oklch(0.235_0.025_158_/_0.15)] w-full max-w-md"
      role="dialog"
      aria-label="Choose option"
      style={{ maxHeight }}
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
              className={`w-full h-10 rounded-xl px-3 text-sm font-medium text-left transition-all duration-150 ${
                option.disabled
                  ? "text-muted-foreground/30 cursor-not-allowed"
                  : option.value === value
                  ? "bg-primary text-primary-foreground"
                  : index === highlightedIndex
                  ? "bg-surface-muted text-foreground"
                  : "text-foreground hover:bg-surface-muted"
              }`}
            >
              <span className="flex items-center justify-between">
                {option.label}
                {option.value === value && <Check className="h-4 w-4" aria-hidden="true" />}
              </span>
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
      <div className="relative">
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