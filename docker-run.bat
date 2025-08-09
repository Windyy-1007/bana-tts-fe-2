@echo off
REM Build and run the Bahnar TTS application with Docker

echo 🚀 Building Bahnar TTS Docker container...
docker-compose build

echo 📦 Starting the application...
docker-compose up -d

echo ✅ Application is starting up...
echo 🌐 The app will be available at: http://localhost:5000
echo.

REM Wait for the application to be ready
echo ⏳ Waiting for the application to be ready...
for /l %%i in (1,1,30) do (
    curl -s http://localhost:5000 >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Application is ready!
        echo 🌐 Access it at: http://localhost:5000
        goto :end
    )
    echo    Waiting... (%%i/30)
    timeout /t 2 /nobreak >nul
)

echo ⚠️  Application may still be starting up. Check with:
echo    docker-compose logs -f
echo 🌐 Try accessing: http://localhost:5000

:end
