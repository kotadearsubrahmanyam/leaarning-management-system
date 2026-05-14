# PowerShell helper to set up the AI microservice environment.
# Run from the ai-service directory.

$pythonCmd = $null
$python = Get-Command python -ErrorAction SilentlyContinue
if ($python) {
    $pythonCmd = "python"
} else {
    $py311 = Get-Command "py" -ErrorAction SilentlyContinue
    if ($py311) {
        $versionTest = & py -3.11 --version 2>&1
        if ($versionTest -match "Python 3\.(11|12)\.") {
            $pythonCmd = "py -3.11"
        } else {
            $versionTest = & py -3.12 --version 2>&1
            if ($versionTest -match "Python 3\.(11|12)\.") {
                $pythonCmd = "py -3.12"
            }
        }
    }
}

if (-not $pythonCmd) {
    Write-Host "Python 3.11 or 3.12 was not found. Install Python 3.11/3.12 or use the Python launcher." -ForegroundColor Yellow
    Write-Host "Recommended install command: winget install --id Python.Python.3.11 -e" -ForegroundColor Cyan
    exit 1
}

$version = & $pythonCmd --version 2>&1
Write-Host "Detected: $version"

if ($version -notmatch "Python 3\.(11|12)\.") {
    Write-Host "ERROR: Unsupported Python version. Install Python 3.11 or 3.12." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path .venv)) {
    & $pythonCmd -m venv .venv
    Write-Host "Created virtual environment in .venv"
}

if (Test-Path .venv\Scripts\Activate.ps1) {
    . .venv\Scripts\Activate.ps1
} else {
    Write-Host "Could not activate the virtual environment. Please run .\.venv\Scripts\Activate.ps1 manually." -ForegroundColor Red
    exit 1
}

& $pythonCmd -m pip install --upgrade pip
& $pythonCmd -m pip install -r requirements.txt
Write-Host "Setup complete. Activate .venv and run .\run.ps1 to start the service." -ForegroundColor Green
