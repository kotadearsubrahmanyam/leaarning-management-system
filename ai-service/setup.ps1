# PowerShell helper to set up the AI microservice environment.
# Run from the ai-service directory.

$pythonCmd = $null

# First, see if "py" is available and can run one of the desired versions.
$py = Get-Command "py" -ErrorAction SilentlyContinue
if ($py) {
    # Check if default py is 3.11, 3.12, or 3.13
    $versionTest = & py --version 2>&1
    if ($versionTest -match "Python 3\.(11|12|13)\.") {
        $pythonCmd = "py"
    } else {
        # Check specific versions via launcher
        foreach ($v in @("3.13", "3.12", "3.11")) {
            $versionTest = & py -$v --version 2>&1
            if ($versionTest -match "Python 3\.(11|12|13)\.") {
                $pythonCmd = "py -$v"
                break
            }
        }
    }
}

# If py wasn't successful or not found, try "python"
if (-not $pythonCmd) {
    $python = Get-Command python -ErrorAction SilentlyContinue
    if ($python) {
        $versionTest = & python --version 2>&1
        if ($versionTest -match "Python 3\.(11|12|13)\.") {
            $pythonCmd = "python"
        }
    }
}

if (-not $pythonCmd) {
    Write-Host "Python 3.11, 3.12, or 3.13 was not found. Install Python 3.11/3.12/3.13 or use the Python launcher." -ForegroundColor Yellow
    Write-Host "Recommended install command: winget install --id Python.Python.3.13 -e" -ForegroundColor Cyan
    exit 1
}

$version = & $pythonCmd --version 2>&1
Write-Host "Detected: $version"

if ($version -notmatch "Python 3\.(11|12|13)\.") {
    Write-Host "ERROR: Unsupported Python version. Install Python 3.11, 3.12, or 3.13." -ForegroundColor Red
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

& .venv\Scripts\python.exe -m pip install --upgrade pip
& .venv\Scripts\python.exe -m pip install -r requirements.txt
Write-Host "Setup complete. Activate .venv and run .\run.ps1 to start the service." -ForegroundColor Green
