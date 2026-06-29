# Design

## Direction

A calm botanical wellness product with warm white surfaces, deep green controls, soft sage panels and muted sand accents. The visual language should feel local, human and refined without becoming clinical, spa-template, glassy or generic SaaS.

## Theme

Light only for v1. Scene: a client browses on a phone in daylight before calling or requesting an appointment, while staff use the dashboard during normal reception hours in a bright practice environment.

## Color

Use a restrained product palette with botanical green as the primary action and state anchor. Prefer OKLCH tokens in implementation.

```css
:root {
  --background: oklch(0.972 0.012 85);
  --foreground: oklch(0.235 0.025 158);
  --surface: oklch(0.988 0.009 85);
  --surface-muted: oklch(0.924 0.025 116);
  --primary: oklch(0.355 0.074 159);
  --primary-foreground: oklch(0.972 0.012 85);
  --secondary: oklch(0.79 0.05 122);
  --secondary-foreground: oklch(0.315 0.064 159);
  --accent: oklch(0.84 0.038 72);
  --accent-foreground: oklch(0.235 0.025 158);
  --muted: oklch(0.91 0.016 82);
  --muted-foreground: oklch(0.495 0.018 152);
  --border: oklch(0.84 0.019 103);
  --destructive: oklch(0.49 0.16 28);
  --warning: oklch(0.62 0.13 70);
  --success: oklch(0.45 0.09 153);
  --radius: 0.75rem;
}
```

## Typography

Use a readable sans-serif UI stack for the product shell. Public marketing headings may use a restrained serif, but dashboard labels, controls and data stay sans-serif. Body copy should stay at 65 to 75 characters for prose.

## Layout

Public pages use mobile-first sections, compact sticky navigation and a sticky mobile action bar. Dashboard pages use predictable app patterns, fluid width and 24 to 32px page padding on larger screens. No horizontal scrolling at 320px.

## Components

Buttons use minimum 44px height, clear hover, focus, disabled and loading states. Cards have 1px borders, subtle surface contrast and moderate radius. Forms keep labels visible, align control heights and include validation, progress and recovery states. Tables remain compact and readable, with right-aligned financial columns.

## States

Every data-driven page should define loading skeletons, empty states with a relevant action, plain-language errors with retry paths, success confirmations with references where appropriate and permission-denied states that do not expose protected data.

## Motion

Use 150 to 250ms transitions for state feedback only. Respect `prefers-reduced-motion`. Do not use bouncing chatbot or drawer motion.

## Imagery

Use real centre, staff, equipment and facility imagery when available. Avoid medical stock imagery, awkward crops, generic wellness photos and visual claims of cure or diagnosis.
