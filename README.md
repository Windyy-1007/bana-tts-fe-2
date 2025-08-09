# Bahnar Text-to-Speech Docker Setup

This application has been containerized using Docker for easy deployment and consistent environment setup.

## Dependencies

### Backend (Python)
- **Flask 3.0.0**: Web framework for serving the application
- **flask-cors 4.0.0**: CORS (Cross-Origin Resource Sharing) support
- **requests 2.31.0**: HTTP client for API calls to Bahnar TTS service
- **gunicorn 21.2.0**: WSGI HTTP Server for production deployment

### Frontend (JavaScript)
- **Tesseract.js@5**: OCR (Optical Character Recognition) functionality for image-to-text conversion
- **Mammoth@1.6.0**: DOCX file processing for text file uploads
- Custom JavaScript files: `main.js`, `ocr.js`
- Custom CSS: `style10001.css`

## Docker Setup

### Files Created
- `Dockerfile`: Multi-stage build configuration
- `docker-compose.yml`: Service orchestration
- `.dockerignore`: Files to exclude from Docker build context
- `requirements.txt`: Python dependencies

### Quick Start

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Or build and run with Docker directly:**
   ```bash
   docker build -t bahnar-tts .
   docker run -p 5000:5000 bahnar-tts
   ```

3. **Access the application:**
   - Open your browser and go to `http://localhost:5000`

### Docker Configuration Details

#### Dockerfile Features:
- **Base Image**: Python 3.11-slim (optimized for size)
- **Security**: Non-root user execution
- **Performance**: Multi-layered caching for faster builds
- **Production Ready**: Gunicorn WSGI server with 2 workers
- **Health Check**: Built-in endpoint monitoring
- **Environment**: Production-optimized settings

#### Docker Compose Features:
- **Port Mapping**: Host port 5000 → Container port 5000
- **Health Monitoring**: Automatic health checks with curl
- **Restart Policy**: Automatic restart unless manually stopped
- **Network Isolation**: Custom bridge network for security

### Environment Variables
- `FLASK_ENV=production`: Production mode for Flask
- `PORT=5000`: Application port (configurable)
- `PYTHONDONTWRITEBYTECODE=1`: Prevent .pyc file generation
- `PYTHONUNBUFFERED=1`: Real-time logging

### Production Deployment
For production environments:

1. **Use environment-specific configuration:**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

2. **Scale the application:**
   ```bash
   docker-compose up --scale bahnar-tts-app=3 -d
   ```

3. **Monitor logs:**
   ```bash
   docker-compose logs -f bahnar-tts-app
   ```

### Development Mode
For development with auto-reload:
```bash
docker run -p 5000:5000 -v $(pwd):/app -e FLASK_ENV=development bahnar-tts
```

## API Endpoints
- `GET /`: Serves the main application interface
- `POST /speak`: Text-to-speech conversion endpoint
  - Accepts JSON: `{"text": "...", "gender": "male/female", "region": "gialai/binhdinh/kontum"}`
  - Returns: `{"speech": "base64-encoded-audio"}`

## Features
- **Text-to-Speech**: Convert Bahnar text to audio
- **Image-to-Speech**: OCR + TTS pipeline for images
- **File Upload**: Support for .txt and .docx files
- **Multi-region Support**: Gia Lai, Bình Định, Kon Tum dialects
- **Voice Selection**: Male and female voices
- **Responsive UI**: Works on desktop and mobile
- **History Tracking**: Recent conversions history

## Troubleshooting
- **Port conflicts**: Change port mapping in docker-compose.yml
- **Build issues**: Check Docker daemon and network connectivity
- **API errors**: Verify external Bahnar API endpoint availability
- **Memory issues**: Increase Docker memory limits if needed
