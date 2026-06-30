# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Swakop Wellness Centre
**Generated:** 2026-06-30 20:14:28
**Category:** Beauty/Spa/Wellness Service

---

## Global Rules

### Color Palette (OKLCH tokens via globals.css)

| Role | OKLCH Value | Hex Equivalent | CSS Variable |
|------|-------------|----------------|--------------|
| Primary | `oklch(0.355 0.074 159)` | `#2D6A4F` | `--color-primary` |
| Primary Foreground | `oklch(0.972 0.012 85)` | `#F7F5EF` | `--color-primary-foreground` |
| Secondary | `oklch(0.79 0.05 122)` | `#A1D6B3` | `--color-secondary` |
| Accent (Terracotta) | `oklch(0.60 0.09 45)` | `#C67B5C` | `--color-accent` |
| Background | `oklch(0.972 0.012 85)` | `#F7F5EF` | `--color-background` |
| Surface | `oklch(0.988 0.009 85)` | `#FDFBF7` | `--color-surface` |
| Surface Muted | `oklch(0.924 0.025 116)` | `#E6EDDF` | `--color-surface-muted` |
| Foreground | `oklch(0.235 0.025 158)` | `#1A2421` | `--color-foreground` |
| Muted Foreground | `oklch(0.495 0.018 152)` | `#5D6D66` | `--color-muted-foreground` |
| Border | `oklch(0.84 0.019 103)` | `#D4DDD4` | `--color-border` |

**Color Notes:** Botanical green wellness theme with warm cream backgrounds and terracotta accent. WCAG AA compliant.

### Typography

- **Heading Font:** Lora (Google Font, loaded via `next/font/google`)
- **Body Font:** Raleway (Google Font, loaded via `next/font/google`)
- **CSS Variables:** `--font-heading` (Lora), `--font-body` (Raleway)
- **Fallbacks:** Georgia, serif for headings; system-ui, sans-serif for body
- **Heading weight:** 600; Body weight: 400 (medium for emphasis)
- **Letter spacing:** Headings get `-0.02em` by default; utilities like `tracking-[-0.03em]` for display sizes
- **Mood:** warm, botanical, editorial, calm, professional

### Border Radius

- Default: `0.75rem` (12px) via `--radius` / `rounded-xl`
- Cards: `1rem` (16px) via `rounded-2xl`
- Buttons/Inputs: `0.75rem` (12px) via `rounded-xl`
- Badges: fully rounded via `rounded-full`

### Shadow System

| Usage | Token/Class |
|-------|-------------|
| Cards | `shadow-[0_4px_24px_oklch(0.235_0.025_158_/_0.04)]` |
| Buttons (primary) | `shadow-[0_2px_8px_oklch(0.355_0.074_159_/_0.25)]` |
| Buttons (hover) | `shadow-[0_4px_12px_oklch(0.355_0.074_159_/_0.35)]` |
| Mobile nav dropdown | `shadow-[0_8px_32px_oklch(0.235_0.025_158_/_0.08)]` |
| Mobile action bar | `shadow-[0_-10px_40px_oklch(0.235_0.025_158_/_0.08)]` |

---

## Component Specs

### Buttons
- Rendered via `Button`, `LinkButton`, `ExternalLink` in `src/ui/components.tsx`
- 4 variants: `primary` (green fill + green shadow), `secondary` (border + surface bg), `ghost` (no border, hover bg), `danger` (red fill)
- 3 sizes: `sm` (h-9), `md` (h-11), `lg` (h-12)
- All have `cursor-pointer`, `rounded-xl`, `font-semibold`, `transition-all duration-200`, visible focus states
- Primary buttons have green drop shadows for depth

### Cards
- Rendered via `Card` component: `rounded-2xl border border-border bg-surface shadow-[0_4px_24px_...]`
- Hover card pattern: `hover:shadow-[0_4px_24px_...] hover:-translate-y-0.5` (used on service cards)
- Muted section: `CardSection` = `rounded-2xl bg-surface-muted p-5 sm:p-6`

### Inputs / Select / Textarea
- All share consistent styling: `h-11 rounded-xl border border-border bg-background px-4 text-sm`
- Focus: `focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/10`
- Always paired with `Label` component (block, text-sm, font-medium)

### Badges
- 6 variants: `default` (muted bg), `primary` (green tint), `success`, `warning`, `danger`, `muted`
- Pill shape: `rounded-full px-2.5 py-0.5 text-xs font-semibold`

### StatCard
- Dashboard metric cards: `rounded-2xl border border-border bg-surface-muted p-4`
- Optional `variant`: `emphasis` (green text), `warn` (amber text)

### PageHeading
- Consistent page header pattern with optional pre-title label (uppercase, tracked), title, and description

---

## Layout Patterns

### Public Header (floating)
- Fixed position at top (`fixed inset-x-0 top-0 z-50`)
- Wrapped in max-w-6xl container with `pt-4` top padding
- Inner card: `rounded-2xl border border-border bg-background/95 backdrop-blur shadow`
- Brand: "SW" brand mark (green rounded square) + business name
- Desktop: horizontal nav links with rounded hover states
- Mobile: hamburger `details`/`summary` toggle (pure CSS, no JS)
- CTA: "Call" button (border) + "Book" button (primary green)

### Public Page Shell (`PageShell`)
- Wraps `PublicHeader` + `{children}` inside `<div className="pt-20">` + `PublicFooter` + `MobileActionBar`
- `pt-20` accounts for the floating header height

### Dashboard Layout (vertical sidebar)
- `DashboardLayout` client component wrapping sidebar + main content
- Desktop: 256px fixed sidebar (`w-64`) with `sticky` positioning
- Mobile: slide-in sidebar with overlay backdrop (`fixed inset-0 translate-x-full`, toggled via hamburger)
- Sidebar groups: Business, Services, Finance, System with section labels
- Active link: `bg-primary/10 text-primary`; inactive: `text-muted-foreground hover:bg-surface-muted hover:text-foreground`
- Sign-out form at bottom of sidebar
- Mobile header: sticky top bar with hamburger + brand mark

---

## Page Patterns

### Homepage (`/`)
- **Pattern:** Hero-Centric + Social Proof with Features + CTA
- **Section order:** Hero > Services > How Appointments Work > FAQ Preview > Final CTA
- **Hero:** Full-width with safety note aside card (green warning icon)
- **Services:** 2-col grid of linked cards with images, hover lift effect
- **How it works:** 3-col muted section with numbered steps
- **FAQ preview:** 2-col grid, linked to /faqs
- **Final CTA:** Centered card with dual booking buttons

---

## Anti-Patterns (Do NOT Use)

- ❌ Bright neon colors
- ❌ Harsh animations
- ❌ Dark mode
- ❌ Emojis as icons — Use inline SVG icons
- ❌ Missing `cursor:pointer` — All clickable elements must have it
- ❌ Layout-shifting hovers — Avoid scale transforms that shift layout
- ❌ Low contrast text — Maintain 4.5:1 minimum contrast ratio
- ❌ Instant state changes — Always use transitions (150-300ms)
- ❌ Invisible focus states — Focus states must be visible for a11y (`:focus-visible`)

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (inline SVG or Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
