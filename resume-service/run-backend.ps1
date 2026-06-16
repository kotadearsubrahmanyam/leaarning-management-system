# PowerShell helper to bootstrap Maven and run the Spring Boot Resume Service.
# Run from the resume-service directory.

$mavenDir = Join-Path $PSScriptRoot "maven"
$mvnCmd = Join-Path $mavenDir "apache-maven-3.9.6\bin\mvn.cmd"

# Check if Maven is already downloaded and extracted
if (-not (Test-Path $mvnCmd)) {
    Write-Host "Maven not found in $mavenDir. Downloading portable Apache Maven 3.9.6..." -ForegroundColor Yellow
    
    if (-not (Test-Path $mavenDir)) {
        New-Item -ItemType Directory -Path $mavenDir | Out-Null
    }

    $zipPath = Join-Path $mavenDir "maven.zip"
    $url = "https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip"
    
    Write-Host "Downloading $url..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $url -OutFile $zipPath

    Write-Host "Extracting Maven..." -ForegroundColor Cyan
    Expand-Archive -Path $zipPath -DestinationPath $mavenDir -Force
    
    Remove-Item $zipPath -Force
    Write-Host "Maven set up successfully in $mavenDir!" -ForegroundColor Green
}

Write-Host "Using Maven from: $mvnCmd" -ForegroundColor Green

# Verify Java is available
$javaCheck = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCheck) {
    Write-Host "ERROR: Java not found. Please install JDK 17+ and try again." -ForegroundColor Red
    exit 1
}

# Run Maven to compile and start the Spring Boot application
Write-Host "Starting Spring Boot Resume Microservice on port 8080..." -ForegroundColor Cyan
& $mvnCmd spring-boot:run
