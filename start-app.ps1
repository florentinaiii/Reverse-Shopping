# PowerShell script to start both backend and frontend
Write-Host "Starting Reverse Shopping App..." -ForegroundColor Green

# Start the backend server
$backendJob = Start-Job -ScriptBlock {
    Set-Location "c:\Users\ONA\Desktop\reverseshopping\ReverseShopping\Reverse-Shopping-main"
    node backend/simpleApi.js
}

Write-Host "Backend server started on port 3008" -ForegroundColor Cyan
Write-Host "Starting frontend Expo app..." -ForegroundColor Cyan

# Start the frontend Expo app
Set-Location "c:\Users\ONA\Desktop\reverseshopping\ReverseShopping\Reverse-Shopping-main"
npx expo start

# When the frontend is closed, stop the backend job
Stop-Job -Job $backendJob
Remove-Job -Job $backendJob

Write-Host "Application stopped" -ForegroundColor Red
