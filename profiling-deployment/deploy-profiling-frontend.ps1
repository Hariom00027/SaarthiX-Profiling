# Deploy Profiling Frontend Only

$VPS_HOST = "103.194.228.182"
$VPS_USER = "root"
$VPS_PASS = "W6VITJXH7XPXQWjg"
$PLINK_PATH = "C:\Users\HariomSingh\AppData\Local\PuTTY\plink.exe"
$PSCP_PATH = "C:\Users\HariomSingh\AppData\Local\PuTTY\pscp.exe"

Write-Host "============================================"
Write-Host "Deploying Profiling Frontend Only"
Write-Host "============================================"
Write-Host ""

# Find plink and pscp
$plink = $null
if (Get-Command plink -ErrorAction SilentlyContinue) {
    $plink = "plink"
} elseif (Test-Path $PLINK_PATH) {
    $plink = $PLINK_PATH
} else {
    Write-Host "[ERROR] plink.exe not found!"
    Read-Host "Press Enter to exit"
    exit
}

$pscp = $null
if (Get-Command pscp -ErrorAction SilentlyContinue) {
    $pscp = "pscp"
} elseif (Test-Path $PSCP_PATH) {
    $pscp = $PSCP_PATH
} else {
    Write-Host "[ERROR] pscp.exe not found!"
    Read-Host "Press Enter to exit"
    exit
}

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Join-Path $SCRIPT_DIR ".."

Write-Host "Uploading frontend files to VPS..."
$uploadArgs = @("-batch", "-pw", $VPS_PASS, "-r", "$PROJECT_ROOT\frontend", "${VPS_USER}@${VPS_HOST}:/root/profiling/")
$uploadProcess = Start-Process -FilePath $pscp -ArgumentList $uploadArgs -NoNewWindow -Wait -PassThru

if ($uploadProcess.ExitCode -ne 0) {
    Write-Host "[ERROR] Failed to upload files to VPS!"
    Read-Host "Press Enter to exit"
    exit
}

Write-Host "Rebuilding and restarting frontend on VPS..."
$deployArgs = @("-batch", "-ssh", "-pw", $VPS_PASS, "${VPS_USER}@${VPS_HOST}", "cd /root/profiling && docker-compose stop frontend && docker-compose build frontend && docker-compose up -d frontend")
$deployProcess = Start-Process -FilePath $plink -ArgumentList $deployArgs -NoNewWindow -Wait -PassThru

Write-Host ""
Write-Host "============================================"
Write-Host "Profiling Frontend updated successfully!"
Write-Host "============================================"
Write-Host ""
Write-Host "Frontend: http://$VPS_HOST/profiling/"
Write-Host ""
Read-Host "Press Enter to exit"
