# Deploy Profiling Complete (Backend + Frontend + MongoDB)

$VPS_HOST = "103.194.228.182"
$VPS_USER = "root"
$VPS_PASS = "W6VITJXH7XPXQWjg"
$PLINK_PATH = "C:\Users\HariomSingh\AppData\Local\PuTTY\plink.exe"
$PSCP_PATH = "C:\Users\HariomSingh\AppData\Local\PuTTY\pscp.exe"

Write-Host "============================================"
Write-Host "Deploying Profiling Complete Application"
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
    # Read-Host "Press Enter to exit"
    exit
}

$pscp = $null
if (Get-Command pscp -ErrorAction SilentlyContinue) {
    $pscp = "pscp"
} elseif (Test-Path $PSCP_PATH) {
    $pscp = $PSCP_PATH
} else {
    Write-Host "[ERROR] pscp.exe not found!"
    # Read-Host "Press Enter to exit"
    exit
}

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Join-Path $SCRIPT_DIR ".."

# Helper function to upload directory excluding unnecessary files
function Upload-DirectoryExcluding {
    param(
        [string]$SourcePath,
        [string]$RemotePath,
        [string[]]$ExcludePatterns = @("node_modules", "dist", "build", ".git", ".gradle", "*.log", ".vscode", ".idea", "coverage", ".nyc_output")
    )
    
    $tempDir = Join-Path $env:TEMP "deploy-$(New-Guid)"
    $destDir = Join-Path $tempDir (Split-Path -Leaf $SourcePath)
    
    try {
        Write-Host "  Preparing filtered copy of $(Split-Path -Leaf $SourcePath)..."
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        
        # Normalize source path
        $sourcePathNormalized = (Resolve-Path $SourcePath).Path.TrimEnd('\', '/')
        
        # Helper function to get relative path
        function Get-RelativePath {
            param([string]$FullPath, [string]$BasePath)
            if ($FullPath -eq $BasePath) {
                return ""
            }
            if ($FullPath.StartsWith($BasePath)) {
                $relative = $FullPath.Substring($BasePath.Length).TrimStart('\', '/')
                return $relative
            }
            return $null
        }
        
        # Copy files excluding patterns
        Get-ChildItem -Path $SourcePath -Recurse | Where-Object {
            $relativePath = Get-RelativePath -FullPath $_.FullName -BasePath $sourcePathNormalized
            
            # Skip if no relative path (shouldn't happen, but safety check)
            if ($null -eq $relativePath) {
                return $false
            }
            
            # Check if should exclude
            $shouldExclude = $false
            if ($relativePath) {
                foreach ($pattern in $ExcludePatterns) {
                    if ($relativePath -like "*\$pattern\*" -or $relativePath -like "$pattern\*" -or $_.Name -like $pattern) {
                        $shouldExclude = $true
                        break
                    }
                }
            }
            return -not $shouldExclude
        } | ForEach-Object {
            $relativePath = Get-RelativePath -FullPath $_.FullName -BasePath $sourcePathNormalized
            if ($relativePath) {
                $destPath = Join-Path $destDir $relativePath
                $destParent = Split-Path -Parent $destPath
                if (-not (Test-Path $destParent)) {
                    New-Item -ItemType Directory -Path $destParent -Force | Out-Null
                }
                if (-not $_.PSIsContainer) {
                    Copy-Item -Path $_.FullName -Destination $destPath -Force
                }
            }
        }
        
        # Upload filtered directory
        Write-Host "  Uploading $(Split-Path -Leaf $SourcePath) (excluding node_modules, dist, build, etc.)..."
        $uploadArgs = @("-batch", "-pw", $VPS_PASS, "-r", $destDir, "${VPS_USER}@${VPS_HOST}:$RemotePath")
        $uploadProcess = Start-Process -FilePath $pscp -ArgumentList $uploadArgs -NoNewWindow -Wait -PassThru
        
        return $uploadProcess.ExitCode -eq 0
    } finally {
        # Cleanup
        if (Test-Path $tempDir) {
            Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "Creating production docker-compose file..."
$dockerCompose = @"
version: '3.8'

services:
  # MongoDB Service
  mongodb:
    image: mongo:4.4.29
    container_name: profiling-mongodb
    environment:
      MONGO_INITDB_DATABASE: `${MONGODB_DATABASE:-profiling_db}
    volumes:
      - profiling_mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - profiling-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mongo", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  # Backend Service (Spring Boot)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: profiling_backend
    container_name: profiling-backend
    env_file:
      - .env
    environment:
      MONGODB_URI: `${MONGODB_URI:-mongodb://profiling-mongodb:27017/profiling_db}
      MONGODB_DATABASE: `${MONGODB_DATABASE:-profiling_db}
      FRONTEND_URL: `${FRONTEND_URL:-http://103.194.228.182/profiling/}
      SPRING_PROFILES_ACTIVE: `${SPRING_PROFILES_ACTIVE:-prod}
      JWT_SECRET: `${JWT_SECRET}
      OPENAI_API_KEY: `${OPENAI_API_KEY:-}
      GOOGLE_CLIENT_ID: `${GOOGLE_CLIENT_ID:-}
      GOOGLE_CLIENT_SECRET: `${GOOGLE_CLIENT_SECRET:-}
      GOOGLE_REDIRECT_URI: `${GOOGLE_REDIRECT_URI:-http://103.194.228.182/profiling-api/login/oauth2/code/google}
      LOG_PATH: `${LOG_PATH:-/app/logs}
    volumes:
      - profiling_backend_uploads:/app/uploads
      - profiling_backend_logs:/app/logs
    depends_on:
      - mongodb
    networks:
      - profiling-network
      - saarthix-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "nc -z localhost 9090 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 90s

  # Frontend Service (React + Nginx)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_BASE_URL: `${VITE_API_BASE_URL:-http://103.194.228.182/profiling-api}
    image: profiling_frontend
    container_name: profiling-frontend
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - profiling-network
      - saarthix-network
    restart: unless-stopped

volumes:
  profiling_mongodb_data:
    driver: local
  profiling_backend_uploads:
    driver: local
  profiling_backend_logs:
    driver: local

networks:
  profiling-network:
    driver: bridge
  saarthix-network:
    external: true
    name: saarthix-network
"@

$dockerCompose | Out-File -FilePath "$SCRIPT_DIR\docker-compose.prod.yml" -Encoding ASCII

Write-Host "Creating directory on VPS..."
$mkdirArgs = @("-batch", "-ssh", "-pw", $VPS_PASS, "${VPS_USER}@${VPS_HOST}", "mkdir -p /root/profiling")
$mkdirProcess = Start-Process -FilePath $plink -ArgumentList $mkdirArgs -NoNewWindow -Wait -PassThru

Write-Host "Uploading files to VPS..."
Write-Host ""

# Upload backend (exclude .gradle, build)
$backendSuccess = Upload-DirectoryExcluding -SourcePath "$PROJECT_ROOT\backend" -RemotePath "/root/profiling/" -ExcludePatterns @(".gradle", "build", ".git", "*.log", ".vscode", ".idea")

# Upload frontend (exclude node_modules, dist, build)
$frontendSuccess = Upload-DirectoryExcluding -SourcePath "$PROJECT_ROOT\frontend" -RemotePath "/root/profiling/" -ExcludePatterns @("node_modules", "dist", "build", ".git", "*.log", ".vscode", ".idea", "coverage", ".nyc_output")

# Upload docker-compose
Write-Host "  Uploading docker-compose.yml..."
$uploadArgs3 = @("-batch", "-pw", $VPS_PASS, "$SCRIPT_DIR\docker-compose.prod.yml", "${VPS_USER}@${VPS_HOST}:/root/profiling/docker-compose.yml")
$upload3 = Start-Process -FilePath $pscp -ArgumentList $uploadArgs3 -NoNewWindow -Wait -PassThru

if (-not $backendSuccess -or -not $frontendSuccess -or $upload3.ExitCode -ne 0) {
    Write-Host "[ERROR] Failed to upload files to VPS!"
    # Read-Host "Press Enter to exit"
    exit
}
Write-Host ""

if (Test-Path "$PROJECT_ROOT\mongo-init.js") {
    $uploadArgs4 = @("-batch", "-pw", $VPS_PASS, "$PROJECT_ROOT\mongo-init.js", "${VPS_USER}@${VPS_HOST}:/root/profiling/")
    $upload4 = Start-Process -FilePath $pscp -ArgumentList $uploadArgs4 -NoNewWindow -Wait -PassThru
}

if (Test-Path "$SCRIPT_DIR\.env") {
    $uploadArgs5 = @("-batch", "-pw", $VPS_PASS, "$SCRIPT_DIR\.env", "${VPS_USER}@${VPS_HOST}:/root/profiling/")
    $upload5 = Start-Process -FilePath $pscp -ArgumentList $uploadArgs5 -NoNewWindow -Wait -PassThru
}

Write-Host "Deploying Profiling on VPS..."
$deployArgs = @("-batch", "-ssh", "-pw", $VPS_PASS, "${VPS_USER}@${VPS_HOST}", "cd /root/profiling && docker-compose down && docker-compose up -d --build")
$deployProcess = Start-Process -FilePath $plink -ArgumentList $deployArgs -NoNewWindow -Wait -PassThru

Write-Host ""
Write-Host "============================================"
Write-Host "Profiling deployed successfully!"
Write-Host "============================================"
Write-Host ""
Write-Host "Backend: http://$VPS_HOST/profiling-api/"
Write-Host "Frontend: http://$VPS_HOST/profiling/"
Write-Host ""
# Read-Host "Press Enter to exit"
