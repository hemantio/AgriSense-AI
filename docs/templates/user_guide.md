# Technical Template: User Onboarding and Operations Guide
> **System Status**: MODEL TEMPLATE | **Version**: 1.0.0 | **Classification**: TECHNICAL STANDARDS

---

## 1. Document Specification

- **Purpose**: Establishes a template for comprehensive, plain-language end-user training, onboarding checklists, role boundaries, and troubleshooting steps.
- **Audience**: Farmers, agricultural advisors, coordinator admins, and customer support representatives.
- **Prerequisites**: Access to the live web portal or mobile companion app.
- **Dependencies**: None.
- **Related Documents**: `standards/writing_and_markdown.md`.
- **Expected Length**: 800 - 1500 words per user manual.
- **Maintenance Frequency**: Updated with every major customer-facing release.
- **Owner**: Customer Support Lead / Principal Technical Writer.
- **Review Checklist**: Verify clear role division, check step-by-step instructions for clarity, ensure screenshots match current visual layouts, validate troubleshooting tips.
- **Completion Criteria**: Complete and fully mapped onboarding manuals with zero technical jargon.
- **Versioning Strategy**: Minor version changes reflect minor UI changes; major version changes reflect complete system layout reworks.

---

## 2. Onboarding Workflow: Step-by-Step

Welcome to AgriSense AI. Follow this quickstart guide to get up and running:

### Step 1: Portal Onboarding (Farmers and Admins)
- **Farmers**: Navigate to the onboarding link on your companion application, select "Register", and fill out your name, contact phone number, and primary village location.
- **Admins**: Request an admin sign-up invitation link from your system administrator.

### Step 2: Registering a Plot
1.  Navigate to the **Plots** section of your companion app.
2.  Select **Create Plot** to open the map interface.
3.  Center the map on your plot boundaries and tap the outline corners to log coordinates.
4.  Specify the soil type (Clay, Loam, Sandy) and approximate acreage.
5.  Save your plot boundaries. Your plot status will change to **Pending** verification.

### Step 3: Getting verified
- Once a plot is logged, regional Coordinator Admins review its coordinates.
- Upon successful validation, the status updates to **Verified** and triggers automated weather and crop recommendations.

---

## 3. Role Division and Boundary Matrix

AgriSense AI maintains strict separation of responsibilities between farmer users and admin coordinators:

```text
 Farmer (Inputs Plots, Scan Leaves, Logs Expenses) ──> [ Verification Bridge ] ──> Admin (Approves Plots, Manages Farmers)
```

| User Capability | Farmer Role | Admin Coordinator Role | Context / Description |
| :--- | :---: | :---: | :--- |
| **Manage Plots & Crops** | **Yes** | **Yes** (View Only) | Farmers can create, edit, or delete their own plot coordinates. |
| **Verify Plots** | No | **Yes** | Admins must verify and authorize logged plots. |
| **Register Farmers** | No | **Yes** | Admins manage user profiles and onboarding. |
| **Analyze Crop Health** | **Yes** | **Yes** | Both roles can run disease analyses on crop images. |

---

## 4. Subsystem Operation Guides

### 4.1 AI Leaf Diagnostic Scanner
1.  Open the **Crop Health** section of your companion app.
2.  Ensure your target plant leaf is centered, well-lit, and clean. Avoid shadow blockage.
3.  Tap **Capture Image** or select an existing photo from your photo library.
4.  Submit the photo for analysis.
5.  Review the returned diagnostic analysis:
    *   **Identified Disease**: Displays the primary fungal or bacterial infection.
    *   **Treatment Options**: Split into **Organic Treatment** (bio-pesticides, spacing) and **Chemical Treatment** (chemical products).

### 4.2 Climate Threat Simulator
1.  Navigate to the **Simulation Sandbox** in your dashboard.
2.  Choose a simulated threat scenario (e.g., Drought, Heavy Monsoon Downpour, Pest Outbreak).
3.  Configure parameters (e.g., Temperature, Rainfall, Days Without Rain).
4.  Tap **Run Simulation** to execute the scenario.
5.  Review the risk report, warning alerts, and mitigation countermeasures.

---

## 5. Troubleshooting Operational Anomalies

If you encounter system issues, check these troubleshooting guidelines before raising a support ticket:

### 5.1 Issue: Unable to register a plot
*   *Cause*: GPS coordinates are missing or fail to resolve.
-   *Solution*: Check that your browser or mobile device has permission to access your location. Ensure you have a clear sky view to obtain a GPS lock.

### 5.2 Issue: Leaf diagnostic returns "Unclear diagnosis"
*   *Cause*: Photo capture has heavy shadow distortion, is out of focus, or is not a plant leaf.
-   *Solution*: Recapture the leaf image under indirect sunlight, ensuring the leaf is flat and fills the image frame.

---

## 6. Support Channels and Feedback Loops

If your issue persists:
*   **Email Support**: Send a detailed ticket containing device specs and screenshots to `support@agrisense.ai`.
*   **Support Line**: Call `+91 99999 88888` during business hours for direct agronomic assistance.
