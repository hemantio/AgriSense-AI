---
name: 3d-website-asset-generator
description: >
  Generates a coordinated set of cinematic 3D website assets for a multi-phase scroll-driven visual story (e.g., farmland transformation over time).
  Generates: (1) Prompt A - Assembled/Start state on white, (2) Prompt B - Transformed/Data-mesh state on white, (3) Prompt C - Video transition
  animating between them, (4) JavaScript Three.js config code for organic particle systems, and (5) Inline animated SVG vector overlay layers.
  Delivers via a glassmorphism HTML dashboard with one-click copy buttons.
  Trigger when the user says "3D asset generator", "3D website asset generator", "generate 3D prompts", "farmland transformation story",
  or asks for 3D website assets.
---

# 3D Website Asset Generator — Workspace Customization Skill

You generate a complete suite ofcoordinated 3D assets (AI prompts, Three.js particle system configurations, and CSS-animated SVG data layers) to construct a premium, scroll-driven visual story for a product or system (defaulting to **AgriSense AI**).

---

## Step 0: Identify the Target & Visual Story

When triggered, identify the brand name and the specific visual narrative. If none is specified, default to **AgriSense AI** with the visual story of **Farmland Awakening / Transformation over time (Phase 1 to Phase 6)**.

---

## Step 1: Generate Coordinated AI Prompts

Generate 3 detailed prompts to create the primary scroll-stop video asset using image and video generation models (Midjourney, Flux, Runway Gen-3, Kling):

### Prompt A: The Hero / Start State (Assembled)
- **Object**: Pristine, fully assembled product, or raw terrain/farm plot.
- **Background**: Pure white `#FFFFFF` background, soft studio lighting, soft shadow underneath.
- **Composition**: Centered, 3/4 or top-down cinematic angle, 16:9 aspect ratio.
- **Details**: Ultra-sharp photorealistic details, high-end commercial rendering style.

### Prompt B: The Transformed / Data-Mesh State (Deconstructed)
- **Object**: Exploded view showing internal components, OR terrain overlaid with glowing data layers, moisture lines, heatmaps, and bounding boxes.
- **Background**: Same pure white background, consistent camera angle and lighting for visual continuity.
- **Composition**: Same framing, 16:9 aspect ratio.
- **Details**: Detailed components or data nodes floating in space, maintaining the original silhouette/outline.

### Prompt C: The Video Transition
- **Start Frame**: Prompt A's output.
- **End Frame**: Prompt B's output.
- **Transition**: Lock-off tripod shot (no camera movement). Smooth, slow-in, slow-out motion. Casading deconstruction or sweeping transformation reveal taking place over 5-6 seconds.

---

## Step 2: Generate Three.js Particle System Code

Create a clean, ready-to-run JavaScript code block setting up a custom particle system in Three.js. Customize the particle movement to match the visual story:
- **AgriSense AI**: A particle system simulating a rain front moving diagonally, soil moisture rising upwards, or glowing network nodes connecting.
- **General Product**: Exploding dust, glowing telemetry rings, or energy streams.
- **Style**: Fluid motion, mathematical easing, customizable speed, size, and count.

---

## Step 3: Generate Animated SVG Data Layers

Create a clean, inline SVG path block with embedded CSS keyframe animations. The SVG should display HUD overlays or data graphics that sit on top of the 3D canvas:
- **AgriSense AI**: Bounding boxes scanning fields, radar sweep lines, precipitation vectors, and glowing route node connections.
- **Style**: Thin lines (`1px`), low opacity (`0.15` to `0.4`), sleek dashboard indicators, stroke-dashoffset drawing animations.

---

## Step 4: Assemble and Build the Dashboard Page

Read the HTML template from `.agents/skills/3d-website-asset-generator/assets/dashboard-template.html`.

Replace the following placeholders:
- `{{OBJECT_NAME}}` — The name of the product/project (e.g., AgriSense AI)
- `{{PROMPT_A}}` — The full text of Prompt A (escaped HTML characters)
- `{{PROMPT_B}}` — The full text of Prompt B (escaped HTML characters)
- `{{PROMPT_C}}` — The full text of Prompt C (escaped HTML characters)
- `{{PARTICLE_CODE}}` — The Three.js JavaScript particle snippet (escaped HTML characters)
- `{{SVG_CODE}}` — The inline SVG with CSS animations (escaped HTML characters)

Write the completed HTML output to `3d-assets.html` in the workspace root.

---

## Step 5: Present and Open

1. Notify the user in chat that the workspace dashboard has been created at `3d-assets.html`.
2. Provide a clean summary of the prompts and config details directly in chat as a fallback.
3. Automatically offer to launch the local browser subagent to view the generated `3d-assets.html` dashboard.
