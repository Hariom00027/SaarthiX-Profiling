@echo off
REM Deploy Profiling Complete - Wrapper for PowerShell version
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0deploy-profiling-complete.ps1"
