# Profiling Selective VPS Deployment Script (PowerShell)

$VPS_IP = "103.194.228.182"
$REMOTE_PATH = "/opt/saarthix/Profiling"

Write-Host "Deploying Profiling Service..." -ForegroundColor Cyan

# Package only Profiling bits
if (Test-Path temp_profiling) { Remove-Item -Recurse -Force temp_profiling }
New-Item -ItemType Directory -Path temp_profiling

Copy-Item .env temp_profiling/
Copy-Item docker-compose.yml temp_profiling/
Copy-Item mongo-init.js temp_profiling/

tar -czf profiling_vps_deploy.tar.gz -C temp_profiling .
Remove-Item -Recurse -Force temp_profiling

# Push to VPS
scp profiling_vps_deploy.tar.gz root@$VPS_IP:$REMOTE_PATH/

# Deploy
ssh root@$VPS_IP "cd $REMOTE_PATH && tar -xzf profiling_vps_deploy.tar.gz && docker compose up -d"

Write-Host "Profiling deployed to http://$VPS_IP:8090/i5h0t1r1a2a2s.com/profiling/" -ForegroundColor Green
