---
name: 3d-website-builder
description: >
  Assembles AI-generated video frames, Three.js organic particle configurations,
  and CSS-animated SVG data overlays into a premium, scroll-driven visual story website.
  Implements multi-phase transitions (e.g., farmland transformation over time from raw land
  to connected agricultural intelligence network), smooth viewport-pinned canvas scrubbing,
  and snap-stop coordinates.
  Trigger when the user says "3D website builder", "build 3D website", "create 3D landing page",
  "assemble 3D website", "build the agricultural digital twin", or asks to combine 3D assets
  into a scroll-animated site.
---

# 3D Website Builder — Workspace Customization Skill

You take a set of coordinated 3D assets (AI-generated scroll-stop frames, Three.js particle scripts, and animated SVG overlays) and assemble them into a premium, MotionSites-level scroll-driven website.

The default target is the **AgriSense AI Digital Twin Landing Page**, telling the 6-phase farmland awakening story.

---

## Step 1: Establish the Multi-Phase Scroll Architecture

Create a single-page HTML application with a sticky canvas container that controls the visual state based on scroll progress:

- **Scroll Section Height**: `450vh` to `600vh` to accommodate the 6 narrative phases smoothly.
- **Sticky Viewport Container**: `position: sticky; top: 0; height: 100vh` to pin the 3D canvas and overlay graphics.
- **Visual Phases (0.0 to 1.0 progress)**:
  - **Phase 1 (0.0 - 0.15)**: Raw land. Canvas renders frames 1-15. Background is dark.
  - **Phase 2 (0.15 - 0.32)**: Weather Activation. Canvas frames 16-32. Rain particles begin falling.
  - **Phase 3 (0.32 - 0.50)**: Crop Health. Canvas frames 33-50. Green heatmaps fade in on the field.
  - **Phase 4 (0.50 - 0.68)**: AI Analysis Scan. Canvas frames 51-68. Bounding boxes and scanning lasers animate.
  - **Phase 5 (0.68 - 0.85)**: Recommendations. Canvas frames 69-85. Glowing advice cards rise from the field coordinates.
  - **Phase 6 (0.85 - 1.00)**: Connected Ecosystem. Canvas frames 86-100. Village telemetry grid lines draw between nodes.

---

## Step 2: Set Up the Canvas Frame Scruber (Retina Cover-Fit)

Implement high-performance image preloading and canvas drawing:
- Preload all 100 frames before hiding the preloading overlay.
- Clear canvas and draw images using `devicePixelRatio` scaling to prevent blur.
- Apply a desktop cover-fit and a mobile zoomed contain-fit drawing algorithm so the central focus remains centered on all devices.
- Prevent redundant canvas renders by tracking `currentFrameIndex` and only redrawing when the frame actually shifts.

---

## Step 3: Integrate Three.js Particle Systems

Embed a Three.js canvas layer on top of or behind the frame canvas to simulate organic systems:
- Rain falling diagonally with wind drift (active during Phase 2).
- Moisture rising or soil nutrient flows (active during Phase 3 & 5).
- Network node telemetry lines and glowing data streams (active during Phase 6).
- Use scroll progress thresholds to dynamically fade particle opacities (`material.opacity`) in and out.

---

## Step 4: Layer CSS-Animated SVG HUD Overlays

Sling an inline SVG overlay on top of the 3D canvas. Synchronize the visibility of specific SVG paths with scroll positions:
- Draw grid lines, radar sweeps, and field coordinate labels using CSS keyframe animations.
- Use `stroke-dasharray` and `stroke-dashoffset` animations to dynamically "draw" lines (radar sweeps, scanner beams, connection paths) as the user scrolls.

---

## Step 5: Deliver and Serve

1. Assemble all HTML, CSS, and JS into cohesive files (`index.html`, `style.css`, `app.js`).
2. Serve the website locally on port 8080.
3. Verify the rendering of all 6 phases and transitions using the local browser subagent.
