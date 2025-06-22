@echo off
echo ===================================================
echo Setting up Reverse Shopping Backend
echo ===================================================

echo Installing backend dependencies...
npm install --prefix . express mongoose cors nodemon

echo.
echo Starting MongoDB service...
net start MongoDB || (
  echo MongoDB service not found or could not be started.
  echo Please make sure MongoDB is installed and try again.
  echo You can download MongoDB from https://www.mongodb.com/try/download/community
  pause
  exit /b 1
)

echo.
echo Starting backend server...
echo The server will run on http://localhost:5000
echo Press Ctrl+C to stop the server
echo.
npx nodemon server.js
