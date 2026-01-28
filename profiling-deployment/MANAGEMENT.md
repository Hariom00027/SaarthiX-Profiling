# Profiling Service Management Guide

This directory manages the Profiling & Assessment service (Backend + Frontend + MongoDB).

## Organizational Structure
- `docker-compose.yml`: Main container orchestration (uses pre-built images).
- `.env`: JWT secrets and Assessment API keys.
- `mongo-init.js`: Database initialization script.
- `vps-deploy.ps1`: Full service deployment script.
- `update-frontend.ps1`: targeted frontend update script.

---

## Operations Guide

### 1. Full Service Deployment
Updates environment variables and synchronization of the Profiling ecosystem.
```powershell
.\vps-deploy.ps1
```

### 2. Frontend Only Update
Pulls the latest frontend image and restarts the container.
```powershell
.\update-frontend.ps1
```

### 3. Check Status
```bash
ssh root@103.194.228.182 "docker ps | grep profiling"
```

### 4. Viewing Logs
```bash
ssh root@103.194.228.182 "docker logs --tail 20 profiling-backend"
```

---

## Troubleshooting
- **Assessment Failures**: Verify `OPENAI_API_KEY` in `.env`.
- **Startup Delay**: Profiling backend has a health check that may take up to 90s to show "Healthy".
