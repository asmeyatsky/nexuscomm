# NexusComm - Unified Messaging Platform

A modern, full-stack messaging application built with clean architecture principles and domain-driven design. NexusComm provides a unified interface for managing conversations with support for multiple messaging channels and real-time communication.

## Overview

NexusComm is a **monorepo** project consisting of:
- **Backend**: Express.js API gateway with TypeORM and PostgreSQL
- **Web**: Next.js 14 frontend application
- **Mobile**: React Native mobile app with Expo
- **Shared**: Shared types and utilities across packages

## Key Features

### Core Messaging
- Send and receive messages in conversations
- Real-time message updates via WebSockets
- Message threading and replies
- Emoji reactions to messages
- Read receipts and message status tracking

### Channel Management
- Unified inbox for all conversations
- Multi-channel integrations (Gmail, WhatsApp, Instagram, LinkedIn)
- Conversation archiving and muting
- Participant management

### Advanced Features
- Full-text message search with advanced filtering
- Message history and pagination
- Rich text support with mentions
- Bulk message operations
- Message analytics and insights
- Real-time presence and status

### AI-Powered Intelligence (powered by Claude)
- **Sentiment Analysis**: Analyze emotional tone of messages with confidence scoring
- **Smart Categorization**: Auto-categorize messages by type, urgency, and topic
- **Reply Suggestions**: AI-generated reply suggestions based on conversation context
- **Semantic Search**: Find semantically similar messages beyond keyword matching

### Security & Quality
- JWT-based authentication
- Rate limiting and request validation
- Comprehensive error handling
- Input validation with Joi
- TypeScript throughout the stack
- Clean/hexagonal architecture with clear separation of concerns

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Real-time**: WebSockets with ws
- **Caching/Jobs**: Redis with Bull
- **AI Services**: Anthropic Claude API for sentiment analysis, categorization, suggestions
- **Security**: JWT, Helmet, CORS, bcrypt
- **Validation**: Joi
- **Logging**: Pino

### Frontend (Web)
- **Framework**: Next.js 14
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Real-time**: Socket.IO client
- **HTTP Client**: Axios
- **Rich Text**: Quill editor

### Mobile
- **Framework**: React Native with Expo
- **State Management**: Zustand
- **Real-time**: Socket.IO client
- **HTTP Client**: Axios

## Architecture

The project follows **clean/hexagonal architecture** with **domain-driven design (DDD)** principles:

### Layers
1. **Domain Layer**: Core business logic, entities, and domain services
2. **Application Layer**: Use cases that orchestrate business operations
3. **Infrastructure Layer**: Repository adapters, external service integrations
4. **Presentation Layer**: HTTP controllers and request handlers

### Key Design Patterns
- **Port/Adapter Pattern**: Domain ports for infrastructure dependencies
- **Dependency Injection**: Constructor-based DI for loose coupling
- **Immutable Models**: Domain entities designed for immutability
- **Repository Pattern**: Data access abstraction
- **Use Case Pattern**: Business operation orchestration

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed documentation.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/nexuscomm.git
cd nexuscomm

# Install dependencies for all workspaces
npm install

# Configure environment variables
cp backend/.env.example backend/.env
cp web/.env.example web/.env

# Initialize database
npm --prefix backend run migrate
```

### Development

```bash
# Start all services in development mode
npm run dev

# Or start individual services:
npm --prefix backend run dev
npm --prefix web run dev
npm --prefix mobile run dev
```

Services will be available at:
- Backend API: `http://localhost:3000`
- Web App: `http://localhost:3001`
- Mobile: Expo CLI will provide connection info

### Production Build

```bash
# Build all packages
npm run build

# Start backend server
npm --prefix backend start
```

## Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

## Testing

```bash
# Run all tests
npm run test

# Run specific test suites
npm --prefix backend run test
npm --prefix web run test
```

## Project Structure

```
nexuscomm/
├── backend/
│   └── src/
│       ├── domain/           # Domain layer (entities, services, ports)
│       ├── application/      # Application layer (use cases)
│       ├── infrastructure/   # Infrastructure layer (adapters, repositories)
│       ├── controllers/      # HTTP request handlers
│       ├── middleware/       # Express middleware
│       ├── routes/           # API routes
│       ├── integrations/     # External service integrations
│       ├── models/           # TypeORM entities
│       └── utils/            # Utility functions
├── web/
│   └── src/
│       ├── app/              # Next.js app directory
│       ├── components/       # React components
│       ├── lib/              # Client-side utilities
│       └── styles/           # Global styles
├── mobile/
│   └── src/                  # React Native source
├── shared/                   # Shared types and utilities
└── docs/                     # Documentation
```

## API Endpoints

### Messages
- `POST /api/messages` - Create a new message
- `GET /api/messages/:conversationId` - Get messages in conversation
- `PUT /api/messages/:messageId` - Update a message
- `DELETE /api/messages/:messageId` - Delete a message
- `POST /api/messages/:messageId/reactions` - Add emoji reaction
- `PUT /api/messages/:messageId/read` - Mark message as read
- `GET /api/messages/search` - Search messages

### Conversations
- `GET /api/conversations` - List user conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/:id` - Get conversation details
- `PUT /api/conversations/:id` - Update conversation
- `PUT /api/conversations/:conversationId/read` - Mark all as read

### Users
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile

### AI Analysis (Claude-powered)
- `POST /api/ai/analyze-sentiment` - Analyze message sentiment with emotional tone and confidence
- `POST /api/ai/categorize-message` - Auto-categorize message by type, urgency, and topic
- `POST /api/ai/reply-suggestions` - Generate smart reply suggestions based on context
- `POST /api/ai/search` - Perform semantic search across messages
- `GET /api/ai/health` - Check AI service availability
- `GET /api/ai/usage` - Get AI service usage metrics and cost tracking

For complete API documentation, see [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md).

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes following project patterns
3. Write tests for new functionality
4. Run linting: `npm run lint`
5. Commit your changes
6. Push to your fork and open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Development Guidelines

This project enforces:
- **Code Quality**: TypeScript strict mode, ESLint, no linting errors
- **Architecture**: Clean separation of concerns, hexagonal/clean architecture
- **Testing**: Tests for critical paths and business logic
- **Type Safety**: Proper typing throughout, no implicit `any`
- **Documentation**: Complex functions have JSDoc comments

See [CLAUDE.md](CLAUDE.md) for AI assistant guidelines.

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/nexuscomm
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3001
ANTHROPIC_API_KEY=your_anthropic_api_key
```

**Note**: Get your ANTHROPIC_API_KEY from the [Anthropic Console](https://console.anthropic.com)

### Web (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

## Security

- Sensitive data is never committed to the repository
- All API endpoints validate and sanitize input
- Rate limiting prevents abuse
- JWT tokens secure protected endpoints
- CORS restricts cross-origin requests

For security policy, see [SECURITY.md](SECURITY.md).

## Deployment

The project is containerized and ready for deployment:

```bash
# Using Docker
docker build -t nexuscomm-backend backend/
docker run -p 3000:3000 nexuscomm-backend

# Using Kubernetes (manifests in k8s/)
kubectl apply -f k8s/
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Roadmap

### Current (v0.1)
- ✅ Core messaging functionality
- ✅ Multi-channel integrations
- ✅ Real-time updates
- ✅ Message search and filtering
- ✅ Conversation management
- ✅ Claude AI-powered intelligence
  - ✅ Sentiment analysis with confidence scoring
  - ✅ Smart message categorization
  - ✅ AI reply suggestions
  - ✅ Semantic search capabilities

### Planned (v0.2)
- Vector database integration for semantic search
- Message scheduling and smart timing
- Advanced conversation analytics
- Additional channel integrations
- Enhanced UI/UX improvements
- Performance optimizations
- Webhook support for external integrations

## Support & Documentation

- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Getting Started**: [GETTING_STARTED.md](GETTING_STARTED.md)
- **API Reference**: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Development**: [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)

## License

Proprietary License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ by the NexusComm Team**
