# Docker Development Guide

## Prerequisites

1. **Docker Desktop** - Download and install from [docker.com](https://www.docker.com/products/docker-desktop)
2. **Git** (optional) - For version control
3. **VS Code** (optional) - For development with Docker extensions

## Quick Start

### Option 1: Using Docker Compose (Recommended)
```bash
# Build and start the application
docker-compose up --build

# Or run in background
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Option 2: Using Helper Scripts
**Windows:**
```cmd
docker-run.bat
```

**Linux/Mac:**
```bash
chmod +x docker-run.sh
./docker-run.sh
```

### Option 3: Manual Docker Commands
```bash
# Build the image
docker build -t bahnar-tts .

# Run the container
docker run -p 5000:5000 --name bahnar-tts-container bahnar-tts

# Run in background
docker run -d -p 5000:5000 --name bahnar-tts-container bahnar-tts
```

## Development Workflow

### 1. Code Changes
When you make changes to the code:
```bash
# Rebuild and restart
docker-compose up --build

# Or rebuild specific service
docker-compose build bahnar-tts-app
docker-compose up
```

### 2. View Logs
```bash
# All services logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f bahnar-tts-app
```

### 3. Access Container Shell
```bash
# Access running container
docker-compose exec bahnar-tts-app /bin/bash

# Or with docker directly
docker exec -it bahnar-tts-container /bin/bash
```

### 4. Database/Volume Management (if needed)
```bash
# Remove all containers and volumes
docker-compose down -v

# Remove all containers, volumes, and images
docker-compose down -v --rmi all
```

## Production Deployment

### Using Production Compose File
```bash
# Start with production settings
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale the application
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --scale bahnar-tts-app=3 -d
```

### Environment Variables
Create a `.env` file in the project root:
```env
FLASK_ENV=production
PORT=5000
# Add other environment variables as needed
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5000
netstat -ano | findstr :5000  # Windows
lsof -i :5000                  # Mac/Linux

# Change port in docker-compose.yml
ports:
  - "8000:5000"  # Host port 8000 instead of 5000
```

### Container Won't Start
```bash
# Check container status
docker ps -a

# View container logs
docker logs container_name

# Remove problematic containers
docker rm container_name
```

### Build Issues
```bash
# Clean build (no cache)
docker-compose build --no-cache

# Remove all unused Docker resources
docker system prune -a
```

### Memory Issues
Add to docker-compose.yml:
```yaml
services:
  bahnar-tts-app:
    # ... other config
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

## VS Code Integration

### Recommended Extensions
- Docker
- Python
- Remote-Containers

### Dev Container Setup
Create `.devcontainer/devcontainer.json`:
```json
{
  "name": "Bahnar TTS Dev",
  "dockerComposeFile": "../docker-compose.yml",
  "service": "bahnar-tts-app",
  "workspaceFolder": "/app",
  "extensions": [
    "ms-python.python",
    "ms-azuretools.vscode-docker"
  ]
}
```

## Monitoring

### Health Checks
```bash
# Manual health check
curl http://localhost:5000/

# Container health status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Resource Usage
```bash
# Container resource usage
docker stats

# Specific container stats
docker stats bahnar-tts-container
```

## Backup and Restore

### Create Backup
```bash
# Export container as image
docker commit container_name bahnar-tts-backup

# Save image to file
docker save bahnar-tts-backup > bahnar-tts-backup.tar
```

### Restore from Backup
```bash
# Load image from file
docker load < bahnar-tts-backup.tar

# Run from backup image
docker run -p 5000:5000 bahnar-tts-backup
```

## Performance Optimization

### Multi-stage Builds
The Dockerfile already uses optimization techniques:
- Minimal base image (python:3.11-slim)
- Layer caching for dependencies
- Non-root user for security
- Gunicorn for production serving

### Resource Limits
Monitor and adjust resources as needed:
```yaml
deploy:
  resources:
    limits:
      cpus: '0.50'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```
