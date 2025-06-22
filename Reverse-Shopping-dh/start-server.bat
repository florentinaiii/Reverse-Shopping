@echo off
echo Starting Recipe API Server...

REM Check if MongoDB service is running
net start MongoDB || echo MongoDB service not running, attempting to start...
net start MongoDB || echo Failed to start MongoDB service. Please start it manually.

REM Install dependencies if needed
cd server
echo Checking for required dependencies...
npm list express cors mongoose nodemon || npm install express cors mongoose nodemon

REM Start the server with nodemon for auto-reloading
echo Starting server with nodemon...
npx nodemon index.js

pause
