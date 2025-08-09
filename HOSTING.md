# 🚀 HOSTING GUIDE - Bahnar TTS Application

## 📋 Tùy chọn hosting

### 1. 🏠 **Local Development (Current)**
- **Status**: ✅ Đang chạy
- **URL**: http://localhost
- **Phù hợp**: Development, testing, demo cục bộ

### 2. ☁️ **Cloud Hosting (Production)**

#### A. **VPS/Cloud Server (Khuyến nghị)**
**Phù hợp với**: Production, có thể customize toàn bộ

**Requirements**:
- Ubuntu 20.04+ hoặc CentOS 8+
- 2GB RAM, 20GB disk
- Docker & Docker Compose

**Providers**:
- **DigitalOcean**: $12/tháng (2GB RAM)
- **Vultr**: $10/tháng (2GB RAM) 
- **AWS EC2**: $15-20/tháng
- **Google Cloud**: $15-20/tháng
- **Vietnam**: BKHOST, Azdigi ($8-15/tháng)

#### B. **Container Platforms (Easiest)**
**Phù hợp với**: Quick deployment, auto-scaling

**Providers**:
- **Railway**: Free tier, $5/tháng paid
- **Render**: Free tier, $7/tháng paid
- **Heroku**: $7/tháng
- **AWS Fargate**: $15-30/tháng
- **Google Cloud Run**: Pay per use

#### C. **Platform-as-a-Service**
**Phù hợp với**: Zero config deployment

**Providers**:
- **Vercel**: Free tier (frontend only)
- **Netlify**: Free tier (frontend only) 
- **PythonAnywhere**: $5/tháng

---

## 🔧 **VPS Deployment (Step-by-step)**

### Step 1: Tạo VPS
```bash
# Example với DigitalOcean/Vultr
# Chọn Ubuntu 22.04, 2GB RAM, 50GB SSD
```

### Step 2: Setup Server
```bash
# Connect via SSH
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Create app user
adduser --disabled-password --gecos "" bahnar
usermod -aG docker bahnar
```

### Step 3: Deploy Application
```bash
# Switch to app user
su - bahnar

# Clone repository  
git clone https://github.com/your-username/bana-tts-fe.git
cd bana-tts-fe

# Deploy
docker compose up -d --build

# Check status
docker compose ps
```

### Step 4: Configure Firewall
```bash
# Allow HTTP/HTTPS
ufw allow 80
ufw allow 443
ufw allow 22  # SSH
ufw enable
```

### Step 5: Setup Domain (Optional)
```bash
# Point domain to server IP
# A record: yourdomain.com -> your-server-ip
# CNAME: www.yourdomain.com -> yourdomain.com
```

---

## 🌐 **Railway Deployment (Recommended for beginners)**

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add railway config"
git push origin main
```

### Step 2: Deploy on Railway
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect Dockerfile and deploy

### Step 3: Configure Environment
- Add environment variables if needed
- Set custom domain (optional)
- Monitor logs and metrics

---

## 🐋 **Render Deployment**

### Step 1: Create render.yaml
```yaml
services:
  - type: web
    name: bahnar-tts
    env: docker
    plan: starter
    dockerfilePath: ./Dockerfile
    envVars:
      - key: FLASK_ENV
        value: production
      - key: PORT
        value: 5000
```

### Step 2: Deploy
1. Push code to GitHub
2. Go to https://render.com
3. Connect GitHub repository
4. Select "Web Service"
5. Configure and deploy

---

## 🏢 **Enterprise/Production Setup**

### AWS EC2 + Load Balancer
```bash
# Use Terraform or CloudFormation
# Setup Auto Scaling Group
# Application Load Balancer
# RDS for database (if needed)
# CloudFront for CDN
```

### Google Cloud Platform
```bash
# Cloud Run for serverless
# Compute Engine for VMs
# Load Balancer
# Cloud CDN
```

### Kubernetes (Advanced)
```yaml
# k8s deployment manifests
# Ingress controller
# SSL certificates
# Monitoring with Prometheus/Grafana
```

---

## 🔒 **Production Security**

### 1. SSL Certificate
```bash
# Let's Encrypt với Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 2. Environment Variables
```bash
# Never commit secrets to git
# Use .env files or cloud secrets manager
echo "BAHNAR_API_KEY=your-secret-key" > .env
```

### 3. Monitoring
```bash
# Add to docker-compose.yml
services:
  monitoring:
    image: prom/prometheus
    ports:
      - "9090:9090"
```

### 4. Backup
```bash
# Automated backups
# Database snapshots
# Code versioning
```

---

## 💰 **Cost Comparison**

| Platform | Free Tier | Paid Start | Pro/Enterprise |
|----------|-----------|------------|----------------|
| Railway | 500 hours/month | $5/month | $20/month |
| Render | 750 hours/month | $7/month | $25/month |
| Heroku | None | $7/month | $25-250/month |
| DigitalOcean | $200 credit | $12/month | $50+/month |
| AWS | 1 year free | $15/month | $100+/month |
| Google Cloud | $300 credit | $15/month | $100+/month |

---

## 🚀 **Quick Start Recommendations**

### For Learning/Demo:
1. **Railway** - Easiest deployment
2. **Render** - Good free tier
3. **Local Docker** - Development

### For Small Production:
1. **DigitalOcean Droplet** - $12/month
2. **Railway Pro** - $5/month
3. **Vultr** - $10/month

### For Enterprise:
1. **AWS/GCP** - Full stack
2. **Kubernetes** - Container orchestration
3. **Multi-region** deployment

---

## 📞 **Next Steps**

1. Choose hosting platform based on your needs
2. Push code to GitHub repository
3. Follow platform-specific deployment guide
4. Configure domain and SSL
5. Set up monitoring and backups

**Need help with specific deployment?** Let me know which platform you prefer!
