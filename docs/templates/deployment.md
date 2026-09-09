# Technical Template: Deployment and Infrastructure Runbook
> **System Status**: MODEL TEMPLATE | **Version**: 1.0.0 | **Classification**: TECHNICAL STANDARDS

---

## 1. Document Specification

- **Purpose**: Establishes a standard runbook for deploying backend/frontend services, configuring environment variables, establishing database connections, and managing secrets securely.
- **Audience**: DevOps engineers, cloud infrastructure engineers, and backend developers.
- **Prerequisites**: Access to GCP Console, Docker registries, and environment credentials.
- **Dependencies**: Cloud Run and Cloud SQL instances.
- **Related Documents**: `standards/writing_and_markdown.md`.
- **Expected Length**: 800 - 1500 words.
- **Maintenance Frequency**: Updated on major infrastructure upgrades or container schema migrations.
- **Owner**: Senior DevOps Engineer.
- **Review Checklist**: Verify secret manager configuration keys, check port and reverse-proxy parameters, validate health check endpoints, check disaster recovery steps.
- **Completion Criteria**: Complete and fully mapped deployment checklists with zero public secrets or misconfigured runtime ports.
- **Versioning Strategy**: Minor updates reflect library or image updates; major updates denote hosting provider migrations.

---

## 2. Infrastructure Overview and Target Topology (Copy and Complete)

The platform runs inside containerized environments managed by Google Cloud Run. 

### Target Deployment Map
```mermaid
graph TD
    classDef main fill:#1E3A8A,stroke:#1D4ED8,stroke-width:2px,color:#FFFFFF;
    classDef db fill:#0D9488,stroke:#0F766E,stroke-width:2px,color:#FFFFFF;

    Proxy[Nginx Reverse Proxy: Port 3000]:::main
    App[Next.js App: Cloud Run]:::main
    DB[(PostgreSQL: Cloud SQL)]:::db

    Proxy -->|Routes traffic| App
    App -->|Queries| DB
```

---

## 3. Environment Variables and Secrets Keyring

All secrets and sensitive production API keys must be stored in Google Cloud Secret Manager. **NEVER** inject raw values into application source code.

| Environment Key | Config Location | Encryption Required | Default Value (Staging) |
| :--- | :--- | :---: | :--- |
| `DATABASE_URL` | Cloud Secret Manager | **Yes** | `postgresql://db_user:pwd@host:5432/agri` |
| `GEMINI_API_KEY` | Cloud Secret Manager | **Yes** | `your_gemini_api_key_here` |
| `PORT` | Hardcoded / Platform Config | No | `3000` (Nginx routes traffic here) |

---

## 4. Step-by-Step Deployment Guide

Follow this sequence to build and deploy a service container to production:

### Step 1: Pre-deployment Checklist
- [ ] Run typescript compiler and linter (`npm run lint` and `npm run build`).
- [ ] Ensure database migrations are compiled and logged (`npm run db:generate`).
- [ ] Verify secret bindings inside Google Cloud Run configurations.

### Step 2: Build the Container Image
```bash
docker build -t gcr.io/agrisense-ai/backend:v1.0.0 .
```

### Step 3: Push to Registry
```bash
docker push gcr.io/agrisense-ai/backend:v1.0.0
```

### Step 4: Run Cloud SQL Migration Proxy
Prior to routing user traffic, apply the latest database schemas using connection proxies:
```bash
./cloud-sql-proxy --instances=project-id:region:instance-id=tcp:5432 &
npm run db:migrate
```

### Step 5: Deploy to Cloud Run
```bash
gcloud run deploy backend-service \
  --image gcr.io/agrisense-ai/backend:v1.0.0 \
  --platform managed \
  --port 3000 \
  --allow-unauthenticated
```

---

## 5. Container Monitoring and Health Checks

Every service container must specify clear container diagnostics:

*   **Liveness Probe**: GET `/api/v1/health`
    *   *Initial Delay*: 15 seconds
    *   *Timeout*: 2 seconds
    *   *Failure Threshold*: 3 attempts
*   **Readiness Probe**: GET `/api/v1/health/ready`
    *   *Initial Delay*: 5 seconds
    *   *Timeout*: 2 seconds
    *   *Failure Threshold*: 2 attempts

---

## 6. Disaster Recovery and Rollbacks

If a deployed container triggers elevated latency spikes (P95 > 5000ms) or generates constant HTTP 5xx error states:

1.  **Immediate Rollback**: Route traffic back to the previous stable container image tag immediately:
    ```bash
    gcloud run services update-traffic backend-service --to-revisions=backend-service-revision-prev=100
    ```
2.  **Snapshot Logs**: Extract all server logs inside Cloud Logging for post-mortem analysis.
3.  **Triage**: Match error footprints to known troubleshooting guidelines inside `docs/modules/`.
