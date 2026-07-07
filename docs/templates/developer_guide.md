# Technical Template: Developer Onboarding and System Setup Guide
> **System Status**: MODEL TEMPLATE | **Version**: 1.0.0 | **Classification**: TECHNICAL STANDARDS

---

## 1. Document Specification

- **Purpose**: Establishes a step-by-step developer onboarding manual covering environment setups, workspace rules, API configuration keys, and dependency guidelines.
- **Audience**: Onboarding engineers, core fullstack developers, QA testers, and tech contributors.
- **Prerequisites**: Access to the project's repository.
- **Dependencies**: None.
- **Related Documents**: `standards/writing_and_markdown.md`.
- **Expected Length**: 800 - 1500 words.
- **Maintenance Frequency**: Updated upon dependency changes or framework upgrades.
- **Owner**: DevOps Lead / Principal Fullstack Engineer.
- **Review Checklist**: Verify local command correctness, check environmental variable mappings, validate port rules, ensure troubleshooting scenarios are realistic.
- **Completion Criteria**: A new engineer can clone the repository and run the full stack locally within 30 minutes with zero developer assistance.
- **Versioning Strategy**: Minor updates map to library version changes; major updates map to tool stack rewrites (e.g. migrating node runtime).

---

## 2. Fast-Track Developer Onboarding (Copy and Complete)

Welcome to the AgriSense AI engineering team. Follow this runbook to boot up the system workspace locally.

### 2.1 Workspace Requirements
Ensure your host machine has the following dependencies pre-installed:
*   **Runtime Engine**: Node.js `v20.x` or higher
*   **Package Manager**: `npm v10.x` or higher
*   **Isolated Environments**: Docker Desktop (for container builds)
*   **Database Client**: Drizzle CLI or TablePlus (for viewing schemas)

### 2.2 Clone and Bootstrap the Workspace
Run the following terminal commands to retrieve the codebase and initialize dependencies:

```bash
# Clone the repository
git clone https://github.com/your-org/agrisense-ai.git
cd agrisense-ai

# Install top-level and workspace dependencies
npm install
```

---

## 3. Environment Variables Configuration

We maintain an explicit, secret-free `.env.example` file in the root directory. To bootstrap your local environment, copy this example to create your localized `.env` file:

```bash
cp .env.example .env
```

### Required Configuration Keys
Ensure you populate your `.env` with valid keys. **NEVER** commit actual secrets or client tokens to the repository.

| Key Name | Sample Value | Required For | Security Constraints |
| :--- | :--- | :---: | :--- |
| `GEMINI_API_KEY` | `AIzaSyD7...` | AI inference models | High-risk secret. Keep strictly hidden. |
| `NEXT_PUBLIC_API_URL`| `/api/v1` | Frontend API client | Safe for client-side bundle exposure. |
| `DATABASE_URL` | `postgresql://...` | Database connection | Private database credential. |

---

## 4. Run commands reference

All developers should use the standard workspace scripts defined in the root `package.json`:

*   **Launch Development Server**: `npm run dev`
    *   *Port Configuration*: The development server runs strictly on **Port 3000** behind our nginx reverse proxy. Do not configure custom ports.
*   **Compile Codebase**: `npm run build`
    *   *Output Target*: Prepares static optimized files inside the `dist/` and `.next/` directories.
*   **Execute Linters**: `npm run lint`
    *   *Strict Verification*: Automatically scans files for type safety violations, style problems, and unused imports.

---

## 5. Coding Standards and Project Conventions

To ensure clean contributions, comply with these development conventions:

### 5.1 Type Safety First
*   Declare precise TypeScript interfaces or types for all API inputs and outputs.
*   **Zero Any Rule**: Avoid the use of the `any` keyword. All structural objects must be typed explicitly. If an external library lacks types, declare a custom wrapper signature block.
*   Never use `import type` to import values or enums. Use standard `import` blocks instead.

### 5.2 Commit Message Rules
We follow the conventional commit specification for all branch merges:
*   `feat(crops): add local coordinate validation helper`
*   `fix(weather): resolve openweather response mapping null check failure`
*   `docs(architecture): update c4 container diagram with cloud SQL replica maps`
