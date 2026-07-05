"use client";

import { useCallback, type ComponentProps } from "react";

type RadioProps = ComponentProps<"input"> & {
  label?: string;
  description?: string;
};

export function Radio({
  label,
  description,
  className = "",
  id,
  name,
  value,
  checked,
  onChange,
  disabled = false,
  required = false,
  ...props
}: RadioProps) {
  const inputId = id || `${name}-${value}`;

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      onChange?.(event.target.value);
    }
  }, [onChange]);

  return (
    <label className={`flex items-start gap-3 cursor-pointer ${className}`}>
      <input
        type="radio"
        id={inputId}
        name={name}
        value={value}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        className={`h-5 w-5 border-2 border-border bg-background accent-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        {...props}
      />
      {(label || description) && (
        <div className="pt-0.5">
          {label && <span className={`block text-sm font-medium ${disabled ? "text-muted-foreground/50" : "text-foreground"}`}>{label}</span>}
          {description && <span className="block text-xs text-muted-foreground mt-0.5">{description}</span>}
        </div>
      )}
    </label>
  );
}

type RadioOption = {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
};

export function RadioGroup({
  name,
  options,
  value,
  onChange,
  disabled = false,
  className = "",
  label,
  description,
  orientation = "horizontal",
  compact = false,
}: {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
  orientation?: "horizontal" | "vertical";
  compact?: boolean;
}) {
  const handleChange = useCallback((optionValue: string) => {
    onChange?.(optionValue);
  }, [onChange]);

  const directionClass = orientation === "vertical" ? "flex-col" : "flex-wrap";
  const gapClass = orientation === "vertical" ? "gap-3" : "gap-4";
  const compactClass = compact ? "gap-3" : "";

  return (
    <fieldset className={className}>
      {(label || description) && (
        <div className="mb-3">
          {label && <legend className="text-sm font-semibold text-foreground">{label}</legend>}
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      <div className={`flex ${directionClass} ${gapClass} ${compactClass}`}>
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            description={option.description}
            checked={value === option.value}
            onChange={handleChange}
            disabled={disabled}
          />
        ))}
      </div>
    </fieldset>
  );
}

export function RadioButtonGroup({
  name,
  options,
  value,
  onChange,
  disabled = false,
  className = "",
  label,
  description,
}: {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
}) {
  const handleChange = useCallback((optionValue: string) => {
    onChange?.(optionValue);
  }, [onChange]);

  return (
    <fieldset className={className}>
      {(label || description) && (
        <div className="mb-3">
          {label && <legend className="text-sm font-semibold text-foreground">{label}</legend>}
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <label
            key={option.value}
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => handleChange(option.value)}
            disabled={disabled}
            className="sr-only"
          />
          <label
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
              value === option.value
                ? "border-primary bg-primary text-primary-foreground shadow-[0_2px_8px_oklch(0.355_0.074_159_/_0.16)]"
                : "border-border bg-background text-foreground hover:bg-surface-muted"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {option.icon && <span className="flex h-4 w-4" aria-hidden="true">{option.icon}</span>}
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}