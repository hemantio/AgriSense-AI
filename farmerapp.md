# AgriSense Farmer App — Mobile Companion Specification

The **AgriSense Farmer App** is a lightweight, mobile-first companion application (designed as a Progressive Web App (PWA) or hybrid mobile app) tailored for small-scale farmers in rural communities. 

Following **"The Agrarian Codex"** design principles, it prioritizes extreme outdoor readability, high contrast, low cognitive load, and voice/audio-assisted workflows.

---

## 1. Product Vision & UX Goals

- **Extreme Accessibility**: Large typography, simple semantic icons, and touch targets of at least `48px x 48px` to accommodate field workers.
- **Voice-First Integration**: A prominent speaker button beside every diagnostic report, alert, and recommendation, triggering local Text-to-Speech (TTS).
- **Offline Resilience**: Cache critical weather alerts, crop logs, and offline form inputs using service workers, syncing data when cellular networks become available.
- **Visual Clarity**: Highly legible green and amber colors to communicate crop health status and warnings immediately without forcing farmers to read small-size text.

---

## 2. Design Tokens & UI Architecture (Mobile)

We adapt the core **Agrarian Codex** design tokens for mobile/outdoor visibility:

| Token | Value | Mobile Application Context |
| :--- | :--- | :--- |
| **Primary Color** | `#10b981` (Living Emerald) | Affirmative states, camera triggers, success highlights. |
| **Accent Color** | `#ffb1ee` (Orchid Petal) | Voice/Audio playback controls and audio recording buttons. |
| **Danger Color** | `#ef4444` (Rust Red) | Critical weather alerts, pest outbreaks, severe crop alerts. |
| **Warning Color** | `#f59e0b` (Amber Orange) | Advisories (e.g., pending verifications, weather warnings). |
| **Neutral BG** | `#030303` (Absolute Soil) | Base app dark canvas (ideal for outdoor sun glare reduction). |
| **Text Primary** | `#fafafa` (Grounded White) | Header and core advisory text (high readability). |
| **Rounded Scale** | `sm: 6px`, `md: 8px` | Maximum boundary rounding for touch components. |

---

## 3. Core Screens & User Flows

### 3.1 Screen A: Home / Unified Telemetry Dashboard
The main screen provides a high-contrast feed of immediate alerts and primary quick-actions.
- **Visual Elements**:
  - **Live Weather Hub**: Giant temperature and rain probability display with simple sky icons.
  - **Quick Scan Hero Banner**: A giant card (Living Emerald background) with a camera icon reading: **"📸 SCAN CROP HEALTH NOW"**.
  - **Recent advisories list**: Crucial crop care tasks.
- **Voice Loop**: Clicking the **"Listen"** icon at the top plays a summary: *"Good morning, Ramesh. Rain is expected at 4:00 PM. Do not apply fertilizer today."*

### 3.2 Screen B: AI Crop Health Scanner
Enables farmers to capture leaf images, submit them to the FastAPI server, and view live results.
- **Workflow**:
  1. User clicks **"Scan Crop"** → Opens native mobile camera.
  2. User captures photo → Displays instant thumbnail preview.
  3. User clicks **"Analyze"** → Triggers API upload with visual progress telemetry.
  4. Diagnostics panel reveals findings in plain language:
     - **Diagnosis**: *"Leaf Spot Fungus Detected."*
     - **Treatment (Organic)**: *"Spray neem oil solution."*
     - **Treatment (Chemical)**: *"Apply copper-based fungicide."*
- **Voice Integration**: A large **"🔊 Play Audio Report"** button reads the treatments aloud in the farmer's preferred language.

### 3.3 Screen C: Interactive Plot Map
Provides map marking for farm plot registration.
- **Workflow**:
  - Leverages React-Leaflet with dark-mode tile mapping.
  - Farmer taps screen corners to place boundary markers.
  - Auto-calculates approximate acreage.
  - Verification status badge clearly shows: **"Verification Pending (Admin Review)"** or **"Plot Verified"**.

### 3.4 Screen D: Expense & Input Logger
Allows farmers to log seed cost, labor, fertilizers, and sprays.
- **UX Features**:
  - Over-sized numeric keypad for easy entry.
  - Quick select categories with large organic icons (Seeds, Fertilizer, Pesticide, Labor, Tractor).
  - OCR scan mode: Farmer snaps a photo of a fertilizer bag label, and Tesseract automatically extracts brand and ingredients.

---

## 4. API Client Integration

The Farmer App connects directly to the FastAPI backend endpoints:

- **Authentication**: `POST /auth/login` (Returns access tokens and language preferences).
- **Plot Management**: `POST /plots/` and `GET /plots/` (Saves coordinates and GeoJSON polygons).
- **Crop Diagnostics**: `POST /health/analyze` (Uploads images to `/uploads/crop_health/`).
- **Telemetry Fetch**: `GET /dashboard/stats` (Loads statistics and active alerts).
- **Weather Fetch**: `GET /weather/forecast` (Retrieves local coordinates telemetry).

---

## 5. Technical Implementation Plan

1. **Frontend Foundation (PWA)**:
   - Next.js mobile-first layout using Tailwind CSS.
   - Configure Web App Manifest (`manifest.json`) and service workers (`sw.js`) for asset and routing caching.
2. **Audio Assist Engine**:
   - Integrate standard browser **Web Speech API** (`window.speechSynthesis`) for client-side multi-lingual Text-to-Speech (TTS) using local voices.
3. **Offline Sync Queue**:
   - Implement IndexedDB (via `idb` library) to save pending health scans and logs when offline, automatically posting them when `navigator.onLine` transitions to `true`.
