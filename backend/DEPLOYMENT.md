# XF Shopee Backend - Deployment Guide

This document provides comprehensive instructions for deploying the XF Shopee backend service on a Linux server with Node.js, Nginx, and MySQL.

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Clients   │────▶│    Nginx        │────▶│  Node.js App    │
│   (Frontend)    │     │   (Reverse      │     │   (Express)     │
└─────────────────┘     │    Proxy)       │     └─────────────────┘
                        └─────────────────┘              │
                                                         ▼
                                                  ┌─────────────────┐
                                                  │    MySQL        │
                                                  │   Database      │
                                                  └─────────────────┘
```

## Prerequisites

### 1. Server Requirements
- **Operating System**: Ubuntu 20.04 LTS or later / CentOS 8 or later
- **CPU**: Minimum 2 cores
- **RAM**: Minimum 4GB
- **Storage**: 20GB free disk space
- **Network**: Static IP address, open ports 80 (HTTP), 443 (HTTPS), 3000 (App)

### 2. Software Requirements
- **Node.js**: 18.x or later
- **npm**: 8.x or later
- **MySQL**: 8.0 or later
- **Nginx**: 1.18 or later
- **PM2**: For process management (recommended)

## Environment Setup

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential

# Add Node.js repository (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x or later
npm --version   # Should show 8.x or later
```

### 2. MySQL Installation and Configuration

```bash
# Install MySQL Server
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Log into MySQL
sudo mysql -u root

# Create database and user
CREATE DATABASE xf_shopee CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'xfshopee_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON xf_shopee.* TO 'xfshopee_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Verify database creation
mysql -u xfshopee_user -p -e "SHOW DATABASES;"
```

### 3. Nginx Installation

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
```

## Application Deployment

### 1. Clone Repository

```bash
# Create application directory
sudo mkdir -p /opt/xf-shopee
sudo chown $USER:$USER /opt/xf-shopee
cd /opt/xf-shopee

# Clone repository (or copy files)
git clone https://github.com/your-organization/xf-shopee.git .
# OR copy your local files via SCP/RSYNC
```

### 2. Environment Configuration

```bash
# Copy environment file template
cp .env.example .env

# Edit environment variables
nano .env
```

**Environment Variables (.env):**
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=xfshopee_user
DB_PASSWORD=secure_password_here
DB_NAME=xf_shopee
# DB_SOCKET=/var/run/mysqld/mysqld.sock  # Uncomment if using socket

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_here_change_this_in_production
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Application Security
CORS_ORIGIN=https://your-domain.com,http://localhost:3001
API_RATE_LIMIT=100
API_RATE_WINDOW=15m

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/xf-shopee/backend.log
```

### 3. Install Dependencies

```bash
# Navigate to backend directory
cd /opt/xf-shopee/backend

# Install production dependencies
npm ci --only=production

# If you need dev dependencies for building (if any)
# npm ci
```

### 3.1 Build Frontend Applications

#### Configure Frontend Environment Variables

```bash
# Configure web-front shopping site
cd /opt/xf-shopee/frontend/web-front
cp .env.example .env.production
# Edit .env.production to set API base URL
nano .env.production
```

**web-front/.env.production:**
```env
VITE_API_BASE_URL=/xfbh/api
VITE_APP_TITLE=XF Shopee
VITE_DEBUG=false
```

```bash
# Configure web-admin dashboard
cd /opt/xf-shopee/frontend/web-admin
cp .env.example .env.production
# Edit .env.production to set API base URL
nano .env.production
```

**web-admin/.env.production:**
```env
VITE_BASE_PATH=/xfbh/admin/
VITE_API_BASE_URL=/xfbh/api
VITE_APP_TITLE=XF Shopee Admin
VITE_DEBUG=false
```

#### Build Frontend Applications

```bash
# Build web-front shopping site (with production environment)
cd /opt/xf-shopee/frontend/web-front
npm ci
VITE_USER_NODE_ENV=production npm run build
# Output will be in /opt/xf-shopee/frontend/web-front/dist/

# Build web-admin dashboard (with production environment)
cd /opt/xf-shopee/frontend/web-admin
npm ci
VITE_USER_NODE_ENV=production npm run build
# Output will be in /opt/xf-shopee/frontend/web-admin/build/

# Note: For production, you might want to install only production dependencies
# npm ci --only=production
```

### 4. Database Migration

```bash
# The application auto-initializes database on first run
# To manually initialize or verify:

# Test database connection
node -e "const db = require('./src/config/database'); db.testConnection().then(console.log).catch(console.error);"

# Start application (will auto-create tables)
npm start
# After confirming tables are created, stop with Ctrl+C
```

### 5. Process Management with PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application with PM2
pm2 start src/index.js --name "xf-shopee-backend" \
  --env production \
  --log /var/log/xf-shopee/pm2.log \
  --output /var/log/xf-shopee/out.log \
  --error /var/log/xf-shopee/error.log \
  --time

# Configure PM2 to start on boot
pm2 startup
# Follow the displayed command to enable startup script
pm2 save

# Monitor application
pm2 status
pm2 logs xf-shopee-backend --lines 50
```

## Nginx Configuration

### 1. Create Nginx Site Configuration

```bash
sudo nano /etc/nginx/sites-available/xf-shopee
```

**Configuration (`/etc/nginx/sites-available/xf-shopee`):**
```nginx
# Backend upstream
upstream xf_shopee_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS (uncomment after SSL setup)
    # return 301 https://$server_name$request_uri;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Logs
    access_log /var/log/nginx/xf-shopee-access.log;
    error_log /var/log/nginx/xf-shopee-error.log;
    
    # Default location - redirect to shopping site
    location / {
        return 301 /xfbh/shop/;
    }
    
    # Shopping site (web-front)
    location /xfbh/shop/ {
        alias /opt/xf-shopee/frontend/web-front/dist/;
        index index.html;
        try_files $uri $uri/ /xfbh/shop/index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Admin dashboard (web-admin)
    location /xfbh/admin/ {
        alias /opt/xf-shopee/frontend/web-admin/build/;
        index index.html;
        try_files $uri $uri/ /xfbh/admin/index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API endpoints (支持 .json 扩展名)
    location ~ ^/xfbh/api/(.*?)\.json$ {
        rewrite ^/xfbh/api/(.*?)\.json$ /api/$1 break;
        proxy_pass http://xf_shopee_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Requested-With' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '$http_origin';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Requested-With';
            add_header 'Access-Control-Allow-Credentials' 'true';
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API endpoints (无 .json 扩展名)
    location /xfbh/api/ {
        proxy_pass http://xf_shopee_backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Requested-With' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '$http_origin';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Requested-With';
            add_header 'Access-Control-Allow-Credentials' 'true';
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Rate limiting (optional)
        # limit_req zone=api burst=10 nodelay;
    }
    
    # Health check endpoint
    location /xfbh/api/health {
        proxy_pass http://xf_shopee_backend/api/health;
        access_log off;
    }
    
    # Static file serving for backend
    location /xfbh/static/ {
        alias /opt/xf-shopee/backend/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Mobile app static resources (if needed)
    location /xfbh/mobile/ {
        alias /opt/xf-shopee/mobile/web/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 2. Enable Nginx Site

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/xf-shopee /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## SSL/TLS Configuration (Optional but Recommended)

### 1. Install Certbot

```bash
# Install Certbot for Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal setup
sudo certbot renew --dry-run
```

### 2. Update Nginx Configuration for HTTPS

After Certbot setup, your Nginx config will be updated automatically. Ensure it includes:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # ... rest of configuration
}
```

## Security Hardening

### 1. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### 2. Application User (Recommended)

```bash
# Create dedicated user for application
sudo useradd -r -s /bin/false xfshopee

# Change ownership of application directory
sudo chown -R xfshopee:xfshopee /opt/xf-shopee
sudo chmod -R 750 /opt/xf-shopee

# Update PM2 to run as application user
pm2 delete xf-shopee-backend
pm2 start src/index.js --name "xf-shopee-backend" --user xfshopee
```

### 3. Database Security

```bash
# MySQL security best practices
sudo mysql -u root

# Create read-only user for monitoring
CREATE USER 'xfshopee_monitor'@'localhost' IDENTIFIED BY 'monitor_password';
GRANT SELECT, SHOW VIEW ON xf_shopee.* TO 'xfshopee_monitor'@'localhost';

# Remove anonymous users
DELETE FROM mysql.user WHERE User='';
FLUSH PRIVILEGES;
EXIT;
```

## Monitoring and Maintenance

### 1. Log Management

```bash
# Create log directory
sudo mkdir -p /var/log/xf-shopee
sudo chown xfshopee:xfshopee /var/log/xf-shopee

# Set up log rotation for application logs
sudo nano /etc/logrotate.d/xf-shopee
```

**Logrotate configuration (`/etc/logrotate.d/xf-shopee`):**
```bash
/var/log/xf-shopee/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 xfshopee xfshopee
    sharedscripts
    postrotate
        pm2 reload xf-shopee-backend --update-env
    endscript
}
```

### 2. Health Monitoring

```bash
# Create health check script
sudo nano /opt/xf-shopee/health-check.sh
```

**Health check script:**
```bash
#!/bin/bash

# Check if application is responding
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$HTTP_STATUS" != "200" ]; then
    echo "Health check failed: HTTP $HTTP_STATUS"
    exit 1
fi

# Check database connection
DB_CHECK=$(node -e "
const db = require('/opt/xf-shopee/backend/src/config/database');
db.testConnection().then(() => {
    console.log('OK');
    process.exit(0);
}).catch(err => {
    console.error('Database connection failed');
    process.exit(1);
});
")

if [ $? -ne 0 ]; then
    echo "Database check failed"
    exit 1
fi

echo "All checks passed"
exit 0
```

```bash
# Make executable
chmod +x /opt/xf-shopee/health-check.sh

# Test health check
/opt/xf-shopee/health-check.sh
```

### 3. Backup Strategy

```bash
# Create backup script
sudo nano /opt/xf-shopee/backup.sh
```

**Backup script:**
```bash
#!/bin/bash

BACKUP_DIR="/var/backups/xf-shopee"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u xfshopee_user -p'your_password' xf_shopee > $BACKUP_DIR/db_backup_$DATE.sql
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Backup application code (optional)
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /opt/xf-shopee --exclude=node_modules

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR"
```

```bash
# Schedule daily backup with cron
sudo crontab -e
# Add: 0 2 * * * /opt/xf-shopee/backup.sh
```

## Deployment Automation (CI/CD)

### 1. Deployment Script

Create a deployment script for one-click deployments:

```bash
#!/bin/bash
# deploy.sh

set -e  # Exit on error

echo "🚀 Starting XF Shopee Backend Deployment..."

# Pull latest changes
cd /opt/xf-shopee
git pull origin main

# Install dependencies
cd backend
npm ci --only=production

# Run database migrations (if any)
# node scripts/migrate.js

# Restart application
pm2 reload xf-shopee-backend --update-env

echo "✅ Deployment completed successfully!"
```

### 2. Environment-Specific Configuration

For multi-environment deployments (dev/staging/prod), create environment-specific files:

```
/opt/xf-shopee/backend/
├── .env.production
├── .env.staging
├── .env.development
└── deploy-env.sh
```

**deploy-env.sh:**
```bash
#!/bin/bash

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 [production|staging|development]"
    exit 1
fi

# Copy appropriate environment file
cp .env.$ENVIRONMENT .env

# Restart with new environment
pm2 restart xf-shopee-backend --env $ENVIRONMENT
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Application Won't Start

```bash
# Check PM2 logs
pm2 logs xf-shopee-backend --lines 100

# Check application logs
tail -f /var/log/xf-shopee/error.log

# Check if port is in use
sudo netstat -tlnp | grep :3000
```

#### 2. Database Connection Issues

```bash
# Test database connectivity
mysql -u xfshopee_user -p -e "SELECT 1;"

# Check MySQL service
sudo systemctl status mysql

# Verify credentials in .env file
```

#### 3. Nginx 502 Bad Gateway

```bash
# Check if Node.js app is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/xf-shopee-error.log

# Test backend directly
curl http://localhost:3000/api/health
```

#### 4. Performance Issues

```bash
# Monitor system resources
htop

# Check application memory usage
pm2 monit

# Analyze slow database queries
sudo mysql -e "SHOW PROCESSLIST;"
```

## Rollback Procedure

### 1. Application Rollback

```bash
# Revert to previous Git commit
cd /opt/xf-shopee
git log --oneline -5  # Identify previous commit
git reset --hard COMMIT_HASH

# Restart with previous version
pm2 restart xf-shopee-backend
```

### 2. Database Rollback

```bash
# Restore from latest backup
BACKUP_FILE=$(ls -t /var/backups/xf-shopee/db_backup_*.sql.gz | head -1)
gunzip -c $BACKUP_FILE | mysql -u xfshopee_user -p xf_shopee
```

## Scaling Considerations

### 1. Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize MySQL configuration (`/etc/mysql/my.cnf`)
- Enable query caching
- Increase PM2 instances (cluster mode)

### 2. Horizontal Scaling

- Add load balancer
- Deploy multiple application instances
- Use Redis for session storage
- Implement database replication

## Maintenance Schedule

| Task | Frequency | Command/Notes |
|------|-----------|---------------|
| Update system packages | Weekly | `sudo apt update && sudo apt upgrade` |
| Backup verification | Daily | Check backup logs |
| Log rotation | Daily | Automatic via logrotate |
| SSL certificate renewal | 90 days | Automatic via Certbot |
| Performance monitoring | Continuous | PM2 + custom scripts |
| Security updates | As released | Monitor security advisories |

---

## Quick Start Summary

For a quick deployment, follow these minimal steps:

```bash
# 1. Install prerequisites
sudo apt update && sudo apt install -y nodejs mysql-server nginx

# 2. Setup database
sudo mysql -e "CREATE DATABASE xf_shopee; CREATE USER 'xfshopee'@'localhost' IDENTIFIED BY 'password'; GRANT ALL ON xf_shopee.* TO 'xfshopee'@'localhost';"

# 3. Deploy application
cd /opt
git clone https://github.com/your-org/xf-shopee.git
cd xf-shopee/backend
npm ci --production
cp .env.example .env
# Edit .env with database credentials

# 4. Start with PM2
npm install -g pm2
pm2 start src/index.js --name "xf-shopee"

# 5. Configure Nginx
# Copy nginx config from above and reload
```

---

**Last Updated**: April 2026  
**Version**: 1.0.0  
**Maintainer**: XF Shopee DevOps Team  
**Support**: Contact system administrator for deployment assistance