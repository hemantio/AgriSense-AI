# 🛡️ AgriSense AI — Security Remediation & Hardening Report

**Date**: August 7, 2026  
**Status**: Remediation Complete  
**Reference Document**: [agrisense_full_audit_report.md](file:///c:/Users/HEMANT/AgriSense%20AI/agrisense_full_audit_report.md)  
**Target Components**: Server Backend, Flutter Mobile App, Docker Infrastructure

---

## 1. Executive Summary

This report documents the security remediation and hardening actions taken on the AgriSense AI codebase. The updates resolve multiple vulnerabilities identified during the codebase audit (specifically targeting critical and medium-severity findings). 

Key areas addressed include **CORS tightening**, **Content Security Policy (CSP) headers configuration**, **SQL injection defense (wildcard escaping)**, **rate limiting**, **JWT revocation via token versioning**, **profile update mass assignment prevention**, **information disclosure mitigation**, and **Docker container isolation/security**.

---

## 2. Summary of Remediation Actions

### 2.1 CORS Policy Hardening (High Severity)
*   **Vulnerability**: CORS policy allowed all origins (`["*"]`), exposing API endpoints to unauthorized cross-origin access.
*   **Remediation**: 
    *   Replaced the wildcard origin policy in [cors.py](file:///c:/Users/HEMANT/AgriSense%20AI/server/app/middleware/cors.py) with dynamic, settings-defined origins using `settings.CORS_ORIGINS`.
    *   Configured distinct CORS behaviors for development and production to keep local testing seamless while locking down production origins.

### 2.2 Content Security Policy & Strict Transport Security (Medium Severity)
*   **Vulnerability**: Missing Content Security Policy (CSP) and Strict-Transport-Security (HSTS) headers.
*   **Remediation**:
    *   Updated [security_headers.py](file:///c:/Users/HEMANT/AgriSense%20AI/server/app/middleware/security_headers.py) to supply robust security headers.
    *   In **production**, it enforces strict scripts/styles/fonts sources and enables HSTS with preloading (`max-age=31536000; includeSubDomains; preload`).
    *   In **development**, a relaxed CSP is generated to support local development tools, documentation explorers, and live reloading.

### 2.3 SQL Wildcard Injection Prevention (Medium Severity)
*   **Vulnerability**: SQL `LIKE` and `ILIKE` queries did not escape user-supplied wildcards (e.g., `%`, `_`), allowing clients to trigger full-table scans.
*   **Remediation**:
    *   Implemented a helper function `_escape_like` in [farmers.py](file:///c:/Users/HEMANT/AgriSense%20AI/server/app/routers/farmers.py).
    *   Escaped search queries for farmer name, email, phone number, and village name before passing them to SQLAlchemy queries.

### 2.4 API Rate Limiting (Medium Severity)
*   **Vulnerability**: Authentication and profile endpoints had no rate limiting, leaving them open to brute force and denial of service (DoS) attacks.
*   **Remediation**:
    *   Integrated rate limits using `limiter.limit` on critical endpoints in [auth.py](file:///c:/Users/HEMANT/AgriSense%20AI/server/app/routers/auth.py).
    *   Added `@limiter.limit(settings.RATE_LIMIT_AUTH)` to the update profile (`PUT /me`) and change password (`POST /change-password`) APIs.

### 2.5 Token Revocation on Password Change (Medium Severity)
*   **Vulnerability**: No mechanism existed to invalidate active JWTs if a user changed their password or if a token was compromised.
*   **Remediation**:
    *   Added a `token_version` column to the User model in [user.py](file:///c:/Users/HEMANT/AgriSense%20AI/server/app/models/user.py).
    *   Included the token version (`v`) as a claim in JWT access and refresh tokens.
    *   Updated the auth middleware in [security.py](file:///c:/Users/HEMANT/AgriSense%20AI/server/app/security.py) to check the incoming token's version against the user's current version in the database.
    *   Incremented the user's `token_version` on password changes in [auth.py](file:///c:/Users/HEMANT/AgriSense%20AI/server/app/routers/auth.py), instantly invalidating all existing active sessions.

### 2.6 Profile Update Mass Assignment Prevention (Medium Severity)
*   **Vulnerability**: Updating profiles utilized direct mapping of body fields to model fields without filtering, allowing a user to elevate their role or change restricted metadata.
*   **Remediation**:
    *   Implemented an explicit fields whitelist (`{"name", "phone_number", "village_name", "preferred_language", "notes"}`) in [auth.py](file:///c:/Users/HEMANT/AgriSense%20AI/server/app/routers/auth.py).
    *   Ensured only whitelisted fields can be updated, rejecting attempts to modify properties like `role` or `is_verified`.

### 2.7 Insecure Configuration Safeguards (Medium/High Severity)
*   **Vulnerability**: Startup with insecure placeholder secrets could go unnoticed, leading to token forgery in staging/production.
*   **Remediation**:
    *   Created `_validate_security_settings` in [config.py](file:///c:/Users/HEMANT/AgriSense%20AI/server/app/config.py) to check the security configuration upon startup.
    *   FASTApi startup will now **fail and exit immediately** if running in `staging` or `production` with the default placeholder JWT key or a key shorter than 32 characters.

### 2.8 Exception Info Disclosure Prevention (Medium Severity)
*   **Vulnerability**: Server routers leaked detailed database and engine exceptions back to client responses, revealing system structure.
*   **Remediation**:
    *   Modified [chat.py](file:///c:/Users/HEMANT/AgriSense%20AI/server/app/routers/chat.py) to log the full stack traces internally via `logger.exception()` while sending safe, generic error responses (`detail="An error occurred..."`) to clients.

### 2.9 Docker Infrastructure Hardening (Medium/High Severity)
*   **Vulnerability**: Postgres database and Redis server ports were bound directly to all interfaces without passwords, exposing them to the local network.
*   **Remediation**:
    *   Modified [docker-compose.yml](file:///c:/Users/HEMANT/AgriSense%20AI/docker-compose.yml) to use parameterized external ports (`DB_EXTERNAL_PORT`, `REDIS_EXTERNAL_PORT`).
    *   Introduced password authorization for Redis (`--requirepass ${REDIS_PASSWORD}`) and parameterized database credentials.
    *   Updated the service healthchecks to utilize the new credentials.

### 2.10 Modern Dart Null-Aware API Client (Flutter App Enhancement)
*   **Remediation**:
    *   Updated [api_service.dart](file:///c:/Users/HEMANT/AgriSense%20AI/farmerapp/lib/services/api_service.dart) to take advantage of Dart 3.8's **null-aware collection elements** (`?`) in map literals.
    *   Replaced verbose, imperative `if` checks with clean inline declarations (e.g. `'brand': ?brand`), ensuring cleaner code and preventing runtime key-value issues when uploading optional agricultural logs.

---

## 3. Impact and Security Posture

The implemented remedies significantly elevate AgriSense AI's security posture:
1.  **Attack Surface Reduction**: CORS restrictions and CSP protect the API and clients against cross-site scripting (XSS), code injection, and unauthorized cross-domain actions.
2.  **Robust Identity & Access Management**: Brute-force attacks are mitigated by rate limits, and token revocation prevents stolen tokens from remaining active after password changes.
3.  **SQL Protection**: Wildcard escaping blocks attempts to overload database queries.
4.  **Configuration Safety**: Strict environment validation prevents deployments with default credentials.

---

## 4. Modified Files List

The following files have been modified to implement these security enhancements:
*   [docker-compose.yml](file:///c:/Users/HEMANT/AgriSense%20AI/docker-compose.yml)
*   [server/app/config.py](file:///c:/Users/HEMANT/AgriSense%20AI/server/app/config.py)
*   [server/app/middleware/cors.py](file:///c:/Users/HEMANT/AgriSense%20AI/server/app/middleware/cors.py)
*   [server/app/middleware/security_headers.py](file:///c:/Users/HEMANT/AgriSense%20AI/server/app/middleware/security_headers.py)
*   [server/app/models/user.py](file:///c:/Users/HEMANT/AgriSense%20AI/server/app/models/user.py)
*   [server/app/routers/auth.py](file:///c:/Users/HEMANT/AgriSense%20AI/server/app/routers/auth.py)
*   [server/app/routers/chat.py](file:///c:/Users/HEMANT/AgriSense%20AI/server/app/routers/chat.py)
*   [server/app/routers/farmers.py](file:///c:/Users/HEMANT/AgriSense%20AI/server/app/routers/farmers.py)
*   [server/app/security.py](file:///c:/Users/HEMANT/AgriSense%20AI/server/app/security.py)
*   [farmerapp/lib/main.dart](file:///c:/Users/HEMANT/AgriSense%20AI/farmerapp/lib/main.dart)
*   [farmerapp/lib/screens/dashboard_screen.dart](file:///c:/Users/HEMANT/AgriSense%20AI/farmerapp/lib/screens/dashboard_screen.dart)
*   [farmerapp/lib/screens/logs_screen.dart](file:///c:/Users/HEMANT/AgriSense%20AI/farmerapp/lib/screens/logs_screen.dart)
*   [farmerapp/lib/services/api_service.dart](file:///c:/Users/HEMANT/AgriSense%20AI/farmerapp/lib/services/api_service.dart)
*   [.gitignore](file:///c:/Users/HEMANT/AgriSense%20AI/.gitignore)
