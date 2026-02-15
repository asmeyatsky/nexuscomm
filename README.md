# NexusComm - Unified Messaging Platform

A modern, full-stack unified messaging platform built with clean architecture and domain-driven design. NexusComm consolidates conversations across channels (WhatsApp, Gmail, Instagram, LinkedIn) into a single interface, powered by AI intelligence and extensible via the Model Context Protocol (MCP).

## Overview

NexusComm is a **monorepo** consisting of:

| Package | Description | Tech |
|---------|-------------|------|
| **backend** | Express.js API with TypeORM + PostgreSQL | Node.js, TypeScript |
| **web** | Next.js 14 frontend | React 18, Tailwind CSS, shadcn/ui |
| **mobile** | React Native mobile app | Expo, React Navigation |
| **mcp-server** | MCP server for AI assistant integration | Node.js, Zod, Anthropic SDK |
| **shared** | Shared types and utilities | TypeScript |

## Key Features

### Core Messaging
- Send, receive, edit, and delete messages across conversations
- Real-time updates via WebSockets
- Message threading, replies, and emoji reactions
- Read receipts and delivery status tracking
- Rich text composition with mentions
- Bulk operations and message search

### Multi-Channel Integrations
- **WhatsApp** Business API
- **Gmail** OAuth + IMAP/SMTP sync
- **Instagram** Direct Messages
- **LinkedIn** Messaging
- Unified inbox with per-channel routing

### AI-Powered Intelligence (Google Gemini)
- **Sentiment Analysis** with confidence scoring (positive/neutral/negative)
- **Smart Categorization** by type, urgency, and topic with theme extraction
- **Reply Suggestions** in multiple tones (professional, casual, empathetic, humorous)
- **Semantic Search** across messages using AI embeddings
- **Automatic Analysis** on message creation (configurable)
- **Async Processing** via Bull queue + Upstash Redis for non-blocking heavy operations
- **Cost Tracking** with per-user daily/monthly limits and real-time quota enforcement

### MCP Server
The Model Context Protocol server enables AI assistants (Claude, etc.) to interact with NexusComm programmatically. Available tools:

| Tool | Description |
|------|-------------|
| `get_conversations` | List conversations with filters |
| `get_messages` | Retrieve messages with date range filtering |
| `send_message` | Send messages to conversations |
| `search_messages` | Full-text and semantic search |
| `get_reply_suggestions` | Context-aware reply generation |
| `get_conversation_insights` | AI-powered conversation analysis |
| `triage_messages` | Automatic categorization and prioritization |
| `generate_daily_digest` | AI-summarized communication digest |
| `set_reminder` | Follow-up reminders with optimal timing |
| `analyze_conversation_health` | Conversation metrics and health scoring |
| `file_system` | Secure file operations with path validation |
| `execute_command` | Sandboxed shell command execution |
| `watch_files` | Real-time file change detection |

Security: rate limiting (100 req/min), path traversal prevention, command whitelisting, audit logging.

### Business Intelligence & CRM
- Contact management with deduplication and relationship inference
- Sales pipeline tracking and opportunity scoring
- Deal forecasting and revenue analytics
- Customer interaction history

### Advanced Features
- **Group Management** with roles (admin/moderator/member) and moderation
- **Smart Scheduling** with AI-optimal send times
- **Voice Intelligence** with transcription and speaker identification
- **Rich Media Processing** with OCR and caption generation
- **Intelligent Notifications** with batching and do-not-disturb scheduling
- **Cross-Device Sync** with real-time state management
- **Offline Capabilities** with message queuing and sync-on-reconnect
- **Accessibility** with text-to-speech, high contrast, keyboard navigation

### Security
- JWT authentication with refresh tokens
- Role-based access control
- Input validation (Joi + Zod)
- Helmet.js security headers, CORS, bcrypt
- Encryption at rest and in transit
- Audit logging and compliance (GDPR-ready)

## Tech Stack

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL 16 with TypeORM
- **Cache/Queue**: Upstash Redis with Bull
- **AI**: Google Gemini API
- **Vector Search**: Weaviate / Pinecone
- **Security**: JWT, Helmet, CORS, bcrypt
- **Validation**: Joi
- **Logging**: Pino

### Frontend (Web)
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Real-time**: Socket.IO client
- **Rich Text**: React Quill
- **Animation**: Framer Motion

### Mobile
- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **State**: Zustand
- **Voice**: React Native Voice

### MCP Server
- **Protocol**: MCP 2024-11-05
- **Validation**: Zod
- **AI SDK**: Anthropic Claude SDK
- **File Watching**: Chokidar

### Infrastructure
- **Cloud**: GCP Cloud Run (europe-west2)
- **Registry**: Google Artifact Registry
- **IaC**: Terraform
- **CI/CD**: GitHub Actions
- **Containers**: Docker with multi-stage builds

## Architecture

The project follows **clean/hexagonal architecture** with **domain-driven design**:

```
Domain Layer        → Entities, value objects, domain services, ports
Application Layer   → Use cases orchestrating business operations
Infrastructure Layer → Repository adapters, external service integrations
Presentation Layer  → HTTP controllers, WebSocket handlers
```

Key patterns: Port/Adapter, Repository, Use Case, Dependency Injection, Immutable Models.

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed documentation.

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm

### Installation

```bash
# Clone repository
git clone https://github.com/asmeyatsky/nexuscomm.git
cd nexuscomm

# Install all workspace dependencies
npm install --legacy-peer-deps

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL, API keys, etc.

# Initialize database
npm --prefix backend run migrate
```

### Development

```bash
# Start all services
npm run dev

# Or individually:
npm --prefix backend run dev    # Backend API on :3001
npm --prefix web run dev        # Web app on :3000
npm --prefix mobile run dev     # Expo mobile app
npm --prefix mcp-server run dev # MCP server
```

### Production Build

```bash
npm run build
npm --prefix backend start
```

## Docker Deployment

```bash
# Local development with Docker Compose
docker-compose up -d

# Production deployment to GCP Cloud Run
./scripts/deploy.sh
```

The CI/CD pipeline automatically builds, tests, and deploys on push to `master`:
1. Backend + frontend tests and linting
2. Security scanning (Trivy)
3. Docker images pushed to GCP Artifact Registry
4. Deployed to Cloud Run (europe-west2)

## Project Structure

```
nexuscomm/
├── backend/
│   └── src/
│       ├── domain/           # Entities, value objects, ports
│       ├── application/      # Use cases and DTOs
│       ├── infrastructure/   # Adapters, repositories
│       ├── controllers/      # HTTP request handlers (27 controllers)
│       ├── services/         # Business services (25+ services)
│       ├── integrations/     # WhatsApp, Gmail, Instagram, LinkedIn
│       ├── models/           # TypeORM entities (18 models)
│       ├── queue/            # Bull job processors
│       ├── middleware/       # Auth, rate limiting, validation
│       ├── routes/           # API route definitions
│       └── utils/            # Helpers (JWT, WebSocket, etc.)
├── web/
│   └── src/
│       ├── app/              # Next.js pages (chat, auth)
│       ├── components/       # React components + MCP UI
│       └── lib/              # Client utilities, stores
├── mobile/
│   └── src/
│       ├── screens/          # Chat, Home, Login, Settings
│       └── services/         # API, WebSocket, voice, AI
├── mcp-server/
│   └── src/
│       ├── tools/            # MCP tool implementations
│       └── services/         # NexusComm + local system services
├── shared/                   # Shared TypeScript types
├── terraform/                # GCP infrastructure as code
├── k8s/                      # Kubernetes manifests
├── scripts/                  # Deployment scripts
└── .github/workflows/        # CI/CD pipeline
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login

### Messages
- `POST /api/messages` - Create message
- `GET /api/messages/:conversationId` - Get conversation messages
- `PUT /api/messages/:messageId` - Update message
- `DELETE /api/messages/:messageId` - Delete message
- `POST /api/messages/:messageId/reactions` - Add reaction
- `PUT /api/messages/:messageId/read` - Mark as read
- `GET /api/messages/search` - Search messages

### Conversations
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/:id` - Get details
- `PUT /api/conversations/:id` - Update
- `PUT /api/conversations/:conversationId/read` - Mark all as read

### AI Analysis (Sync)
- `POST /api/ai/analyze-sentiment` - Sentiment analysis
- `POST /api/ai/categorize-message` - Auto-categorization
- `POST /api/ai/reply-suggestions` - Smart replies
- `POST /api/ai/search` - Semantic search
- `GET /api/ai/health` - Service health
- `GET /api/ai/usage` - Usage metrics and cost tracking

### AI Analysis (Async)
- `POST /api/ai/analyze-sentiment/async` - Queue sentiment job
- `POST /api/ai/categorize-message/async` - Queue categorization job
- `POST /api/ai/reply-suggestions/async` - Queue reply generation job
- `GET /api/ai/jobs/:jobId` - Check job status
- `GET /api/queue/stats` - Queue statistics

See [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for the full reference.

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/nexuscomm
REDIS_URL=redis://localhost:6379      # or Upstash URL for production
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key
WEAVIATE_URL=your_weaviate_url        # optional
WEAVIATE_API_KEY=your_weaviate_key    # optional
```

### Web (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

## Testing

```bash
# Run all tests
npm run test

# Individual packages
npm --prefix backend run test
npm --prefix web run test

# With coverage
npm --prefix backend run test:coverage
```

## Documentation

- [Architecture](ARCHITECTURE.md) - System design and layers
- [API Reference](docs/API_DOCUMENTATION.md) - Complete endpoint documentation
- [MCP Integration](MCP_IMPLEMENTATION_SUMMARY.md) - MCP server details
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Production deployment
- [Contributing](CONTRIBUTING.md) - Contribution guidelines
- [Security](SECURITY.md) - Security policies
- [Development Workflow](DEVELOPMENT_WORKFLOW.md) - Dev standards

## License

Proprietary - see [LICENSE](LICENSE) for details.
