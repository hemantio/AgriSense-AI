# Technical Template: UI/UX Design System, Typography, and Motion Standards
> **System Status**: MODEL TEMPLATE | **Version**: 1.0.0 | **Classification**: TECHNICAL STANDARDS

---

## 1. Document Specification

- **Purpose**: Details visual styling rules, custom UI component designs, typography scales, spacing grids, accessibility limits, responsive design structures, and micro-interactions.
- **Audience**: UI/UX designers, frontend developers, component engineers, and QA usability specialists.
- **Prerequisites**: Clear definition of target display boundaries.
- **Dependencies**: Tailwind CSS configuration rules.
- **Related Documents**: `standards/writing_and_markdown.md`.
- **Expected Length**: 800 - 1500 words.
- **Maintenance Frequency**: Semi-annually or upon deep brand revisions.
- **Owner**: Lead UI/UX Designer / Principal Frontend Engineer.
- **Review Checklist**: Verify color contrast ratios, check responsive breakpoint parameters, validate touch target sizes, ensure screen-reader labels are mandatory.
- **Completion Criteria**: Pristine visual component consistency and 100% WCAG AA compliance across all application portals.
- **Versioning Strategy**: Minor updates denote token tweaks or single component additions; major updates denote comprehensive visual layout re-designs.

---

## 2. Color Palette and Semantic Tokens

To maintain visual hierarchy and ensure comfortable eye tracking for farmers working in bright sunlight or low-light sheds, we enforce a strict high-contrast light-theme standard by default.

```text
 Background: #FAF9F6 (Off-white)  ──>  Primary Text: #1F2937 (Deep Charcoal)  ──>  Accent: #0D9488 (Teal)
```

| Token Name | Hex Code | Utility Class (Tailwind) | Context / Usage |
| :--- | :--- | :--- | :--- |
| **Canvas BG** | `#FAF9F6` | `bg-[#FAF9F6]` | Main application body background. |
| **Primary Text** | `#1F2937` | `text-gray-800` | Body copy, headers, and major data lines. |
| **Forest Primary**| `#15803D` | `text-green-700` | Crop statuses, verified plots, positive feedback. |
| **Teal Accent** | `#0D9488` | `bg-teal-600` | Call-to-action buttons, interactive states, active sliders. |
| **Sienna Warning**| `#B45309` | `bg-amber-700` | Disease detections, critical climate alert indicators. |

---

## 3. Typography Hierarchy

We pair clean sans-serif display typefaces for UI buttons and headers with mono-spaced elements for system metrics, weather numbers, and coordinates.

*   **Primary Sans Font**: Space Grotesk / Inter (Clean display headings).
*   **Secondary Mono Font**: JetBrains Mono (For coordinates, weather metrics, and database numbers).

| Level | Size | Weight | Tracking | Tailwind Configuration |
| :--- | :--- | :--- | :--- | :--- |
| **Title H1** | `2.25rem` | Bold | `-0.025em` | `text-3xl font-bold tracking-tight text-gray-900` |
| **Header H2**| `1.50rem` | SemiBold| `-0.015em` | `text-xl font-semibold tracking-tight text-gray-800`|
| **Body text**| `1.00rem` | Normal | `0.00em` | `text-base font-normal leading-relaxed text-gray-700`|
| **Micro Cap**| `0.75rem` | Medium | `0.05em` | `text-xs font-medium tracking-wider uppercase text-gray-500`|

---

## 4. Spacing and Responsive Breakpoints

We use Tailwind's responsive screen markers to transition layouts fluidly from small-screen mobile displays up to desktop screens.

```text
 320px (Mobile-First Canvas)  ──[md: 768px (Tablet)]──>  1280px+ (Desktop Grid)
```

*   **Touch Targets**: On mobile screens, all interactive items (buttons, checkboxes, links) MUST maintain a minimum height and width of **44px** to ensure easy touch selection for fingers in agricultural work settings.
*   **Spacers**: Rely on standard scale values (`p-4`, `p-6`, `m-4`, `gap-4`). Avoid custom, irregular margins to maintain clean layout rhythms.

---

## 5. Motion and Animation Guidelines

Transitions must serve to establish visual relationships and direct attention, rather than create gratuitous visual noise.

*   **Animation Engine**: Use lightweight CSS transitions or Tailwind utility animations. Avoid heavy third-party canvas animation libraries.
*   **Timing Scale**:
    *   *UI Interactions* (Hover, Click, Button Pulse): `150ms ease-in-out`
    *   *Card Entrances* (Staggered Fade-in): `300ms cubic-bezier(0.16, 1, 0.3, 1)`
    *   *Sidebar Transitions* (Drawer slides): `250ms ease-out`

```css
/* Custom CSS Transition Rule */
.ui-transition {
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 6. Web Accessibility Rules (WCAG 2.1 AA)

All user interfaces must conform to international accessibility requirements:

1.  **Color Contrast**: Ensure all text elements meet a minimum contrast ratio of **4.5:1** against their background color. Use WCAG contrast checkers prior to adding custom hex variables.
2.  **Screen-Reader Compatibility**: All images and icons must include meaningful `aria-label` or `alt` attributes. Decorative icons must be hidden from screen readers using `aria-hidden="true"`.
3.  **Keyboard Navigation**: Interactive visual components must be focusable using keyboard navigation (`tabindex="0"`) and display a clear outline border state during focus.
