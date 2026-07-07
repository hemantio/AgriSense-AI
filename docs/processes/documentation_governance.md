# Process Specification: Documentation Governance, Ownership, and Versioning
> **System Status**: ACTIVE | **Version**: 1.0.0 | **Classification**: TECHNICAL STANDARDS

---

## 1. Document Specification

- **Purpose**: Establishes strict ownership matrices, review checklists, change tracking rules, and versioning models to ensure absolute alignment of code and documentation.
- **Audience**: Technical leads, project maintainers, documentation authors, and code reviewers.
- **Prerequisites**: High-level understanding of git workflows and semantic versioning constraints.
- **Dependencies**: None.
- **Related Documents**: `processes/engineering_workflow.md`.
- **Expected Length**: 800 - 1200 words.
- **Maintenance Frequency**: Annually.
- **Required Diagrams**: Core governance responsibility workflow.
- **Owner**: Head of Quality Assurance / Documentation Lead.
- **Review Checklist**: Verify exact ownership bounds, validate change-tracking conventions, check syntax of automated markdown linters.
- **Completion Criteria**: Formal establishment of ownership rules with explicit role allocations for all document categories.
- **Versioning Strategy**: Minimal formatting updates mapped to patches (x.y.Z), functional content changes mapped to minors (x.Y.z), framework transitions mapped to majors (X.y.z).

---

## 2. Documentation Ownership Matrix

To prevent documents from becoming stale, orphaned, or unmaintained, every category of documentation inside the AgriSense AI project has a designated **Owner Role**. 

The Owner Role is directly accountable for:
*   Continuous accuracy of the documented contents.
*   Reviewing and approving pull requests affecting their documentation domain.
*   Scheduling periodic audits of the manuals.

| Document Sub-Directory | Primary Owner Role | Backup Reviewer Role | Target Audience |
| :--- | :--- | :--- | :--- |
| `/docs/standards/` | Lead Software Architect | Principal Technical Writer | All Contributors |
| `/docs/processes/` | Technical Program Manager | Head of Quality Assurance | Project Managers / Devs |
| `/docs/templates/` | Lead Software Architect | Documentation Lead | All Contributors |
| `/docs/architecture/` | Cloud Solutions Architect | Senior Backend Engineer | Developers / DevOps |
| `/docs/modules/` | Sub-system Component Owner| Quality Assurance Lead | Developers / QA |

---

## 3. Review and Approval Workflows

No documentation change may bypass peer review. The PR process for documentation must mimic the standard source-code validation flow:

```text
  Author Commits Change  ──>  Markdown Linter Passes  ──>  Owner Peer Review  ──>  Merged to Main
```

### 3.1 Documentation Peer-Review Checklist

Any reviewer assigned to a documentation PR must explicitly verify the following conditions before granting approval:

- [ ] **Path Accuracy**: All referenced file paths use absolute paths starting from the workspace root (e.g. `/client/src/app/...`).
- [ ] **Formatting Consistency**: Heading structures match the styles defined in `standards/writing_and_markdown.md`.
- [ ] **No Placeholders**: The change contains zero "TODO" statements, blank tables, or dummy text snippets.
- [ ] **Code Compliance**: Code examples comply with standard TypeScript/FastAPI requirements (no public secrets, named imports, standard enums).
- [ ] **Contrast & Accessibility**: All embedded visuals or mermaid layouts use high-contrast color settings.

---

## 4. Change Tracking and Log Conventions

All modifications to files within `/docs/` must be registered in the file's own embedded frontmatter log OR appended to a regional `CHANGELOG.md` inside that directory.

### Change Log Entry Format
```markdown
### [Version] - YYYY-MM-DD
- **Author**: <NAME / USERNAME>
- **Type**: <Structure Change | Content Update | Bug Fix | Security Update>
- **Ref Code**: <JIRA-TICKET-ID or PR-ID>
- **Description**: Concise statement of what was updated and why (e.g., "Updated OpenWeather REST response schema mapping for open cloud run configurations").
```

---

## 5. Versioning Strategy: Semantic Documentation (SemDoc)

AgriSense AI adopts **Semantic Documentation (SemDoc)**, matching document version indicators directly to system architecture changes:

```text
   MAJOR VERSION (X.y.z) ──> Critical framework/infrastructure rewrite (e.g., migrating backend from SQLite to PostgreSQL)
   MINOR VERSION (x.Y.z) ──> Structural additions (e.g., adding a new component or module specification)
   PATCH VERSION (x.y.Z) ──> Corrective updates (e.g., typo fixes, visual layout upgrades, URL additions)
```

### Sync Rules:
When a pull request introduces system changes that increment the application build version, the documentation's frontmatter version must be incremented in the same commits. This guarantees version alignment.

---

## 6. Document Automation and Verification Gates

To preserve structural syntax rules automatically, the AgriSense AI pipeline runs validation linters:
1.  **Markdown Linting**: Automatically checks line wrap lengths, empty heading boundaries, and list nesting.
2.  **Broken Link Scanning**: Scans for invalid relative or absolute cross-references inside `/docs/` and reports broken file maps as build errors.
3.  **Spell Check**: Scans for misspelled jargon or non-standard acronyms.

*These automated checks must run and pass on every commit prior to obtaining peer-review clearances.*
