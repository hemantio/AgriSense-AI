# Technical Template: System Release Notes
> **System Status**: MODEL TEMPLATE | **Version**: 1.0.0 | **Classification**: TECHNICAL STANDARDS

---

## 1. Document Specification

- **Purpose**: Establishes a template for chronicling software product releases, detailing bug fixes, performance updates, system migrations, and version tags.
- **Audience**: End users, client support, developers, operations teams, and marketing leads.
- **Prerequisites**: Access to the release commit history.
- **Dependencies**: None.
- **Related Documents**: `standards/writing_and_markdown.md`.
- **Expected Length**: 300 - 800 words per release.
- **Maintenance Frequency**: Updated on every product release cycle.
- **Owner**: Technical Writer / Release Manager.
- **Review Checklist**: Verify exact commit hashes, check for clear and simple writing, validate version tagging, check upgrade guidelines.
- **Completion Criteria**: Pristine, readable, and objective release notes ready for public dispatch or dashboard logs.
- **Versioning Strategy**: Incremented in line with SemVer release guidelines.

---

## 2. Release Frontmatter (Copy and Complete)

```markdown
---
version: vX.Y.Z  # e.g., v1.1.0, v1.0.1
release_date: YYYY-MM-DD
author: <NAME / RELEASE MANAGER>
commit_range: <COMMIT-START-HASH>...<COMMIT-END-HASH>
status: <draft | published>
---
```

---

## 3. Executive Summary
*Provide a concise, plain-language description summarizing the focus of this release (e.g. "This release focuses on optimizing the crop health diagnostic upload process and introducing interactive climate sandboxes for farmers").*

---

## 4. What's New in vX.Y.Z

### 4.1 Major Features
*Detail major additions or user experience changes. Do not use overly promotional language.*

*   **Feature Name**: Description of what was added, how to access it in the interface, and why it benefits the user.
*   **Feature Name**: ...

### 4.2 Improvements and Enhancements
*Specify performance tuning, visual adjustments, or system optimizations.*

*   **Performance Optimization**: Reduced page-load overhead by 30% by lazyloading image assets.
*   **Security Update**: Upgraded default password requirements and refined token expiration boundaries.

### 4.3 Bug Fixes
*List bugs resolved with explicit references to ticket IDs.*

*   **Ticket-101 (Weather)**: Resolved a critical mapping issue where regional weather alerts failed to display due to coordinate rounding issues.
*   **Ticket-104 (Database)**: Fixed a thread locking problem during high-volume database queries.

---

## 5. Upgrade and Migration Runbook

*Detail the steps required for sysadmins or DevOps to safely apply this release.*

1.  **Database Migrate**: Execute database migrations via Drizzle/Alembic:
    ```bash
    npm run db:migrate
    ```
2.  **Env Updates**: Ensure the new `GEMINI_API_KEY` is registered inside Google Cloud Secret Manager.
3.  **Deploy Container**: Pull and deploy the updated container:
    ```bash
    gcloud run services update backend-service --image gcr.io/agrisense-ai/backend:vX.Y.Z
    ```
