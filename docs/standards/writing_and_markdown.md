# Engineering Standard: Writing, Typography, and Markdown Layout
> **System Status**: ACTIVE | **Version**: 1.0.0 | **Classification**: TECHNICAL STANDARDS

---

## 1. Document Specification

- **Purpose**: Establishes strict rules for grammar, tone, vocabulary, markdown formatting, and code snippets across the entire AgriSense AI documentation workspace.
- **Audience**: All software developers, technical writers, security teams, and engineering contributors.
- **Prerequisites**: High-level understanding of Markdown syntax and general technical documentation goals.
- **Dependencies**: None.
- **Related Documents**: `standards/diagrams_and_assets.md`.
- **Expected Length**: 800 - 1200 words.
- **Maintenance Frequency**: Semi-annually or upon adoption of new writing tools.
- **Required Diagrams**: None.
- **Owner**: Principal Technical Writer / Lead Architect.
- **Review Checklist**: Verify correct header structure, check for prohibited vocabulary, validate syntax coloring on all code blocks, ensure absolute path rules are respected.
- **Completion Criteria**: Complete adherence to markdown and typography guidelines with zero broken cross-references.
- **Versioning Strategy**: Minor version changes for formatting updates (1.0.x), major version changes for structural style updates (1.x.0).

---

## 2. Writing Tone and Style Guidelines

### 2.1 The Voice of Truth
Technical writing must be precise, objective, direct, and unambiguous. We follow a "Voice of Truth" philosophy:
*   **Avoid Hype and Flowery Adjectives**: Never call our codebase or system "stellar", "groundbreaking", "gorgeous", "state-of-the-art", or "jaw-dropping". Use literal, quantitative descriptors instead.
*   **No Technical Larping (Anti-AI-Slop)**: Do not include fake container runtime terminal lines, simulated network lag indicators (e.g., `[SYS_PING_9MS]`), or cosmetic status banners in structural layouts. If you are writing a tutorial, use real system commands and actual parameters.
*   **Write in the Active Voice**: Prefer active voice over passive voice wherever possible.
    *   *Bad*: "The API token is verified by the backend middleware."
    *   *Good*: "The backend middleware verifies the API token."
*   **Third-Person Objective**: Avoid pronouns like "I", "we", "us", or "you" in system specifications. Use role names (e.g., "The farmer companion app", "The system administrator", "The API client") instead.

### 2.2 Prohibited vs. Approved Vocabulary

To ensure clean, clear, and globally accessible phrasing, strictly adhere to the following vocabulary constraints:

| Prohibited Terms | Approved Alternatives | Rationale / Context |
| :--- | :--- | :--- |
| "simply", "just", "easy", "obviously" | "directly", "with the following steps" | These words are condescending and obscure actual technical complexity. |
| "smart intelligence", "brain-like AI" | "classification model", "CIE pipeline" | Avoid mystical personifications of neural networks. |
| "the cloud" | "Google Cloud Run / Cloud SQL" | Be precise about hosting infrastructure boundaries. |
| "DB", "data box" | "PostgreSQL instance", "Firestore database" | Ambiguity in database types causes developer confusion. |

---

## 3. Markdown Syntax and Layout Rules

To ensure consistent rendering across editors, IDEs, and hosting portals, all documentation files MUST conform to the following markdown rules:

### 3.1 Headings
*   Always start a document with a single Level 1 heading (`# Title`).
*   Ensure consecutive heading hierarchy levels are used sequentially. Do not jump from `#` to `###` without an intervening `##`.
*   Insert a single empty line before and after all headings.

### 3.2 Lists and Spacing
*   Use standard dashes (`-`) for unordered lists. Do not use asterisks (`*`) or plus signs (`+`).
*   Double spacing must be maintained between list levels and surrounding paragraphs.
*   For nested lists, indent exactly two spaces per level.

### 3.3 Tables
*   All tables must have clean alignment separators with a space before and after the pipe characters:
    *   *Correct*: `| Name | Type | Description |`
    *   *Incorrect*: `|Name|Type|Description|`
*   Tables must use text alignments explicitly where necessary (`:---` for left, `:---:` for center, `---:` for right).

### 3.4 Callouts and Blockquotes
Use standard GitHub-style markdown alert blocks for warnings, tips, and critical constraints:

```markdown
> [!IMPORTANT]
> This is a critical security rule. Never commit API keys or environment variables directly to the code repository.

> [!WARNING]
> This represents a destructive system action, such as executing a database migration.

> [!NOTE]
> This provides auxiliary background information or minor implementation details.
```

---

## 4. Code Snippet Guidelines

All code blocks must include explicit language syntax identifiers and represent authentic, syntactically correct, and compilable blocks.

### 4.1 Syntax Highlighting
Always declare the programming language next to the starting backticks:
```text
```typescript
// TS Code
```
```

Approved identifiers are: `typescript`, `python`, `json`, `yaml`, `bash`, `sql`, `css`, and `html`.

### 4.2 Handling Secrets and Placeholders
*   **NEVER** use real secrets or API keys in code snippets.
*   Always use descriptive, standard placeholders.
    *   *Correct*: `process.env.GEMINI_API_KEY = "your_gemini_api_key_here"`
    *   *Incorrect*: `process.env.GEMINI_API_KEY = "AIzaSy..."`

### 4.3 Code Quality and Type Imports
Within TypeScript code blocks:
*   Ensure all imports reside at the top of the code snippet.
*   Use explicit, named imports rather than destructive default imports.
*   Do not use `import type` to import values or enums.
*   Ensure enums use standard `enum` definitions rather than `const enum`.

```typescript
// ✅ Good standard-compliant code block
import { GoogleGenAI } from "@google/genai";
import { UserRole } from "./types";

export interface DBConfig {
  connectionLimit: number;
  poolTimeout: number;
}

export enum ConnectionState {
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
}
```

---

## 5. File and Path Naming Conventions

*   **File Names**: Use all lowercase, words separated by underscores (`_`). Example: `crop_health_pipeline.md`. Do not use camelCase or hyphens.
*   **Absolute Paths**: When referring to files in the codebase, always use absolute paths starting at the workspace root. Example: `/client/src/app/api/v1/[[...path]]/route.ts`. Never use relative paths like `../../api/v1/route.ts` as context changes can make them stale.

---

## 6. Review and Verification Checklist
Prior to pushing any documentation change, ensure:
- [ ] No grammar/spelling errors exist.
- [ ] Document contains zero instance of flowery words (stellar, gorgeous, elegant).
- [ ] All code blocks have language tags and are syntactically valid.
- [ ] Heading hierarchy is sequential and strict.
- [ ] No trailing whitespaces remain at line ends.
