@echo off
REM Production deployment script for Bahnar TTS Application (Windows)

echo 🚀 Starting Bahnar TTS Production Deployment...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ docker-compose is not installed. Please install it and try again.
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please edit .env file with your production settings before continuing.
    echo Press any key to continue after editing .env...
    pause >nul
)

REM Build and deploy
echo 🔨 Building and deploying application...
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

REM Wait for application to start
echo ⏳ Waiting for application to start...
timeout /t 10 /nobreak >nul

REM Health check
echo 🔍 Performing health check...
curl -f http://localhost:80/ >nul 2>&1
if errorlevel 1 (
    echo ❌ Health check failed. Checking logs...
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=50
    exit /b 1
) else (
    echo ✅ Application is running successfully!
    echo 🌐 Access your application at: http://localhost
)

echo 🎉 Deployment completed successfully!
echo.
echo 📋 Useful commands:
echo   View logs: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
echo   Stop app:  docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
echo   Scale app: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale bahnar-tts-app=3
pause
