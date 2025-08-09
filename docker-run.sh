#!/bin/bash

# Build and run the Bahnar TTS application with Docker

echo "🚀 Building Bahnar TTS Docker container..."
docker-compose build

echo "📦 Starting the application..."
docker-compose up -d

echo "✅ Application is starting up..."
echo "🌐 The app will be available at: http://localhost:5000"
echo ""

# Wait for the application to be ready
echo "⏳ Waiting for the application to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:5000 > /dev/null 2>&1; then
        echo "✅ Application is ready!"
        echo "🌐 Access it at: http://localhost:5000"
        exit 0
    fi
    echo "   Waiting... ($i/30)"
    sleep 2
done

echo "⚠️  Application may still be starting up. Check with:"
echo "   docker-compose logs -f"
echo "🌐 Try accessing: http://localhost:5000"
