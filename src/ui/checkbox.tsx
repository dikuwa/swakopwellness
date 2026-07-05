"use client";

import { useCallback, useId, type ComponentProps } from "react";

type CheckboxProps = Omit<ComponentProps<"input">, "onChange" | "checked"> & {
  label?: string;
  description?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
};

export function Checkbox({
  label,
  description,
  className = "",
  id,
  name,
  checked,
  onChange,
  disabled = false,
  required = false,
  ...props
}: CheckboxProps) {
  const uid = useId();
  const inputId = id || name || `checkbox-${uid}`;

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.checked);
  }, [onChange]);

  return (
    <label className={`flex items-start gap-3 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        id={inputId}
        name={name}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        className={`h-5 w-5 rounded border-2 border-border bg-background accent-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
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

export function CheckboxGroup({
  name,
  options,
  value = [],
  onChange,
  disabled = false,
  className = "",
  label,
  description,
}: {
  name: string;
  options: Array<{ value: string; label: string; description?: string }>;
  value?: string[];
  onChange?: (values: string[]) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
}) {
  const handleChange = useCallback((optionValue: string, checked: boolean) => {
    const newValues = checked
      ? [...value, optionValue]
      : value.filter((v) => v !== optionValue);
    onChange?.(newValues);
  }, [value, onChange]);

  return (
    <fieldset className={className}>
      {(label || description) && (
        <div className="mb-3">
          {label && <legend className="text-sm font-semibold text-foreground">{label}</legend>}
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      <div className="flex flex-wrap gap-4">
        {options.map((option) => (
          <Checkbox
            key={option.value}
            name={`${name}-${option.value}`}
            label={option.label}
            description={option.description}
            checked={value.includes(option.value)}
            onChange={(checked) => handleChange(option.value, checked)}
            disabled={disabled}
          />
        ))}
      </div>
    </fieldset>
  );
}