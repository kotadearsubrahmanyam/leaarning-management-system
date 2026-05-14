# PowerShell helper to run the AI microservice from ai-service directory.

if (-not (Test-Path .venv\Scripts\Activate.ps1)) {
    Write-Host "Virtual environment not found. Run .\setup.ps1 first." -ForegroundColor Red
    exit 1
}

. .venv\Scripts\Activate.ps1
python app.py
