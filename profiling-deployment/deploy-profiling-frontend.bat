@echo off
REM Deploy Profiling Frontend Only - Wrapper for PowerShell version
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0deploy-profiling-frontend.ps1"
