@echo off
echo ===============================================
echo    Bahnar TTS Docker Setup - Windows
echo ===============================================
echo.

echo Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Compose is not available
    echo Please ensure Docker Desktop is running
    pause
    exit /b 1
)

echo Docker is ready!
echo.

echo Building and starting containers...
docker-compose up -d --build

if %errorlevel% eq 0 (
    echo.
    echo ===============================================
    echo    SUCCESS! Application is now running
    echo ===============================================
    echo.
    echo Frontend: http://localhost
    echo API: http://localhost:5000
    echo.
    echo To view logs: docker-compose logs -f
    echo To stop: docker-compose down
    echo.
    echo Opening browser in 3 seconds...
    timeout /t 3 /nobreak >nul
    start http://localhost
) else (
    echo.
    echo ERROR: Failed to start containers
    echo Check logs with: docker-compose logs
    pause
)

pause
