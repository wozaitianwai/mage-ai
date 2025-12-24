param(
    [string]$ProjectName = "",
    [string]$Host = "localhost",
    [int]$Port = 6789,
    [switch]$SkipInstall
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$venvPath = Join-Path $repoRoot ".venv"
$activateScript = Join-Path $venvPath "Scripts\\Activate.ps1"

Write-Host "==> Using repository root at $repoRoot"
Write-Host "==> Project name: '$ProjectName' | Host: $Host | Port: $Port"

if (-not (Test-Path $venvPath)) {
    Write-Host "==> Creating virtual environment at $venvPath"
    python -m venv $venvPath
}

if (-not (Test-Path $activateScript)) {
    throw "Could not find activation script at $activateScript. Ensure Python and venv are available."
}

Write-Host "==> Activating virtual environment"
. $activateScript

if (-not $SkipInstall) {
    Write-Host "==> Installing or updating dependencies (pip install -r requirements.txt -e .)"
    pip install --upgrade pip
    pip install -r (Join-Path $repoRoot "requirements.txt")
    pip install -e $repoRoot
} else {
    Write-Host "==> Skipping dependency installation as requested"
}

Set-Location $repoRoot
Write-Host "==> Starting Mage from source"
python (Join-Path $repoRoot "mage_ai/cli/main.py") start $ProjectName --host $Host --port $Port
