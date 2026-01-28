# Profiling Frontend Only Update (PowerShell)

$VPS_IP = "103.194.228.182"
$REMOTE_PATH = "/opt/saarthix/Profiling"

Write-Host "Updating Profiling Frontend..." -ForegroundColor Cyan

# NOTE: Profiling uses a pre-built image. 
# This script will attempt to pull the latest image and restart the container.

Write-Host "Step 1: Pulling latest profiling-frontend image and restarting..." -ForegroundColor Yellow
ssh root@$VPS_IP "cd $REMOTE_PATH && docker compose pull frontend && docker compose up -d frontend"

Write-Host "Profiling Frontend updated successfully!" -ForegroundColor Green
Write-Host "URL: http://$VPS_IP:8090/i5h0t1r1a2a2s.com/profiling/" -ForegroundColor White
