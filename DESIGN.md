---
name: AgriSense AI
description: Intelligent Farm Management and Decision Support Platform for Small-Scale Farmers
colors:
  primary: "#10b981"
  primary-light: "#34d399"
  primary-dark: "#065f46"
  accent: "#ffb1ee"
  warning: "#f59e0b"
  warning-hover: "#d97706"
  warning-light: "#fbbf24"
  danger: "#ef4444"
  danger-hover: "#b91c1c"
  info: "#60a5fa"
  info-bg: "rgba(59, 130, 246, 0.08)"
  info-border: "rgba(59, 130, 246, 0.2)"
  neutral-bg: "#030303"
  neutral-bg-secondary: "#09090b"
  neutral-bg-tertiary: "#121215"
  text-primary: "#fafafa"
  text-secondary: "#a1a1aa"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "99px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#030303"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "rgba(255, 255, 255, 0.03)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
---

# Design System: AgriSense AI

## 1. Overview

**Creative North Star: "The Agrarian Codex"**

AgriSense AI employs a visual language that matches high-tech telemetry precision with natural organic weight. The design is structured to serve both small-scale rural cultivators and village-level advisors under field conditions. It relies on crisp typography, flat-layered structures, and natural leaf-and-soil values.

The system rejects neon-purple SaaS gradients, excessive spacing that hides primary metrics, and faint gray text that is illegible under direct sunlight.

**Key Characteristics:**
- High-contrast typography optimized for outdoor mobile screens.
- Organic color markers representing health (deep green), warning (amber), and flowers/accent (orchid petal).
- Glassmorphic overlays with strict, crisp borders to define hierarchy without heavy drop shadows.

## 2. Colors

The color palette represents nature, earth, and precision agriculture.

### Primary
- **Living Emerald** (#10b981): Representing healthy crops, success status, and active navigation nodes.
- **Emerald Mist** (#34d399): Hover states for primary elements.
- **Deep Canopy** (#065f46): Dark grounding tones for container headers and gradients.

### Secondary
- **Orchid Petal** (#ffb1ee): Highlight color for premium elements, glass cards, and signature hover triggers.

### Neutral
- **Absolute Soil** (#030303): Base canvas color.
- **Deep Humus** (#09090b): Secondary section background.
- **Clay Layer** (#121215): Tertiary content and input fields base.
- **Grounded White** (#fafafa): Body text.
- **Mist Gray** (#a1a1aa): Secondary copy.

**The Contrast Rule.** Body text must always maintain at least a 4.5:1 contrast ratio. Gray text on a dark background is forbidden; use slightly lighter neutral values instead to guarantee outdoor readability.

## 3. Typography

**Display Font:** Inter, system-ui, -apple-system, sans-serif
**Body Font:** Inter, system-ui, -apple-system, sans-serif

The font scale favors thick weights for headers to maintain contrast and readable sizes for information-dense blocks.

### Hierarchy
- **Display** (Bold (700), 3.75rem, 1.1): Used for large hero text and callouts.
- **Headline** (Semi-Bold (600), 2.25rem, 1.2): Section titles.
- **Title** (Medium (500), 1.25rem, 1.3): Cards and group titles.
- **Body** (Regular (400), 0.875rem, 1.5): Descriptive text and tables. CAP at 75ch.
- **Label** (Medium (500), 0.75rem, 1.4): Table headers, tabs, and tags.

**The Heading Balance Rule.** Heading titles (H1–H3) must utilize `text-wrap: balance` to prevent awkward orphaned words and uneven layout breaks.

## 4. Elevation

AgriSense AI relies on flat, layered geometry. We use transparent dividers, subtle solid borders, and backdrop blurs to establish hierarchy instead of heavy floating shadows.

**The Stacking Border Rule.** To partition surfaces, use thin borders (`border-color` 8% white) rather than shadows. Shadows should only appear under glass container overlays to indicate interactive depth on hover.

## 5. Components

### Buttons
- **Shape:** Rounded-md (8px radius)
- **Primary:** Background (#10b981), Text (#030303), Padding (8px 16px).
- **Secondary:** Background (rgba(255, 255, 255, 0.03)), Text (#fafafa), Border (rgba(255, 255, 255, 0.08)), Padding (8px 16px).

### Chips
- **Style:** Flat with 6px border radius.
- **Success Tag:** Background (rgba(16, 185, 129, 0.08)), Text (#34d399), Border (1px solid rgba(16, 185, 129, 0.2)).

### Cards
- **Corner Style:** Rounded-lg (12px radius).
- **Background:** Glassmorphic overlay (rgba(9, 9, 11, 0.65)) with backdrop-filter blur (12px).
- **Border:** 1px solid rgba(255, 255, 255, 0.08).

### Inputs
- **Style:** Background (#121215), Border (rgba(255, 255, 255, 0.08)), Radius (8px).
- **Focus:** Border-color (#34d399) with glow-shadow (rgba(16, 185, 129, 0.15)).

## 6. Do's and Don'ts

### Do:
- **Do** use emerald green (`#10b981`) exclusively for positive actions, verified states, and active items.
- **Do** enforce a line-length limit of 75ch on all paragraphs to preserve readability on mobile screens.
- **Do** keep card borders clean and thin (1px) using semi-transparent white.

### Don't:
- **Don't** use neon gradients or float elements with thick drop shadows.
- **Don't** use tiny, uppercase, wide-tracked eyebrows above headers.
- **Don't** round cards or dialogs beyond 12px.
