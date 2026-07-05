"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, type ComponentProps, type TextareaHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_2px_8px_oklch(0.355_0.074_159_/_0.25)]",
  secondary: "border border-border bg-surface hover:bg-surface-muted",
  ghost: "hover:bg-surface-muted",
  danger: "bg-destructive text-white hover:bg-destructive/90",
};

const sizeClasses = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
};

export function Button({ variant = "primary", size = "md", className = "", children, ...props }: ComponentProps<"button"> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  return (
    <button className={`inline-flex cursor-pointer items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline-3 focus-visible:outline-primary/40 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({ variant = "primary", size = "md", className = "", href, children, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  return (
    <Link href={href} className={`inline-flex cursor-pointer items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline-3 focus-visible:outline-primary/40 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </Link>
  );
}

export function ExternalLink({ variant = "primary", size = "md", className = "", href, children, ...props }: ComponentProps<"a"> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  return (
    <a href={href} className={`inline-flex cursor-pointer items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline-3 focus-visible:outline-primary/40 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </a>
  );
}

export function Card({ className = "", children, ...props }: ComponentProps<"div">) {
  return (
    <div className={`rounded-2xl border border-border bg-surface shadow-[0_4px_24px_oklch(0.235_0.025_158_/_0.04)] transition-all duration-200 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardSection({ className = "", children, ...props }: ComponentProps<"div">) {
  return (
    <div className={`rounded-2xl bg-surface-muted p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return (
    <input className={`h-11 w-full rounded-xl border border-border bg-background px-4 text-sm transition-colors duration-200 placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/10 ${className}`} {...props} />
  );
}

export function Select({ className = "", children, ...props }: ComponentProps<"select">) {
  return (
    <select className={`h-11 w-full rounded-xl border border-border bg-background px-4 text-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/10 ${className}`} {...props}>
      {children}
    </select>
  );
}

/**
 * Auto-growing textarea that expands vertically as content is entered.
 * Uses a hidden clone div to measure content height for smooth resizing.
 * Falls back to regular textarea behavior when rows or style={{ resize: "both" }} are passed.
 */
export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [resize]);

  return (
    <textarea
      ref={ref}
      onInput={resize}
      className={`w-full rounded-xl border border-border bg-background px-4 py-3 text-sm transition-colors duration-200 placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/10 resize-none overflow-y-auto ${className}`}
      {...props}
    />
  );
}

export function Label({ className = "", children, ...props }: ComponentProps<"label">) {
  return (
    <label className={`block text-sm font-medium text-foreground ${className}`} {...props}>
      {children}
    </label>
  );
}

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "muted";

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-surface-muted text-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function Badge({ variant = "default", className = "", children, ...props }: ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeVariants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}

export function StatCard({ label, value, variant }: { label: string; value: number | string; variant?: "default" | "emphasis" | "warn" }) {
  const colorMap = {
    default: "",
    emphasis: "text-primary",
    warn: "text-warning",
  };
  const colorClass = colorMap[variant ?? "default"];
  return (
    <div className="rounded-2xl border border-border bg-surface-muted p-4 transition-all duration-200 hover:shadow-[0_4px_16px_oklch(0.235_0.025_158_/_0.06)]">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${colorClass}`}>{value}</p>
    </div>
  );
}

export function PageHeading({ pre, title, description }: { pre?: string; title: string; description?: string }) {
  return (
    <div>
      {pre ? <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">{pre}</p> : null}
      <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-[-0.035em]">{title}</h1>
      {description ? <p className="mt-3 max-w-[65ch] text-sm leading-6 text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export { DatePicker } from "./date-picker";
export { TimePicker } from "./time-picker";
export { Select } from "./select";
export { Checkbox, CheckboxGroup } from "./checkbox";
export { Radio, RadioGroup, RadioButtonGroup } from "./radio";
