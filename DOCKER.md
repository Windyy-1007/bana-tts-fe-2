# DOCKER DEPLOYMENT - HƯỚNG DẪN NHANH

## 🚀 Khởi chạy nhanh

### Windows:
```cmd
# Chạy script tự động
start-docker.bat

# Hoặc thủ công:
docker-compose up -d --build
```

### Linux/macOS:
```bash
# Chạy script tự động
chmod +x start-docker.sh
./start-docker.sh

# Hoặc thủ công:
docker-compose up -d --build
```

## ⚡ Các lệnh cơ bản

```bash
# Bắt đầu
docker-compose up -d

# Dừng
docker-compose down

# Restart
docker-compose restart

# Xem logs
docker-compose logs -f

# Kiểm tra status
docker-compose ps

# Build lại
docker-compose up -d --build
```

## 🌐 Truy cập

- **Frontend**: http://localhost
- **API**: http://localhost:5000

## 🔧 Cấu hình nhanh

### Thay đổi port:
Sửa trong `docker-compose.yml`:
```yaml
ports:
  - "8080:80"    # Frontend qua port 8080
  - "5001:5000"  # API qua port 5001
```

### Environment variables:
```yaml
environment:
  - FLASK_ENV=development  # Để debug
  - PORT=5000
```

## 🐛 Debug nhanh

1. **Container không start**: `docker-compose logs service-name`
2. **Port bị chiếm**: Đổi port trong docker-compose.yml  
3. **Lỗi permission**: `docker-compose down -v && docker-compose up -d`
4. **Reset hoàn toàn**: 
   ```bash
   docker-compose down -v --remove-orphans
   docker system prune -a
   docker-compose up -d --build
   ```

## 📊 Monitoring

```bash
# Resource usage
docker stats

# Container health
docker inspect bahnar-tts-app | grep -A 5 Health

# Logs realtime  
docker-compose logs -f bahnar-tts-app
```

## 🔄 Production Tips

1. **Scale app**: `docker-compose up -d --scale bahnar-tts-app=3`
2. **Auto restart**: Already configured with `restart: unless-stopped`
3. **Health checks**: Built-in, check with `docker-compose ps`
4. **Log rotation**: Consider configuring log rotation for production

---
**Ready in 30 seconds!** ⚡
