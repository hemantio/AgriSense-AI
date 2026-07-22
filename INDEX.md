# AgriSense AI — Master Project Index & Codebase Catalog

> **Indexed on:** 2026-07-22  
> **Repository:** `AgriSense-AI`  
> **Architecture:** Decoupled Clean / Modular Monolith  
> **Primary Tech Stack:** Python 3.12 (FastAPI), Next.js 16, Flutter, PostgreSQL 16 / SQLite, Three.js  

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [Subsystem & Directory Index](#2-subsystem--directory-index)
3. [Backend Service Index (`server/`)](#3-backend-service-index-server)
   - [Core Application Models](#31-core-application-models)
   - [API Routers & Endpoints](#32-api-routers--endpoints)
   - [Repositories & Data Access Layer](#33-repositories--data-access-layer)
   - [AI & Decision Engine Architecture](#34-ai--decision-engine-architecture)
   - [RAG Knowledge Store & Indexing](#35-rag-knowledge-store--indexing)
4. [Web Client Index (`client/`)](#4-web-client-index-client)
   - [Page Route Registry](#41-page-route-registry)
   - [State Management & Data Layer](#42-state-management--data-layer)
5. [Mobile Application Index (`farmerapp/`)](#5-mobile-application-index-farmerapp)
6. [3D Visual Experience Index (`3d-landing-page/`)](#6-3d-visual-experience-index-3d-landing-page)
7. [Documentation & Design System Catalog](#7-documentation--design-system-catalog)
8. [Database Schema & Migration Index](#8-database-schema--migration-index)
9. [Environment & Deployment Configuration](#9-environment--deployment-configuration)

---

## 1. Executive Overview

**AgriSense AI** is an enterprise-grade Intelligent Farm Management and Agricultural Decision Support System. It blends real-time micro-climate weather telemetry, AI-assisted crop disease diagnosis, pesticide/fertilizer OCR label extraction, crop budget/expense analytics, and multi-provider generative AI recommendation engines.

```
                                  ┌───────────────────────────────┐
                                  │      AgriSense AI System      │
                                  └───────────────┬───────────────┘
                                                  │
         ┌────────────────────────┬───────────────┴───────────────┬────────────────────────┐
         │                        │                               │                        │
┌────────┴────────┐      ┌────────┴────────┐             ┌────────┴────────┐      ┌────────┴────────┐
│  Next.js Client │      │ FastAPI Backend │             │  Flutter Mobile │      │ 3D Portal       │
│  (Web Dashboard)│      │ (REST API & AI) │             │  (Offline Sync) │      │ (Scroll-Anim)   │
└─────────────────┘      └────────┬────────┘             └─────────────────┘      └─────────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  │ Data & Intelligence Layer     │
                  │ PostgreSQL 16 (pgvector)      │
                  │ Redis 7 / Celery Task Engine  │
                  │ Google Vertex AI & Gemini RAG │
                  └───────────────────────────────┘
```

---

## 2. Subsystem & Directory Index

| Subsystem / Path | Role & Purpose | Core Technologies | Key Files |
| :--- | :--- | :--- | :--- |
| [`server/`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server) | Backend REST API, RAG Knowledge Index, AI Engine, DB ORM | FastAPI, Async SQLAlchemy 2.0, Celery, Redis | `app/main.py`, `seed_knowledge.py`, `seed_db.py` |
| [`client/`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/client) | Web Management Portal & Analytics Dashboard | Next.js 16, React 19, Zustand, TanStack Query | `src/app/dashboard/page.tsx`, `src/middleware.ts` |
| [`farmerapp/`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/farmerapp) | Mobile app for field operation and offline logging | Flutter 3.x, BLoC Pattern, SQLite | `lib/main.dart`, `pubspec.yaml` |
| [`3d-landing-page/`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/3d-landing-page) | Immersive 3D interactive marketing & twin portal | Three.js, GSAP ScrollTrigger, HTML5 Canvas | `index.html`, `app.js`, `style.css` |
| [`docs/`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/docs) | Architecture docs, AI guides, process standards | Markdown | `DOCUMENTATION_ARCHITECTURE.md`, `README.md` |
| [`.agents/`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/.agents) | AI Agent skill definitions and tool configurations | Custom JSON / Markdown Skills | `skills/` |

---

## 3. Backend Service Index (`server/`)

### 3.1 Core Application Models

Located in [`server/app/models/`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/models):

- **[`user.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/models/user.py)**: Farmer/admin authentication accounts, roles (`admin`, `farmer`, `agronomist`), hashed passwords, contact details.
- **[`plot.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/models/plot.py)**: Spatial land boundaries, acreage, soil pH, organic matter content, GPS centroid coordinates.
- **[`crop.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/models/crop.py)**: Active and historical crop cycles, target yields, planting dates, harvest dates, stage trackers.
- **[`expense.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/models/expense.py)**: Financial log entries categorized by seeds, fertilizers, labor, equipment, irrigation, and transport.
- **[`input_record.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/models/input_record.py)**: Agrochemical application logs including active ingredient, dosage, vendor label OCR metrics.
- **[`health_record.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/models/health_record.py)**: AI crop disease scan results, confidence scores, visual symptom bounding boxes, prescribed treatments.
- **[`weather.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/models/weather.py)**: Hourly & daily micro-climate telemetry (temperature, humidity, rainfall, wind speed, solar radiation).
- **[`irrigation.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/models/irrigation.py)**: Moisture level recordings, pump run logs, automated drip schedule events.
- **[`simulation.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/models/simulation.py)**: Offline sandbox scenarios for stress testing drought, heatwave, and disease outbreak outcomes.
- **[`chat.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/models/chat.py)**: `KnowledgeEmbedding` model storing 768-dimensional vector chunks for RAG search.
- **[`mixins.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/models/mixins.py)**: Standardized audit columns (`id` UUID, `created_at`, `updated_at`, `is_deleted` soft-delete flag).

### 3.2 API Routers & Endpoints

Located in [`server/app/routers/`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/routers):

- **`/api/auth`** ([`auth.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/routers/auth.py)): User registration, JWT login/refresh, session validation.
- **`/api/crops`** ([`crops.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/routers/crops.py)): Lifecycle management for farm crops and yield forecasting.
- **`/api/dashboard`** ([`dashboard.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/routers/dashboard.py)): Central KPI aggregation, operational summaries, multi-plot statistics.
- **`/api/expenses`** ([`expenses.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/routers/expenses.py)): Cost tracking, budgetary breakdowns, financial analytics endpoints.
- **`/api/farmers`** ([`farmers.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/routers/farmers.py)): Operator directory, access controls, assignment mapping.
- **`/api/health`** ([`health.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/routers/health.py)): AI disease scan submissions, diagnostic history, remediation guides.
- **`/api/inputs`** ([`inputs.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/routers/inputs.py)): Agrochemical and fertilizer inventory logs and OCR ingestion.
- **`/api/plots`** ([`plots.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/routers/plots.py)): Plot geospatial bounds, soil analytics, spatial query endpoints.
- **`/api/recommendations`** ([`recommendations.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/routers/recommendations.py)): AI decision engine query router powered by RAG vector context.
- **`/api/simulation`** ([`simulation.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/routers/simulation.py)): Interactive weather/disease simulation runner.
- **`/api/weather`** ([`weather.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/routers/weather.py)): Real-time microclimate forecast feeds and extreme weather alerts.

### 3.3 Repositories & Data Access Layer

Located in [`server/app/repositories/`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/repositories):

- **`base.py`**: Generic repository enforcing soft-delete filtering, pagination, transactional boundaries.
- **`crop_repository.py`**, **`expense_repository.py`**, **`health_repository.py`**, **`input_repository.py`**, **`plot_repository.py`**, **`user_repository.py`**: Domain-specific query optimizations.

### 3.4 AI & Decision Engine Architecture

Located in [`server/app/services/ai/`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/services/ai):

- **Factory Pattern (`factory.py`)**: Dynamically selects AI execution driver:
  1. `VertexAIProvider` ([`vertex_provider.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/services/ai/vertex_provider.py)): Native GCP Vertex AI enterprise deployment.
  2. `GeminiProvider` ([`gemini_provider.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/services/ai/gemini_provider.py)): Direct Gemini API (Google AI Studio).
  3. `MockProvider` ([`mock_provider.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/services/ai/mock_provider.py)): Offline deterministic simulation fallback.

### 3.5 RAG Knowledge Store & Indexing

- **Vector Service**: [`vector_store.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/app/services/ai/vector_store.py) converts text into 768-dimensional vectors using `models/text-embedding-004`. Performs cosine similarity search using pgvector in PostgreSQL or native math in SQLite.
- **Knowledge Seeding & Indexing Script**: [`seed_knowledge.py`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/seed_knowledge.py) indexes agricultural manuals, disease databases, government schemes (PM-KISAN, PMFBY), regional best practices, and approved chemical guidelines.

---

## 4. Web Client Index (`client/`)

### 4.1 Page Route Registry

Located in [`client/src/app/`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/client/src/app):

- **`/`** (`page.tsx`): Main client entrance page.
- **`/login`**: Secure authentication gateway.
- **`/dashboard`**: Operational overview, widget stats, activity summary.
- **`/dashboard/crops`**: Interactive crop cycle planner and health state tracker.
- **`/dashboard/expenses`**: Financial ledger, cost charts, ROI projections.
- **`/dashboard/farmers`**: Team directory and privilege assignment.
- **`/dashboard/health`**: AI disease scanner interface and diagnosis logs.
- **`/dashboard/inputs`**: Inventory tracking and product OCR scanner.
- **`/dashboard/plots`**: Interactive map grid of farm plots and soil health metrics.
- **`/dashboard/settings`**: Application configuration and API key setup.
- **`/dashboard/simulation`**: Offline climate & disease sandbox simulator.
- **`/dashboard/weather`**: Detailed weather forecast telemetry and alert configuration.

### 4.2 State Management & Data Layer

- **Global Store**: Built using **Zustand** ([`client/src/stores/`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/client/src/stores)).
- **Query Cache**: Powered by **TanStack Query (React Query)** for optimistic updates and caching.
- **Middleware**: [`middleware.ts`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/client/src/middleware.ts) handles session verification and route protection.

---

## 5. Mobile Application Index (`farmerapp/`)

The mobile application is designed for low-connectivity field operations using Flutter.

- **`lib/main.dart`**: Application entry point and theme initializer.
- **`lib/screens/`**: Native mobile views for disease capture, offline log sync, telemetry alerts, and advisory feeds.
- **`lib/services/`**: SQLite local database cache and background API sync runner.

---

## 6. 3D Visual Experience Index (`3d-landing-page/`)

An interactive marketing and agricultural digital twin portal powered by Three.js.

- **`index.html`**: Core HTML5 canvas layout and portal landing page.
- **`app.js`**: GSAP ScrollTrigger sequence controller and particle system visualizer.
- **`style.css`**: Agrarian Codex glassmorphism and animated overlay styling.
- **`3d-assets.html`**: Complete catalog showroom of 3D farmland visual components.

---

## 7. Documentation & Design System Catalog

- **[`README.md`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/README.md)**: Quickstart guide and Docker one-command initialization.
- **[`PROJECT_STRUCTURE.md`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/PROJECT_STRUCTURE.md)**: Extended module breakdown document.
- **[`BRANDING.md`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/BRANDING.md)**: "The Agrarian Codex" color tokens (`#10B981`, `#030303`, `#F59E0B`) and typography rules.
- **[`DESIGN.md`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/DESIGN.md)**: Component specs, state transitions, micro-animations.
- **[`PRODUCT.md`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/PRODUCT.md)**: Product roadmap and user stories.
- **[`Project Requirements Document.md`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/Project Requirements Document.md)**: Formal PRD specification.
- **[`AgriSense_AI_Project_Report.md`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/AgriSense_AI_Project_Report.md)**: Comprehensive technical audit and system specification report.

---

## 8. Database Schema & Migration Index

- **ORM Engine**: SQLAlchemy 2.0 Async Engine with SQLite or PostgreSQL support.
- **Migration System**: **Alembic** ([`server/alembic/`](file:///c:/Users/Admin/agri%20sens%20Ai/AgriSense-AI/server/alembic)).
- **Seeding Scripts**:
  - `seed_db.py`: Seeds realistic plots, crop cycles, weather logs, expenses, and disease records.
  - `seed_knowledge.py`: Populates RAG knowledge vector store with 768-dimensional embeddings.

---

## 9. Environment & Deployment Configuration

- **`docker-compose.yml`**: Full container orchestration for PostgreSQL 16, Redis 7, FastAPI Backend, Next.js Frontend.
- **`.env.example`**: Standard configuration template containing API keys, database URLs, JWT secrets, and AI provider choices.

---

*This index is automatically maintained to reflect the exact state of the AgriSense AI codebase.*
