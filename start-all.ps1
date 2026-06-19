# PowerShell script to spin up all LMS microservices in parallel.
# Run this from the root directory.

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "Starting all Learning Management System services..." -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

$powershellCommand = [System.Diagnostics.Process]::GetCurrentProcess().MainModule.FileName

if (-not (Test-Path $powershellCommand)) {
	throw "Unable to determine the current PowerShell executable."
}

# 1. Launch Spring Boot Resume Microservice in a new separate window
Write-Host "🚀 Launching Spring Boot Resume Microservice (Port 8080)..." -ForegroundColor Yellow
Start-Process -FilePath $powershellCommand -WorkingDirectory (Join-Path $PSScriptRoot "resume-service") -ArgumentList @("-NoExit", "-ExecutionPolicy", "Bypass", "-File", ".\run-backend.ps1")

# 2. Launch Python AI Microservice in a new separate window
Write-Host "🚀 Launching Python AI Microservice (Port 8001)..." -ForegroundColor Yellow
Start-Process -FilePath $powershellCommand -WorkingDirectory (Join-Path $PSScriptRoot "ai-service") -ArgumentList @(
	"-NoExit",
	"-ExecutionPolicy",
	"Bypass",
	"-Command",
	"if (-not (Test-Path .\.venv\Scripts\Activate.ps1)) { .\setup.ps1 }; .\run.ps1"
)

# 3. Start Next.js Frontend in the current terminal window
Write-Host "🚀 Launching Next.js Frontend (Port 3000)..." -ForegroundColor Green
npm run dev
