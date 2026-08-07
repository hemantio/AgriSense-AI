# ============================================================
# AgriSense AI — Run Strix Penetration Test
# ============================================================
# PREREQUISITES:
#   1. Install Docker Desktop: https://www.docker.com/products/docker-desktop/
#   2. Start Docker Desktop and wait until it says "Docker is running"
#   3. Open PowerShell and run this script:
#        .\run-strix-scan.ps1
# ============================================================

$env:GEMINI_API_KEY = "AIzaSyCCaQ0PioRmrwYff-7EVlpsVYRj8a355rk"
$env:STRIX_LLM = "gemini/gemini-2.0-flash"
$env:LLM_API_KEY = "AIzaSyCCaQ0PioRmrwYff-7EVlpsVYRj8a355rk"

Write-Host "`n🛡️  Starting Strix Deep Penetration Test on AgriSense AI...`n" -ForegroundColor Cyan

& "C:\Users\HEMANT\AppData\Roaming\Python\Python314\Scripts\strix.exe" `
    -n `
    --target ./server `
    --mount ./client `
    -m deep `
    --instruction "Perform a comprehensive white-box penetration test of this full-stack application (FastAPI backend + Next.js frontend). Focus on: OWASP Top 10, JWT authentication flaws, SQL injection in ORM queries, IDOR, mass assignment, file upload vulnerabilities, CORS misconfiguration, hardcoded secrets, and API security issues. Provide validated findings with PoCs and remediation guidance." `
    --max-budget 2

Write-Host "`n✅ Scan complete! View results with: strix view`n" -ForegroundColor Green
