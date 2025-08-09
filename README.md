# Bahnar Text-to-Speech Frontend - Docker Guide

Ứng dụng chuyển văn bản thành giọng nói tiếng Bahnar được phát triển bởi nhóm **URA - Unlimited Research group of AI**, Trường Đại học Bách Khoa, ĐHQG-HCM.

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt và chạy với Docker](#cài-đặt-và-chạy-với-docker)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Cấu hình](#cấu-hình)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)

## 🌟 Tổng quan

Ứng dụng này cung cấp ba chức năng chính:
- **Text-to-Speech**: Chuyển văn bản tiếng Bahnar thành giọng nói
- **OCR**: Trích xuất văn bản từ hình ảnh và chuyển thành giọng nói
- **File Processing**: Xử lý tệp tin (.txt, .docx) và chuyển thành giọng nói

Hỗ trợ 3 phương ngữ: Gia Lai, Bình Định, Kon Tum với giọng nam và nữ.

## 🔧 Yêu cầu hệ thống

- **Docker** >= 20.10.0
- **Docker Compose** >= 2.0.0
- **RAM**: Tối thiểu 2GB
- **Disk**: Tối thiểu 1GB trống

## 🚀 Cài đặt và chạy với Docker

### Phương pháp 1: Sử dụng Docker Compose (Khuyến nghị)

1. **Clone repository:**
   ```bash
   git clone <repository-url>
   cd bana-tts-fe
   ```

2. **Chạy ứng dụng:**
   ```bash
   # Build và chạy các container
   docker-compose up -d

   # Hoặc sử dụng npm scripts
   npm run docker:up
   ```

3. **Kiểm tra trạng thái:**
   ```bash
   docker-compose ps
   ```

4. **Xem logs:**
   ```bash
   # Xem tất cả logs
   docker-compose logs -f

   # Chỉ xem logs của app
   docker-compose logs -f bahnar-tts-app

   # Hoặc sử dụng npm script
   npm run docker:logs
   ```

5. **Truy cập ứng dụng:**
   - Frontend: http://localhost
   - API trực tiếp: http://localhost:5000

### Phương pháp 2: Chỉ sử dụng Docker

1. **Build image:**
   ```bash
   docker build -t bahnar-tts-app .
   ```

2. **Chạy container:**
   ```bash
   docker run -d \
     --name bahnar-tts-app \
     -p 5000:5000 \
     -v $(pwd)/logs:/app/logs \
     bahnar-tts-app
   ```

### Các lệnh Docker hữu ích

```bash
# Dừng tất cả services
docker-compose down
# hoặc
npm run docker:down

# Restart services
docker-compose restart
# hoặc
npm run docker:restart

# Build lại images
docker-compose build --no-cache
# hoặc
npm run docker:build

# Xem resource usage
docker stats

# Vào container để debug
docker exec -it bahnar-tts-app bash
```

## 📁 Cấu trúc dự án

```
bana-tts-fe/
├── app.py                 # Flask application chính
├── requirements.txt       # Python dependencies
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Multi-container setup
├── nginx.conf           # Nginx reverse proxy config
├── .dockerignore        # Files ignored by Docker
├── package.json         # NPM scripts và metadata
├── front-end/           # Frontend files
│   ├── index.html       # Giao diện chính
│   ├── main.js         # JavaScript chính
│   ├── ocr.js          # OCR functionality
│   ├── text_parser.js  # Text parsing utilities
│   └── style.css       # Styles
└── logs/               # Application logs (tạo tự động)
```

## ⚙️ Cấu hình

### Biến môi trường

Có thể tùy chỉnh trong `docker-compose.yml`:

```yaml
environment:
  - FLASK_ENV=production          # Flask environment
  - PYTHONPATH=/app              # Python path
  - PORT=5000                    # Application port
  - BAHNAR_API_URL=https://...   # External Bahnar API URL
```

### Cấu hình Nginx

File `nginx.conf` đã được cấu hình với:
- Rate limiting (10 requests/second)
- Security headers
- Reverse proxy tới Flask app
- Static file serving

### Health Checks

Cả hai services đều có health checks:
- **App**: Kiểm tra endpoint `/` mỗi 30s
- **Nginx**: Kiểm tra proxy hoạt động mỗi 30s

## 🔌 API Endpoints

### POST /speak
Chuyển văn bản thành giọng nói.

**Request:**
```json
{
  "text": "Văn bản tiếng Bahnar",
  "voice": "male",        // male|female
  "region": "gialai"      // gialai|binhdinh|kontum
}
```

**Response:**
```json
{
  "success": true,
  "audio_url": "data:audio/wav;base64,..."
}
```

### GET /
Serve static frontend files.

## 🔍 Monitoring và Logging

### Xem logs realtime:
```bash
# Tất cả services
docker-compose logs -f

# Chỉ Flask app
docker-compose logs -f bahnar-tts-app

# Chỉ Nginx
docker-compose logs -f nginx
```

### Log files location:
- Application logs: `./logs/app.log`
- Nginx logs: `./logs/nginx/`

### Health check status:
```bash
docker-compose ps
```

## 🐛 Troubleshooting

### Lỗi thường gặp:

1. **Port đã được sử dụng:**
   ```bash
   # Kiểm tra process sử dụng port
   netstat -tulpn | grep :80
   netstat -tulpn | grep :5000
   
   # Thay đổi port trong docker-compose.yml
   ports:
     - "8080:80"  # Thay vì 80:80
   ```

2. **Container không start được:**
   ```bash
   # Xem logs chi tiết
   docker-compose logs bahnar-tts-app
   
   # Kiểm tra health check
   docker inspect bahnar-tts-app | grep -A 10 Health
   ```

3. **Lỗi kết nối tới Bahnar API:**
   - Kiểm tra kết nối internet
   - Verify API URL trong code
   - Xem logs: `docker-compose logs -f bahnar-tts-app`

4. **Lỗi CORS:**
   - Đã cấu hình CORS trong Flask app
   - Nếu vẫn lỗi, kiểm tra Nginx configuration

5. **Performance issues:**
   ```bash
   # Kiểm tra resource usage
   docker stats
   
   # Tăng memory limit nếu cần
   # Thêm vào docker-compose.yml:
   deploy:
     resources:
       limits:
         memory: 1G
   ```

### Reset hoàn toàn:
```bash
# Dừng và xóa containers, networks, volumes
docker-compose down -v --remove-orphans

# Xóa images (optional)
docker image prune -a

# Build và start lại
docker-compose up -d --build
```

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
