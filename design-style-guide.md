# Design Style Guide

## 1. Direction
A calm, trustworthy botanical wellness experience: warm, human and refined without looking like a hospital, spa template or generic AI-generated SaaS site.

## 2. Visual-reference interpretation
The supplied direction calls for warm white surfaces, deep botanical green, soft sage, muted sand accents, restrained shadows, clean cards, real photography and short readable sections.

### Adopt
- Botanical greens and warm neutrals
- Editorial serif headings paired with a highly legible sans-serif UI font
- Generous but purposeful whitespace
- Real images of the centre, staff and equipment
- Clear service cards and prominent booking actions

### Adapt
- Serif typography is limited to headings and key pull quotes.
- Rounded corners remain moderate, not pill-shaped everywhere.
- Botanical motifs are subtle line art or photography, never decorative clutter.

### Avoid
- Heavy gradients, glassmorphism and oversized blobs
- Script fonts in body content
- Medical stock imagery and cure-oriented visual claims
- Large empty hero sections
- Browser-default alerts or confirmation dialogs
- Excessive animation, shadows or radius variations

## 3. Tokens
```css
:root {
  --background: 42 33% 97%;
  --foreground: 150 14% 16%;
  --surface: 40 28% 99%;
  --surface-muted: 84 18% 92%;
  --primary: 151 38% 24%;
  --primary-foreground: 42 33% 97%;
  --secondary: 95 20% 78%;
  --secondary-foreground: 151 38% 20%;
  --accent: 34 30% 82%;
  --accent-foreground: 150 14% 16%;
  --muted: 40 15% 91%;
  --muted-foreground: 145 8% 42%;
  --border: 70 12% 84%;
  --destructive: 4 63% 45%;
  --warning: 36 78% 42%;
  --success: 145 44% 33%;
  --radius: 0.75rem;
}
```
Final colours must be checked against the approved logo and photography.

## 4. Typography
- Display/headings: `DM Serif Display` preferred; fallback `Georgia, serif`
- Body/interface: `Inter` preferred; fallback system sans-serif
- H1: clamp 2.25–4.5rem, line-height 0.98–1.08
- H2: clamp 1.75–3rem
- H3: 1.25–1.5rem
- Body: 1rem desktop and mobile; line-height 1.6
- Small UI: minimum 0.875rem
- Avoid all-caps paragraphs; eyebrow labels may use uppercase with tracking

## 5. Layout
- Public content max width: 1200px
- Reading width: 680–760px
- Dashboard max width: fluid with 24–32px page padding
- Section spacing: 64–96px desktop, 40–64px mobile
- Grid: 12 columns desktop, 6 tablet, 4 mobile
- No horizontal scrolling at 320px width

## 6. Component styling
### Navigation
Compact sticky header; logo left; primary links centred or right; Book button prominent. Mobile uses a full-height accessible drawer.

### Cards
1px border, subtle surface contrast, 12–16px radius, minimal shadow. Service cards contain image, title, short description, price/duration and two clear actions.

### Buttons
- Primary: botanical green filled
- Secondary: neutral/outlined
- Text action: underlined or icon-assisted
- Minimum 44px height; clear hover, focus and disabled states

### Forms
Labels always visible. Inputs, selects and date controls use consistent height. Multi-step booking has a simple progress indicator and persistent summary on larger screens.

### Tables
Compact but readable. Use sticky headers for long lists, responsive card transformation only when a table becomes unusable. Financial columns align right.

### Badges
Use semantic colour plus text/icon; never colour alone.

### Dialogs and drawers
Use project-themed components, focus trap, escape-close and descriptive titles. Destructive actions require explicit confirmation.

### Toasts
Small, restrained, top-right desktop and bottom-centred mobile. Do not use toasts as the only confirmation for critical financial actions.

## 7. States
- Loading: skeleton matching final layout
- Empty: concise explanation plus relevant action
- Error: plain-language message, retry action and support path
- Success: confirmation with booking/document reference
- Permission denied: explain missing access without exposing protected data

## 8. Images
Use AVIF/WebP where practical, responsive sizes, useful alt text and focal-point controls. Do not crop people or equipment awkwardly. Avoid generic wellness stock images.

## 9. Icons
Lucide icons only for interface actions unless an approved custom brand icon exists. Use consistent 18–20px size in controls. Icons never replace essential labels in unfamiliar actions.

## 10. Motion
150–250ms transitions. Motion communicates state or hierarchy only. Respect `prefers-reduced-motion`. Chatbot and drawers must not bounce or pulse continuously.

## 11. Mobile behaviour
- Sticky bottom action bar on public pages
- When WhatsApp disabled: Call / Chat to Book / Book Online
- When enabled: Call / WhatsApp / Book
- Chat widget avoids bottom action bar and keyboard overlays
- Forms use one column; summaries remain collapsible
- Tap targets minimum 44×44px

## 12. Accessibility
Target WCAG 2.2 AA: semantic landmarks, labelled inputs, keyboard navigation, visible focus, contrast checks, correct heading hierarchy, accessible dialogs and non-colour status communication.
