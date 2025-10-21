# NexusComm Deployment Guide

Complete instructions for setting up and deploying NexusComm.

## Local Development Setup

### Prerequisites

- **Node.js**: 18.x or higher
- **PostgreSQL**: 13.x or higher
- **Redis**: 7.x or higher
- **npm**: 8.x or higher
- **Git**: Latest version
- **Docker** (optional): For containerized deployment

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd nexuscomm
```

### Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# This installs workspace dependencies for backend, mobile, and shared
```

### Step 3: Database Setup

```bash
# Create PostgreSQL database
createdb -U postgres nexuscomm_db

# Run migrations
npm --prefix backend run migrate
```

### Step 4: Environment Configuration

Copy environment templates:

```bash
cp backend/.env.example backend/.env
cp mobile/.env.example mobile/.env
```

Edit `backend/.env`:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=nexuscomm_db

# JWT
JWT_SECRET=your_super_secret_jwt_key
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Encryption
ENCRYPTION_SECRET=your_encryption_secret_min_32_chars

# API URLs
CLIENT_URL=http://localhost:3001
API_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Platform Integrations
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id
WHATSAPP_BUSINESS_PHONE_ID=your_phone_id
WHATSAPP_BUSINESS_ACCOUNT_ACCESS_TOKEN=your_token

GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_secret
GMAIL_REDIRECT_URI=http://localhost:3000/auth/gmail/callback

INSTAGRAM_ACCESS_TOKEN=your_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_account_id

LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/linkedin/callback
```

### Step 5: Start Development Servers

#### Option A: Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

#### Option B: Manual Setup

Terminal 1 - Backend:

```bash
cd backend
npm run dev
# Backend running on http://localhost:3000
```

Terminal 2 - Mobile:

```bash
cd mobile
npm run dev
# Expo running on http://localhost:19000
```

### Step 6: Verify Installation

```bash
# Check backend health
curl http://localhost:3000/api/health

# Response should be:
# {"status":"ok","timestamp":"2025-10-21T..."}
```

## Production Deployment

### AWS Deployment (Recommended)

#### Backend Deployment (ECS/Fargate)

1. **Build Docker Image**

```bash
docker build -t nexuscomm-backend:latest ./backend
docker tag nexuscomm-backend:latest YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/nexuscomm-backend:latest
docker push YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/nexuscomm-backend:latest
```

2. **Configure ECS Task Definition**

```json
{
  "family": "nexuscomm-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/nexuscomm-backend:latest",
      "portMappings": [{"containerPort": 3000}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"}
      ]
    }
  ]
}
```

3. **Create ECS Service**

```bash
aws ecs create-service \
  --cluster nexuscomm \
  --service-name nexuscomm-backend \
  --task-definition nexuscomm-backend \
  --desired-count 2 \
  --launch-type FARGATE
```

#### Database Setup (RDS PostgreSQL)

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier nexuscomm-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --allocated-storage 20

# Run migrations
npm --prefix backend run migrate
```

### Heroku Deployment

#### Deploy Backend

1. **Install Heroku CLI**

```bash
npm install -g heroku
heroku login
```

2. **Create Heroku App**

```bash
heroku create nexuscomm-api
```

3. **Configure Environment**

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_production_secret
# Add other environment variables
```

4. **Deploy**

```bash
git push heroku main
heroku logs --tail
```

### Mobile App Deployment

#### iOS (App Store)

```bash
cd mobile
eas build --platform ios --profile production
eas submit --platform ios
```

#### Android (Google Play)

```bash
cd mobile
eas build --platform android --profile production
eas submit --platform android
```

## Continuous Integration/Deployment

GitHub Actions workflow is configured in `.github/workflows/ci-cd.yml`

### Automatic Testing & Deployment

On every push to `main`:

1. ✅ Backend tests run
2. ✅ Mobile tests run
3. ✅ Security scans execute
4. ✅ Code quality checks run
5. 🚀 Automatic deployment to staging

## Monitoring & Logging

### Backend Monitoring

```bash
# View logs
npm --prefix backend run logs

# Monitor performance
curl http://your-backend.com/api/health
```

### Error Tracking (Sentry)

```bash
# Add to backend/.env
SENTRY_DSN=your_sentry_dsn
```

### Database Monitoring

```bash
# Connect to production database
psql -h your-rds-endpoint.amazonaws.com -U admin -d nexuscomm_db

# Check connections
SELECT count(*) FROM pg_stat_activity;

# View slow queries
SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC;
```

## Scaling

### Horizontal Scaling

1. **Backend**: Use load balancer (ALB/NLB) with auto-scaling
2. **Database**: Read replicas with RDS multi-AZ
3. **Cache**: Redis cluster mode enabled

### Performance Optimization

1. **CDN**: CloudFront for static assets
2. **Caching**: Redis for session/message cache
3. **Database**: Connection pooling with PgBouncer

## Backup & Disaster Recovery

### Database Backups

```bash
# Automated RDS backups (daily)
aws rds create-db-snapshot \
  --db-instance-identifier nexuscomm-db \
  --db-snapshot-identifier nexuscomm-db-backup-$(date +%Y%m%d)

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier nexuscomm-db-restored \
  --db-snapshot-identifier nexuscomm-db-backup-20251021
```

### Data Export

```bash
# Export user data (GDPR)
npm --prefix backend run export:user-data -- --userId <user_id>
```

## Troubleshooting

### Backend Connection Issues

```bash
# Check database connection
psql -h localhost -U nexuscomm -d nexuscomm_db -c "SELECT 1"

# Check Redis connection
redis-cli ping
```

### Memory Leaks

```bash
# Enable heap snapshots
NODE_OPTIONS='--expose-gc' npm --prefix backend start

# Analyze with clinic.js
clinic doctor -- npm --prefix backend start
```

### High Latency

```bash
# Check slow API endpoints
tail -f backend/logs/slow-queries.log

# Profile with 0x
0x npm --prefix backend start
```

## Security Checklist

- [ ] Environment variables configured securely
- [ ] Database credentials rotated
- [ ] HTTPS enabled on all endpoints
- [ ] CORS properly configured
- [ ] Rate limiting enforced
- [ ] Security headers set (Helmet)
- [ ] Dependencies audited for vulnerabilities
- [ ] API key rotation implemented
- [ ] Encryption keys secured
- [ ] Access logs enabled

## Maintenance

### Weekly Tasks

```bash
# Check for security updates
npm audit

# Review error logs
tail -f backend/logs/errors.log
```

### Monthly Tasks

```bash
# Database optimization
npm --prefix backend run db:optimize

# Clean up old messages/logs
npm --prefix backend run cleanup:old-data

# Performance analysis
npm --prefix backend run analyze:performance
```

### Quarterly Tasks

```bash
# Security audit
npm audit fix

# Dependency updates
npm outdated
npm update

# Backup verification
# Test restore from backup
```

## Support

For deployment issues:

1. Check logs: `docker-compose logs`
2. Review documentation: See `README.md`
3. Check status page: [status.nexuscomm.io](https://status.nexuscomm.io)
4. Contact support: [support@nexuscomm.io](mailto:support@nexuscomm.io)

---

**Last Updated**: October 2025
**Deployment Status**: Ready for Production
