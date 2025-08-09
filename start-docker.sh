#!/bin/bash

echo "==============================================="
echo "    Bahnar TTS Docker Setup - Linux/macOS"
echo "==============================================="
echo ""

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: Docker Compose is not installed"
    echo "Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
fi

echo "Docker is ready!"
echo ""

echo "Building and starting containers..."
docker-compose up -d --build

if [ $? -eq 0 ]; then
    echo ""
    echo "==============================================="
    echo "    SUCCESS! Application is now running"
    echo "==============================================="
    echo ""
    echo "Frontend: http://localhost"
    echo "API: http://localhost:5000"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
    echo ""
    echo "Opening browser in 3 seconds..."
    sleep 3
    
    # Try to open browser (works on macOS and most Linux distros)
    if command -v open &> /dev/null; then
        open http://localhost
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost
    else
        echo "Please manually open http://localhost in your browser"
    fi
else
    echo ""
    echo "ERROR: Failed to start containers"
    echo "Check logs with: docker-compose logs"
fi
