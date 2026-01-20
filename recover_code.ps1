$VPS_IP = "103.194.228.182"
$RemoteScriptParams = @{
    Path = "./remote_recovery.sh"
    Encoding = "UTF8"
}

# 1. Create the bash script content with proper LF line endings
$BashScript = @"
#!/bin/bash
set -e

echo "Checking Backend Container..."
if docker ps -q -f name=profiling-backend > /dev/null; then
    echo "Found profiling-backend. Attempting to copy /app..."
    # Try multiple paths
    mkdir -p /root/profiling_backend_recovered
    if docker cp profiling-backend:/app/. /root/profiling_backend_recovered/; then
        echo "Copied /app"
    elif docker cp profiling-backend:/workspace/. /root/profiling_backend_recovered/; then
        echo "Copied /workspace"
    else
        echo "Could not find code in standard paths in backend."
    fi
else
    echo "Backend container not running!"
fi

echo "Checking Frontend Container..."
if docker ps -q -f name=profiling-frontend > /dev/null; then
    echo "Found profiling-frontend. Attempting to copy..."
    mkdir -p /root/profiling_frontend_recovered
    if docker cp profiling-frontend:/app/. /root/profiling_frontend_recovered/; then
        echo "Copied /app"
    elif docker cp profiling-frontend:/usr/src/app/. /root/profiling_frontend_recovered/; then
        echo "Copied /usr/src/app"
    elif docker cp profiling-frontend:/usr/share/nginx/html/. /root/profiling_frontend_recovered/; then
        echo "Copied /usr/share/nginx/html"
    else
        echo "Could not find code in standard paths in frontend."
    fi
else
    echo "Frontend container not running!"
fi

echo "Creating archive..."
cd /root
tar -czf profiling_recovered.tar.gz profiling_backend_recovered profiling_frontend_recovered 2>/dev/null || echo "Tar failed or nothing to compress"

# Cleanup extracted folders on remote to save space
rm -rf profiling_backend_recovered profiling_frontend_recovered
echo "Remote packaging complete."
"@

# Write with LF only (crucial for Linux)
[IO.File]::WriteAllText($PWD.Path + "\remote_recovery.sh", $BashScript.Replace("`r`n", "`n"))

Write-Host "1. Uploading recovery script to VPS..."
scp ./remote_recovery.sh "root@${VPS_IP}:/root/remote_recovery.sh"

Write-Host "2. Running recovery script on VPS..."
ssh "root@${VPS_IP}" "chmod +x /root/remote_recovery.sh && /root/remote_recovery.sh"

Write-Host "3. Downloading recovered code archive..."
scp "root@${VPS_IP}:/root/profiling_recovered.tar.gz" ./profiling_recovered.tar.gz

# Cleanup local temp script
Remove-Item ./remote_recovery.sh

if (Test-Path profiling_recovered.tar.gz) {
    Write-Host "Extracting archive..."
    try {
        tar -xzf profiling_recovered.tar.gz
        Write-Host "SUCCESS: Code recovered to 'profiling_backend_recovered' and 'profiling_frontend_recovered' in the current directory." -ForegroundColor Green
    } catch {
        Write-Host "Extraction failed. The tar file might be empty if no containers were found." -ForegroundColor Yellow
    }
} else {
    Write-Host "Failed to download archive. Please check permissions or VPS status." -ForegroundColor Red
}
