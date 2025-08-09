#!/bin/bash

# Bahnar TTS - VPS Deployment Script
# Usage: ./deploy-vps.sh [server-ip] [domain-optional]

set -e

SERVER_IP=$1
DOMAIN=$2
APP_NAME="bahnar-tts"
APP_USER="bahnar"
REPO_URL="https://github.com/your-username/bana-tts-fe.git"  # Update this

if [ -z "$SERVER_IP" ]; then
    echo "Usage: ./deploy-vps.sh <server-ip> [domain]"
    echo "Example: ./deploy-vps.sh 192.168.1.100 yourdomain.com"
    exit 1
fi

echo "🚀 Starting deployment to $SERVER_IP"

# Step 1: Install Docker and dependencies
echo "📦 Installing Docker and dependencies..."
ssh root@$SERVER_IP << 'EOF'
apt update && apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose-plugin git ufw -y

# Create application user
useradd -m -s /bin/bash bahnar 2>/dev/null || echo "User bahnar already exists"
usermod -aG docker bahnar

# Configure firewall
ufw --force reset
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo "✅ System setup completed"
EOF

# Step 2: Deploy application
echo "🔧 Deploying application..."
ssh root@$SERVER_IP << EOF
su - bahnar -c "
    # Remove existing deployment
    rm -rf bana-tts-fe 2>/dev/null || true
    
    # Clone repository
    git clone $REPO_URL
    cd bana-tts-fe
    
    # Start services
    docker compose down 2>/dev/null || true
    docker compose up -d --build
    
    # Wait for services to start
    sleep 10
    
    # Check status
    docker compose ps
"
EOF

# Step 3: Setup SSL if domain provided
if [ ! -z "$DOMAIN" ]; then
    echo "🔒 Setting up SSL for $DOMAIN..."
    ssh root@$SERVER_IP << EOF
    # Install certbot
    apt install certbot python3-certbot-nginx -y
    
    # Update nginx config for domain
    sed -i 's/server_name _;/server_name $DOMAIN www.$DOMAIN;/g' /home/bahnar/bana-tts-fe/nginx.conf
    
    # Restart nginx
    su - bahnar -c "cd bana-tts-fe && docker compose restart nginx"
    
    # Get SSL certificate
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
EOF
fi

# Step 4: Verify deployment
echo "✅ Verifying deployment..."
HEALTH_CHECK=$(ssh root@$SERVER_IP "curl -s http://localhost/health 2>/dev/null || echo 'FAILED'")

if [ "$HEALTH_CHECK" != "FAILED" ]; then
    echo "🎉 Deployment successful!"
    echo ""
    echo "🌐 Access your application:"
    if [ ! -z "$DOMAIN" ]; then
        echo "   - https://$DOMAIN"
        echo "   - https://www.$DOMAIN"
    else
        echo "   - http://$SERVER_IP"
    fi
    echo ""
    echo "🔧 Management commands:"
    echo "   ssh root@$SERVER_IP"
    echo "   su - bahnar"
    echo "   cd bana-tts-fe"
    echo "   docker compose logs -f    # View logs"
    echo "   docker compose restart    # Restart services"
    echo "   docker compose ps         # Check status"
else
    echo "❌ Deployment failed. Check logs:"
    echo "   ssh root@$SERVER_IP"
    echo "   su - bahnar"
    echo "   cd bana-tts-fe"
    echo "   docker compose logs"
fi
