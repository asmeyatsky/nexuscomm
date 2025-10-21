# 🚀 Getting Started with NexusComm

Complete guide to running NexusComm locally and in production.

---

## Prerequisites

### Required
- **Node.js**: 18.x or higher
- **npm**: 8.x or higher
- **Docker**: Latest version (for containerized deployment)
- **PostgreSQL**: 13.x or higher (if running standalone)

### Recommended
- **Git**: Latest version
- **VS Code**: With ESLint & Prettier extensions
- **Postman/Insomnia**: For API testing
- **Redis Desktop Manager**: For Redis inspection

---

## Quick Start (5 minutes)

### Option 1: Docker Compose (Recommended)

```bash
# Clone repository
git clone https://github.com/asmeyatsky/nexuscomm.git
cd nexuscomm

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
```

**Services available:**
- Backend: http://localhost:3000
- Web: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Option 2: Local Development

**Terminal 1 - Backend:**
```bash
cd backend
npm install
cp .env.example .env
npm run migrate
npm run dev
# Backend running on http://localhost:3000
```

**Terminal 2 - Web:**
```bash
cd web
npm install
npm run dev
# Web running on http://localhost:3001
```

**Terminal 3 - Mobile:**
```bash
cd mobile
npm install
npm run dev
# Expo QR code in terminal
```

---

## Environment Setup

### Backend Configuration (.env)

```bash
# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
CLIENT_URL=http://localhost:3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=nexuscomm
DB_PASSWORD=your_secure_password
DB_NAME=nexuscomm_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
REFRESH_TOKEN_SECRET=your_refresh_token_secret_min_32_chars
JWT_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=30d

# Encryption
ENCRYPTION_SECRET=your_encryption_secret_32_chars_minimum

# Platform Integrations
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id
WHATSAPP_BUSINESS_PHONE_ID=your_phone_id
WHATSAPP_BUSINESS_ACCOUNT_ACCESS_TOKEN=your_token

GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REDIRECT_URI=http://localhost:3000/auth/gmail/callback

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Web Configuration (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## First Time Setup

### 1. Install Dependencies

```bash
npm install
# This installs dependencies for all workspaces
```

### 2. Create Databases

```bash
# Using Docker
docker-compose up -d postgres

# Or manually
psql -U postgres
CREATE USER nexuscomm WITH PASSWORD 'your_password';
CREATE DATABASE nexuscomm_db OWNER nexuscomm;
```

### 3. Run Migrations

```bash
npm --prefix backend run migrate
```

### 4. Seed Test Data (Optional)

```bash
npm --prefix backend run seed
```

### 5. Start Development

```bash
# Start all services
npm run dev

# Or individual services:
npm --prefix backend run dev
npm --prefix web run dev
npm --prefix mobile run dev
```

---

## Testing the Application

### Backend API

```bash
# Health check
curl http://localhost:3000/api/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "displayName": "Test User",
    "password": "SecurePassword123!"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'

# Get conversations (requires token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/conversations
```

### Web Application

1. Open http://localhost:3001
2. Sign up with test account
3. Create conversations
4. Send messages in real-time

### Mobile Application

1. Scan Expo QR code from terminal
2. Open in Expo Go app
3. Same functionality as web

---

## Docker Compose Services

### Standard Stack (docker-compose.yml)

```
Backend API (Express.js)
↓
PostgreSQL (Messages, Users)
Redis (Cache, Sessions)
```

### Production Stack (docker-compose.prod.yml)

```
Backend API + Web App + Mobile
↓
PostgreSQL + Redis + Elasticsearch
↓
RabbitMQ + Kafka (Message Queues)
↓
Prometheus + Grafana + ELK Stack (Monitoring)
↓
Nginx (Reverse Proxy)
```

### Start production stack

```bash
docker-compose -f docker-compose.prod.yml up -d

# Access services:
# Frontend: http://localhost (via Nginx)
# Backend: http://localhost/api
# Elasticsearch: http://localhost:9200
# Kibana: http://localhost:5601
# Grafana: http://localhost:3002
# Prometheus: http://localhost:9090
```

---

## Development Workflow

### Creating a Feature

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# Test locally
npm run test

# Lint code
npm run lint

# Commit
git add .
git commit -m "Add: description of your feature"

# Push
git push origin feature/your-feature-name

# Create pull request on GitHub
```

### Running Tests

```bash
# All tests
npm run test

# Specific package
npm --prefix backend run test

# With coverage
npm --prefix backend run test:coverage

# Watch mode
npm --prefix backend run test -- --watch
```

### Linting

```bash
# All packages
npm run lint

# Fix issues
npm --prefix backend run lint -- --fix
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Error

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Recreate database
docker-compose down -v
docker-compose up -d postgres
npm --prefix backend run migrate
```

### Node Modules Issues

```bash
# Clear cache and reinstall
npm run clean
npm install
```

### WebSocket Connection Error

```bash
# Ensure backend is running
curl http://localhost:3000/api/health

# Check for firewalls blocking port 3000
```

### Out of Memory

```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

---

## Production Deployment

### Using Docker Compose

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Using Kubernetes

```bash
# Create namespace
kubectl create namespace nexuscomm

# Apply manifests
kubectl apply -f k8s/

# Check status
kubectl get pods -n nexuscomm
kubectl describe pod -n nexuscomm POD_NAME

# View logs
kubectl logs -n nexuscomm -l app=nexuscomm-backend

# Scale deployment
kubectl scale deployment backend --replicas=5 -n nexuscomm
```

### Cloud Deployments

**AWS:**
```bash
# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker tag nexuscomm-backend:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/nexuscomm-backend:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/nexuscomm-backend:latest
```

**Heroku:**
```bash
heroku login
heroku create nexuscomm-api
git push heroku main
```

---

## Monitoring & Debugging

### View Logs

```bash
# Backend logs
docker-compose logs -f backend

# All services
docker-compose logs -f

# Follow specific service
docker-compose logs -f elasticsearch
```

### Database Inspection

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U nexuscomm -d nexuscomm_db

# Common queries
SELECT * FROM users;
SELECT * FROM conversations;
SELECT * FROM messages LIMIT 10;
```

### Redis Inspection

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Common commands
PING
KEYS *
GET session:12345
MONITOR
```

### Elasticsearch Inspection

```bash
# Check health
curl http://localhost:9200/_cluster/health

# List indexes
curl http://localhost:9200/_cat/indices

# Search messages
curl http://localhost:9200/messages/_search?q=test
```

### Performance Monitoring

```bash
# Grafana dashboard
http://localhost:3002

# Default credentials:
# Username: admin
# Password: (from GRAFANA_PASSWORD)
```

---

## Common Tasks

### Adding a New Environment Variable

1. Update `.env.example`
2. Update `.env` with value
3. Update `backend/src/config/database.ts` or relevant config file
4. Use in code: `process.env.VARIABLE_NAME`

### Creating a Database Migration

```bash
# Create migration
npm --prefix backend run typeorm migration:create src/database/migrations/AddNewColumn

# Edit migration file
# Then run:
npm --prefix backend run migrate
```

### Resetting Database

```bash
# Drop all tables
npm --prefix backend run db:reset

# Recreate schema
npm --prefix backend run migrate

# Seed data
npm --prefix backend run seed
```

### Clearing Cache

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Clear all
FLUSHALL

# Clear specific pattern
DEL "session:*"
```

---

## Next Steps

1. ✅ Run locally: `docker-compose up -d`
2. ✅ Test API: `curl http://localhost:3000/api/health`
3. ✅ Visit web app: http://localhost:3001
4. ✅ Create test account and send messages
5. ✅ Explore monitoring dashboards
6. ✅ Read [WORLD_CLASS.md](WORLD_CLASS.md) for architecture details
7. ✅ Check [DEPLOYMENT.md](DEPLOYMENT.md) for production setup

---

## Support & Resources

- **Documentation**: See [README.md](README.md)
- **API Docs**: See [backend/README.md](backend/README.md)
- **Mobile Docs**: See [mobile/README.md](mobile/README.md)
- **Web Docs**: See [web/README.md](web/README.md)
- **GitHub**: https://github.com/asmeyatsky/nexuscomm
- **Issues**: https://github.com/asmeyatsky/nexuscomm/issues

---

**Happy coding! 🚀**
