Write-Host "Stopping any existing backend processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "Starting SyncUp Backend Server..." -ForegroundColor Green
Set-Location backend
npm start
Read-Host "Press Enter to continue"
