# Bahnar TTS Docker Hosting Guide

## Quick Start Commands

### Development
```bash
# Start development environment
docker-compose up --build

# Access at http://localhost:5000
```

### Production Deployment

#### Option 1: Simple Production (Recommended for small deployments)
```bash
# Windows
deploy-prod.bat

# Linux/Mac
chmod +x deploy-prod.sh
./deploy-prod.sh

# Access at http://localhost
```

#### Option 2: With Nginx Load Balancer (Recommended for high traffic)
```bash
# Start with Nginx proxy
docker-compose -f docker-compose.yml -f docker-compose.nginx.yml up -d --build

# Access at http://localhost
```

### Cloud Deployment (AWS/GCP/Azure)

1. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your production settings
   ```

2. **Deploy to cloud:**
   ```bash
   # Build for production
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

   # Tag for registry
   docker tag bana-tts-fe_bahnar-tts-app:latest your-registry/bahnar-tts:latest

   # Push to registry
   docker push your-registry/bahnar-tts:latest
   ```

## Configuration

### Environment Variables (.env)
- `FLASK_ENV`: Set to 'production' for production
- `PORT`: Application port (default: 5000)
- `WORKERS`: Number of Gunicorn workers
- `SECRET_KEY`: Flask secret key for sessions

### Production Optimizations
- ✅ Multi-stage Docker build
- ✅ Non-root user execution
- ✅ Health checks configured
- ✅ Resource limits set
- ✅ Log rotation enabled
- ✅ Gunicorn with optimal settings
- ✅ Nginx reverse proxy (optional)
- ✅ Rate limiting configured

### Monitoring & Maintenance

#### View Application Logs
```bash
docker-compose logs -f bahnar-tts-app
```

#### Scale Application
```bash
docker-compose up -d --scale bahnar-tts-app=3
```

#### Health Monitoring
```bash
# Run health monitor (Linux/Mac)
chmod +x monitor-health.sh
./monitor-health.sh
```

#### Backup & Recovery
```bash
# Stop application
docker-compose down

# Backup volumes (if any)
docker volume ls

# Restart
docker-compose up -d
```

## Security Considerations

1. **Use HTTPS in production** - Configure SSL certificates in nginx.conf
2. **Set strong SECRET_KEY** - Generate random key for Flask sessions
3. **Network isolation** - Services run in isolated Docker network
4. **Rate limiting** - Configured in Nginx (10 req/s with burst)
5. **Security headers** - Added in Nginx configuration

## Performance Tuning

### Application Level
- Gunicorn workers: Adjust based on CPU cores (2 * cores + 1)
- Worker connections: Set based on expected concurrent connections
- Timeout settings: Configured for TTS processing delays

### Infrastructure Level
- Memory limits: 512MB per container (adjustable)
- CPU limits: 0.5 cores per container
- Load balancing: Nginx upstream with multiple app instances

## Troubleshooting

### Common Issues
1. **Port conflicts**: Change port mapping in docker-compose files
2. **Memory issues**: Increase container memory limits
3. **API timeouts**: Check external Bahnar API connectivity
4. **SSL issues**: Verify certificate configuration

### Debug Commands
```bash
# Check container health
docker ps
docker-compose ps

# View detailed logs
docker-compose logs --tail=100 bahnar-tts-app

# Access container shell
docker-compose exec bahnar-tts-app /bin/bash

# Test API endpoint
curl -X POST http://localhost/speak -H "Content-Type: application/json" -d '{"text":"test","gender":"male","region":"gialai"}'
```

## Production Checklist

- [ ] Environment variables configured (.env file)
- [ ] SSL certificates installed (if using HTTPS)
- [ ] Monitoring setup (health checks, logs)
- [ ] Backup strategy defined
- [ ] Load testing completed
- [ ] Security review performed
- [ ] Documentation updated
