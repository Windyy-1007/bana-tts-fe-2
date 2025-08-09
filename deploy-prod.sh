#!/bin/bash

# Production deployment script for Bahnar TTS Application

set -e

echo "🚀 Starting Bahnar TTS Production Deployment..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it and try again."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your production settings before continuing."
    echo "Press any key to continue after editing .env..."
    read -n 1
fi

# Build and deploy
echo "🔨 Building and deploying application..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for application to start
echo "⏳ Waiting for application to start..."
sleep 10

# Health check
echo "🔍 Performing health check..."
if curl -f http://localhost:80/ >/dev/null 2>&1; then
    echo "✅ Application is running successfully!"
    echo "🌐 Access your application at: http://localhost"
else
    echo "❌ Health check failed. Checking logs..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=50
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Useful commands:"
echo "  View logs: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
echo "  Stop app:  docker-compose -f docker-compose.yml -f docker-compose.prod.yml down"
echo "  Scale app: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale bahnar-tts-app=3"
