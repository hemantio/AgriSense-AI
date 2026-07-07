# AgriSense AI: Global Documentation Architecture Master Specification
> **System Status**: ACTIVE | **Version**: 1.0.0-draft | **Classification**: TECHNICAL STANDARDS

Welcome to the central blueprint for the **AgriSense AI Documentation Ecosystem**. This specification designs, establishes, and governs a multi-decade documentation architecture designed to scale seamlessly from Version 1.0 to Version 10.0 and beyond. It serves as the single source of truth (SSOT) for all developers, architects, product designers, machine learning practitioners, DevOps engineers, and security compliance officers on this project.

---

## 1. Directory Structure

To prevent sprawling "monolithic" files and optimize for modular, high-performance maintainability, the documentation is divided into self-contained sub-directories with clear domain ownership:

```text
/docs/
├── README.md                           # Master Index, Architecture Map & Governance Rules
├── standards/                          # Design-time and write-time rule constraints
│   ├── writing_and_markdown.md         # Writing tone, style guides, and Markdown syntax rules
│   └── diagrams_and_assets.md          # Unified visual/C4 diagram and static asset guidelines
├── processes/                          # Workflows binding code changes to documentation updates
│   ├── engineering_workflow.md         # Gate-by-gate documentation requirements per feature
│   └── documentation_governance.md     # Ownership matrix, review checklists, and release cycles
├── templates/                          # Reusable, copy-paste ready documentation boilerplates
│   ├── adr.md                          # Architecture Decision Record (ADR) template
│   ├── api.md                          # REST, Streaming, and SSE API interface template
│   ├── database.md                     # Data model, migration, indexing, and scaling template
│   ├── ai_pipeline.md                  # CIE, System prompts, vision filters, and safety template
│   ├── design_system.md                # Component patterns, colors, motion, and a11y template
│   ├── developer_guide.md              # Environment setup and module architecture template
│   └── user_guide.md                   # End-user training, flows, and onboarding templates
├── architecture/                       # Static core technical specifications (System Design)
│   ├── core_c4_design.md               # Context, Containers, Components and Deployment maps
│   ├── authentication_and_rbac.md      # Dual-role Auth, Token handshakes, and route policies
│   └── data_flow_and_pipelines.md      # Weather pooling, OCR parsing, and CIE pipeline mechanics
└── modules/                            # Directory containing active feature & subsystem logs
    ├── landing_website.md              # Single-page visual showcase & SEO configuration
    ├── admin_coordinator_portal.md     # Admin verification, analytics, and CRM dashboard
    ├── farmer_companion_app.md         # Farmer companion responsive dashboard and map components
    └── backend_engine/                 # Back-end specific technical micro-manuals
        ├── weather_intelligence.md     # OpenWeather integration and alerts dispatcher
        ├── crop_diagnostics.md         # Leaf image processing and treatment pipeline
        └── simulation_sandbox.md       # Climate threat sandbox and simulation matrix
```

---

## 2. Documentation Philosophy: "Doc-as-Code"

The core tenets of the AgriSense AI documentation system are:
1. **Single Responsibility Principle (SRP)**: Every markdown document must fulfill exactly one objective, serve a specific audience, and represent a clear architectural boundary.
2. **Deterministic Tracking**: Documentation and code live in the same repository. A feature is not complete (`Definition of Done`) unless its corresponding documentation updates are reviewed, linted, and merged in the same pull request.
3. **No Placeholders**: Writing "TODO", "detailed explanation goes here", or leaving blank tables is strictly forbidden. If a subsystem is not yet fully engineered, document its *specification* or its *planned roadmap boundary* explicitly.
4. **Architectural Honesty**: Exclude tech-larping, simulated telemetry indicators, and fake terminal lines. Documentation must deal with physical configurations, verifiable network ports, live schemas, and verified mathematical models.

---

## 3. The Document Blueprint Matrix
Every markdown file generated under `/docs/` must strictly implement the standard metadata envelope defined below. 

### Standard Metadata Header Template
```markdown
---
id: <UNIQUE-SLUG-ID>
title: <HUMAN-READABLE-TITLE>
type: <adr | specification | standard | guide | process>
status: <draft | proposed | approved | deprecated>
owner: <ROLE-OR-TEAM-SLUG>
version: <SEMANTIC-VERSION>
last_updated: <YYYY-MM-DD>
audience: <developers | architects | devops | qa | ui-designers | ai-engineers | users>
---
```

---

## 4. Master Document Catalog
Below is the core index of all architectural and process documents. It outlines their purpose, audience, prerequisites, dependencies, and relation rules:

| Document Path | Purpose | Primary Audience | Maintenance Trigger |
| :--- | :--- | :--- | :--- |
| `standards/writing_and_markdown.md` | Ensures strict writing standards, formatting, and typography rules. | All Contributors | Every major release |
| `standards/diagrams_and_assets.md` | Governs C4 diagram styling and media file assets. | System Architects | When a new diagram tool is adopted |
| `processes/engineering_workflow.md` | Binds feature lifecycle phases to documentation gates. | Product Managers / Devs | Changes to the CI/CD pipeline |
| `processes/documentation_governance.md`| Details review gates, pull requests, and ownership. | Technical Writers / Leads | Changes in organizational roles |
| `architecture/core_c4_design.md` | High-level system topology map (C4 Context/Container). | Architects / New Devs | Any microservice topology change |
| `architecture/authentication_and_rbac.md`| Security specs, token mechanics, and routing shields. | Security & Backend Devs | Changes to OAuth or Auth schemas |
| `architecture/data_flow_and_pipelines.md`| Multi-source async event parsing sequences. | Data & AI Engineers | Changes to the CIE or OCR pipelines |
| `modules/landing_website.md` | Details landing layout and interactive particle assets. | Frontend Devs / Designers | Major brand updates |
| `modules/admin_coordinator_portal.md` | Details admin management panel and verification flows.| Frontend / Fullstack Devs | Adjustments to the plot verification workflow |
| `modules/farmer_companion_app.md` | Mobile-responsive dashboard components & Map specs. | Frontend / UX Designers | Leaflet map upgrade, layout change |
| `modules/backend_engine/` | Outlines the FastAPI router paths, schemas, and logic. | Backend Engineers | New API route addition or modification |

---

## 5. Maintenance and Lifecycle Workflows
The life of a document follows a structured state machine:

```text
 [ Draft ] ──(Submit PR)──> [ Under Review ] ──(Approval)──> [ Approved / Active ]
                                                                   │
                                                                   ├──(Architectural Change)──> [ Revised ]
                                                                   │
                                                                   └──(Replacement)───────────> [ Deprecated ]
```

- **Drafting**: Author creates the `.md` file using the appropriate template in a local feature branch.
- **Review**: The document is pushed to a PR. The specified **Owner** checks it against the "Review Checklist" and "Completion Criteria".
- **Publishing**: On merging the PR, the document is published and its semantic version incremented (e.g., `1.0.0` -> `1.1.0` for feature additions).
- **Archiving/Deprecation**: When a system component is deleted, the document is moved into a `/docs/archive/` sub-directory and its status is set to `deprecated`, with a clear reference to the replacing document.

---

## 6. How to Use this Specification
- **For New Developers**: Start with `docs/templates/developer_guide.md` and check `docs/architecture/core_c4_design.md` to run the local server.
- **For AI Engineers**: Refer to `docs/templates/ai_pipeline.md` before altering prompt parameters or switching between Gemini models.
- **For DevOps Engineers**: Refer to `docs/templates/deployment.md` for secret bindings, container ports, and health probe intervals.

*This specification is subject to continuous governance. All suggestions or changes must be submitted via formal Pull Request to the technical writing board.*
