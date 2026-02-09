# Profiling Frontend Deployment Wrapper
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$CENTRAL_SCRIPT = "$PSScriptRoot\..\..\deployment\scripts\profiling-frontend-hosting.ps1"
if (Test-Path $CENTRAL_SCRIPT) {
    & $CENTRAL_SCRIPT
} else {
    Write-Host "Central script not found: $CENTRAL_SCRIPT" -ForegroundColor Red
}
