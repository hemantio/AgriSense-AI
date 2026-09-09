# ============================================================
# AgriSense AI — Run Strix Penetration Test
# ============================================================
# PREREQUISITES:
#   1. Install Docker Desktop: https://www.docker.com/products/docker-desktop/
#   2. Start Docker Desktop and wait until it says "Docker is running"
#   3. Open PowerShell and run this script:
#        .\run-strix-scan.ps1
# ============================================================

if (-not $env:GEMINI_API_KEY) {
    Write-Host "Warning: GEMINI_API_KEY environment variable is not set." -ForegroundColor Yellow
    Write-Host "Set it using: `$env:GEMINI_API_KEY = 'your_api_key_here'`n" -ForegroundColor Yellow
}
if (-not $env:LLM_API_KEY -and $env:GEMINI_API_KEY) {
    $env:LLM_API_KEY = $env:GEMINI_API_KEY
}
$env:STRIX_LLM = "gemini/gemini-2.0-flash"

Write-Host "`n🛡️  Starting Strix Deep Penetration Test on AgriSense AI...`n" -ForegroundColor Cyan

& "C:\Users\HEMANT\AppData\Roaming\Python\Python314\Scripts\strix.exe" `
    -n `
    --target ./server `
    --mount ./client `
    -m deep `
    --instruction "Perform a comprehensive white-box penetration test of this full-stack application (FastAPI backend + Next.js frontend). Focus on: OWASP Top 10, JWT authentication flaws, SQL injection in ORM queries, IDOR, mass assignment, file upload vulnerabilities, CORS misconfiguration, hardcoded secrets, and API security issues. Provide validated findings with PoCs and remediation guidance." `
    --max-budget 2

Write-Host "`n✅ Scan complete! View results with: strix view`n" -ForegroundColor Green
