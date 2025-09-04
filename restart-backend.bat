@echo off
echo Stopping any existing backend processes...
taskkill /f /im node.exe 2>nul
echo.
echo Starting SyncUp Backend Server...
cd backend
npm start
pause
