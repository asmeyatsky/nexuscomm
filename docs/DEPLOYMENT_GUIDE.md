# Deployment Guide

This guide provides comprehensive instructions for deploying NexusComm in various environments including development, staging, and production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Configuration](#configuration)
4. [Deployment Options](#deployment-options)
5. [Docker Deployment](#docker-deployment)
6. [Kubernetes Deployment](#kubernetes-deployment)
7. [Manual Deployment](#manual-deployment)
8. [Database Migration](#database-migration)
9. [SSL/TLS Configuration](#ssltls-configuration)
10. [Monitoring and Logging](#monitoring-and-logging)
11. [Backup and Recovery](#backup-and-recovery)
12. [Scaling](#scaling)
13. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **CPU**: Minimum 4 cores, recommended 8+ cores
- **RAM**: Minimum 8GB, recommended 16GB+
- **Storage**: Minimum 50GB SSD, recommended 100GB+
- **Operating System**: Linux (Ubuntu 20.04+, CentOS 8+), macOS 11+, Windows Server 2019+

### Software Dependencies
- **Node.js**: Version 18.x or higher
- **PostgreSQL**: Version 13.x or higher
- **Redis**: Version 6.x or higher
- **Docker**: Version 20.x or higher (for containerized deployments)
- **Kubernetes**: Version 1.20+ (for Kubernetes deployments)
- **Nginx**: Version 1.18+ (for reverse proxy)
- **Certbot**: Latest version (for SSL certificates)

### Network Requirements
- **Ports**: 80 (HTTP), 443 (HTTPS), 5432 (PostgreSQL), 6379 (Redis)
- **Bandwidth**: Minimum 100Mbps, recommended 1Gbps+
- **Domain**: Registered domain name with DNS management access

## Environment Setup

### Development Environment
```bash
# Clone the repository
git clone https://github.com/nexuscomm/nexuscomm.git
cd nexuscomm

# Install dependencies
npm install

# Navigate to backend
cd backend
npm install

# Navigate to mobile app
cd ../mobile
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with appropriate values
```

### Staging Environment
```bash
# Clone with specific branch for staging
git clone -b staging https://github.com/nexuscomm/nexuscomm.git
cd nexuscomm

# Install dependencies
npm ci

# Set up staging environment variables
cp .env.staging .env
# Edit .env with staging values
```

### Production Environment
```bash
# Clone with production branch
git clone -b production https://github.com/nexuscomm/nexuscomm.git
cd nexuscomm

# Install only production dependencies
npm ci --only=production

# Set up production environment variables
cp .env.production .env
# Edit .env with production values
```

## Configuration

### Environment Variables
Create a `.env` file in the project root with the following variables:

```env
# Application Settings
NODE_ENV=production
PORT=3000
APP_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexuscomm_production
DB_USER=nexuscomm_user
DB_PASSWORD=secure_password
DB_SSL=true

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REFRESH_TOKEN_EXPIRES_IN=30d

# API Keys
OPENAI_API_KEY=your_openai_api_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_SECURE=true

# Security
ENCRYPTION_KEY=your_encryption_key_here
COOKIE_SECRET=your_cookie_secret_here

# Third-Party Services
SENTRY_DSN=your_sentry_dsn
NEW_RELIC_LICENSE_KEY=your_new_relic_license_key

# Performance
WORKER_CONCURRENCY=10
MAX_CONNECTIONS=100
QUERY_TIMEOUT=30000
```

### Database Configuration
Configure PostgreSQL with appropriate settings:

```sql
-- Create database and user
CREATE DATABASE nexuscomm_production;
CREATE USER nexuscomm_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE nexuscomm_production TO nexuscomm_user;

-- Configure connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';
```

## Deployment Options

### 1. Docker Deployment (Recommended for Small-Medium Deployments)
- Easy setup and management
- Containerized services
- Built-in health checks
- Automated restart policies

### 2. Kubernetes Deployment (Recommended for Large Enterprise Deployments)
- Horizontal scaling
- Advanced load balancing
- Self-healing capabilities
- Rolling updates
- Resource quotas and limits

### 3. Manual Deployment (For Development/Testing)
- Direct installation on system
- Full control over processes
- Debugging capabilities
- Not recommended for production

## Docker Deployment

### Single Container Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Scale services as needed
docker-compose up -d --scale backend=3 --scale worker=2
```

### Multi-Container Deployment
```dockerfile
# Dockerfile for Backend Service
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nexuscomm -u 1001
USER nexuscomm

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    restart: unless-stopped

  postgres:
    image: postgres:13-alpine
    environment:
      POSTGRES_DB: nexuscomm_production
      POSTGRES_USER: nexuscomm_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

  backend:
    build: .
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  worker:
    build: .
    command: npm run worker
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M

volumes:
  postgres_data:
  redis_data:
```

### Docker Environment Variables
Create a `.env.docker` file:
```env
# Database
DB_PASSWORD=your_secure_database_password

# Redis
REDIS_PASSWORD=your_secure_redis_password

# Application Secrets
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REFRESH_TOKEN_EXPIRES_IN=30d
ENCRYPTION_KEY=your_encryption_key_here
COOKIE_SECRET=your_cookie_secret_here

# API Keys
OPENAI_API_KEY=your_openai_api_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_SECURE=true
```

## Kubernetes Deployment

### Namespace Setup
```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: nexuscomm
```

### ConfigMap
```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nexuscomm-config
  namespace: nexuscomm
data:
  NODE_ENV: "production"
  PORT: "3000"
  DB_HOST: "postgres-service"
  DB_PORT: "5432"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
```

### Secrets
```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: nexuscomm-secrets
  namespace: nexuscomm
type: Opaque
data:
  DB_PASSWORD: eW91cl9zZWN1cmVfZGF0YWJhc2VfcGFzc3dvcmQ=
  JWT_SECRET: eW91cl9qd3Rfc2VjcmV0X2tleV9oZXJl
  # ... other secrets base64 encoded
```

### Deployment
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nexuscomm-backend
  namespace: nexuscomm
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nexuscomm-backend
  template:
    metadata:
      labels:
        app: nexuscomm-backend
    spec:
      containers:
      - name: backend
        image: nexuscomm/backend:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: nexuscomm-config
        - secretRef:
            name: nexuscomm-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Service
```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: nexuscomm-service
  namespace: nexuscomm
spec:
  selector:
    app: nexuscomm-backend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

### Ingress
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nexuscomm-ingress
  namespace: nexuscomm
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: nexuscomm-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nexuscomm-service
            port:
              number: 80
```

### Helm Chart (Optional)
Create a Helm chart for easier deployment:

```yaml
# Chart.yaml
apiVersion: v2
name: nexuscomm
description: NexusComm Deployment
version: 1.0.0
appVersion: 1.0.0
```

```yaml
# values.yaml
replicaCount: 3

image:
  repository: nexuscomm/backend
  tag: latest
  pullPolicy: Always

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  hosts:
    - host: api.yourdomain.com
      paths: ["/"]

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

## Manual Deployment

### Installing Dependencies
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Redis
sudo apt install redis-server -y

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

### Setting Up Services
```bash
# Create nexuscomm user
sudo useradd -r -s /bin/false nexuscomm

# Create application directory
sudo mkdir -p /opt/nexuscomm
sudo chown nexuscomm:nexuscomm /opt/nexuscomm

# Copy application files
sudo cp -r . /opt/nexuscomm/
sudo chown -R nexuscomm:nexuscomm /opt/nexuscomm

# Install dependencies
cd /opt/nexuscomm
sudo -u nexuscomm npm ci --only=production

# Create systemd service file
sudo tee /etc/systemd/system/nexuscomm.service << EOF
[Unit]
Description=NexusComm Application
After=network.target

[Service]
Type=simple
User=nexuscomm
WorkingDirectory=/opt/nexuscomm
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
EnvironmentFile=/opt/nexuscomm/.env

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable nexuscomm
sudo systemctl start nexuscomm
```

### Nginx Configuration
```nginx
# /etc/nginx/sites-available/nexuscomm
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### SSL Certificate Setup
```bash
# Obtain SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## Database Migration

### Initial Setup
```bash
# Run database migrations
cd backend
npm run db:migrate

# Seed initial data (if applicable)
npm run db:seed
```

### Migration Scripts
```typescript
// migrations/1640995200000-InitialSetup.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSetup1640995200000 implements MigrationInterface {
    name = 'InitialSetup1640995200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "username" character varying NOT NULL,
                "password_hash" character varying NOT NULL,
                "display_name" character varying,
                "profile_picture" character varying,
                "is_email_verified" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
        
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_e12875dfb3b1d92d7d7c5377e2" ON "users" ("email")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_e12875dfb3b1d92d7d7c5377e2"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}
```

### Backup and Restore
```bash
# Backup database
pg_dump -h localhost -U nexuscomm_user -W nexuscomm_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
psql -h localhost -U nexuscomm_user -W nexuscomm_production < backup_file.sql
```

## SSL/TLS Configuration

### Let's Encrypt with Certbot
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal cron job
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### Manual Certificate Installation
```bash
# Place certificates in /etc/ssl/certs/
sudo cp your_domain.crt /etc/ssl/certs/
sudo cp your_domain.key /etc/ssl/private/

# Update Nginx configuration
sudo nano /etc/nginx/sites-available/nexuscomm

# Add SSL configuration
ssl_certificate /etc/ssl/certs/your_domain.crt;
ssl_certificate_key /etc/ssl/private/your_domain.key;
```

### HSTS Configuration
```nginx
# Add to Nginx server block
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

## Monitoring and Logging

### Application Monitoring
```javascript
// Setup monitoring with Prometheus
const prometheus = require('prom-client');
const express = require('express');
const app = express();

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
});

// Middleware to track metrics
app.use((req, res, next) => {
    const end = httpRequestDuration.startTimer();
    res.on('finish', () => {
        end({
            method: req.method,
            route: req.route ? req.route.path : req.path,
            status_code: res.statusCode
        });
    });
    next();
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', prometheus.register.contentType);
    res.end(await prometheus.register.metrics());
});
```

### Logging Configuration
```javascript
// Winston logger setup
const winston = require('winston');
const { format, transports } = winston;
const { combine, timestamp, printf, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
});

const logger = winston.createLogger({
    format: combine(
        timestamp(),
        errors({ stack: true }),
        logFormat
    ),
    transports: [
        new transports.File({
            filename: 'logs/error.log',
            level: 'error'
        }),
        new transports.File({
            filename: 'logs/combined.log'
        }),
        new transports.Console({
            format: combine(
                format.colorize(),
                timestamp(),
                logFormat
            )
        })
    ]
});

module.exports = logger;
```

### Health Checks
```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check database connectivity
        await dataSource.query('SELECT 1');
        
        // Check Redis connectivity
        await redisClient.ping();
        
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            checks: {
                database: 'ok',
                redis: 'ok',
                diskSpace: 'ok'
            }
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});
```

## Backup and Recovery

### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/nexuscomm"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U nexuscomm_user -W nexuscomm_production > $BACKUP_DIR/db_backup_$DATE.sql

# Application files backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /opt/nexuscomm

# Remove old backups
find $BACKUP_DIR -name "*.sql" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_DIR s3://your-backup-bucket/ --recursive
```

### Recovery Procedure
```bash
# Stop services
sudo systemctl stop nexuscomm

# Restore database
psql -h localhost -U nexuscomm_user -W nexuscomm_production < backup_file.sql

# Restore application files
sudo rm -rf /opt/nexuscomm/*
sudo tar -xzf app_backup.tar.gz -C /opt/nexuscomm/
sudo chown -R nexuscomm:nexuscomm /opt/nexuscomm

# Start services
sudo systemctl start nexuscomm
```

## Scaling

### Horizontal Scaling
```yaml
# Kubernetes Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nexuscomm-hpa
  namespace: nexuscomm
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nexuscomm-backend
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Load Balancing
```nginx
# Nginx upstream configuration
upstream nexuscomm_backend {
    server backend-1:3000 weight=3;
    server backend-2:3000 weight=2;
    server backend-3:3000 weight=1;
    least_conn;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://nexuscomm_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Caching Strategy
```javascript
// Redis caching implementation
const redis = require('redis');
const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});

// Cache middleware
const cacheMiddleware = (duration) => {
    return async (req, res, next) => {
        const key = `cache_${req.originalUrl}`;
        
        try {
            const cached = await client.get(key);
            if (cached) {
                return res.json(JSON.parse(cached));
            }
            
            // Override res.send to cache the response
            const originalSend = res.send;
            res.send = function(body) {
                client.setex(key, duration, body);
                originalSend.call(this, body);
            };
            
            next();
        } catch (error) {
            next();
        }
    };
};
```

## Troubleshooting

### Common Issues and Solutions

#### Database Connection Issues
```bash
# Check database service status
sudo systemctl status postgresql

# Test database connection
psql -h localhost -U nexuscomm_user -W nexuscomm_production

# Check firewall settings
sudo ufw status
```

#### Redis Connection Issues
```bash
# Check Redis service status
sudo systemctl status redis

# Test Redis connection
redis-cli ping

# Check Redis configuration
sudo nano /etc/redis/redis.conf
```

#### Memory Issues
```bash
# Check memory usage
free -h
top

# Adjust Node.js memory limits
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### Performance Issues
```bash
# Monitor system resources
htop
iotop
iftop

# Check application logs
journalctl -u nexuscomm -f

# Analyze slow queries
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### SSL Certificate Issues
```bash
# Check certificate expiration
openssl x509 -in /etc/ssl/certs/your_domain.crt -text -noout

# Renew certificate
sudo certbot renew

# Test SSL configuration
openssl s_client -connect api.yourdomain.com:443
```

### Diagnostic Commands

```bash
# Check all running services
sudo systemctl list-units --type=service --state=running | grep nexus

# Check application logs
sudo journalctl -u nexuscomm -f

# Check network connections
netstat -tulpn | grep :3000

# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
top -p $(pgrep -f nexuscomm)
```

### Emergency Procedures

#### Service Restart
```bash
# Graceful restart
sudo systemctl restart nexuscomm

# Hard restart
sudo systemctl stop nexuscomm
sudo systemctl start nexuscomm

# Check service status
sudo systemctl status nexuscomm
```

#### Rollback Deployment
```bash
# For Docker deployments
docker-compose down
git checkout previous_tag
docker-compose up -d

# For manual deployments
sudo systemctl stop nexuscomm
# Restore previous version files
sudo systemctl start nexuscomm
```

## Maintenance Schedule

### Daily Tasks
- Check application logs for errors
- Monitor system resources (CPU, memory, disk)
- Verify backup completion
- Check SSL certificate expiration

### Weekly Tasks
- Update system packages
- Rotate application logs
- Review security alerts
- Performance tuning

### Monthly Tasks
- Database maintenance and optimization
- Security audit and penetration testing
- Update dependencies
- Disaster recovery testing

---

This deployment guide provides comprehensive instructions for deploying NexusComm in various environments. Always test deployments in a staging environment before applying to production systems.