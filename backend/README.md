# NexusComm Gateway - Backend Service

Secure cloud-based backend service for unified communications management.

## Features

- Multi-platform message integration (WhatsApp, Email, Instagram, LinkedIn, SMS)
- Real-time message sync with WebSockets
- AES-256 encrypted credential storage
- Rate limiting and exponential backoff
- Thread consolidation across channels
- Custom identity/filter management
- Account isolation and data security

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Redis (optional, for advanced caching)

### Installation

```bash
npm install
```

### Environment Configuration

Copy `.env.example` to `.env` and update with your credentials:

```bash
cp .env.example .env
```

### Database

Initialize database:

```bash
npm run migrate
```

Reset database:

```bash
npm run db:reset
```

### Running

Development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/verify-email` - Verify email

### Accounts
- `POST /api/accounts` - Add account
- `GET /api/accounts` - List user accounts
- `GET /api/accounts/:accountId` - Get account details
- `POST /api/accounts/:accountId/disconnect` - Disconnect account

### Conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations` - List conversations
- `GET /api/conversations/:conversationId` - Get conversation
- `POST /api/conversations/:conversationId/mark-read` - Mark as read
- `POST /api/conversations/:conversationId/toggle-archive` - Archive/unarchive
- `POST /api/conversations/:conversationId/toggle-pin` - Pin/unpin

### Messages
- `POST /api/messages` - Send message
- `GET /api/conversations/:conversationId/messages` - Get messages
- `POST /api/messages/:messageId/mark-read` - Mark message as read
- `DELETE /api/messages/:messageId` - Delete message

### Filters
- `POST /api/filters` - Create filter
- `GET /api/filters` - List filters
- `PUT /api/filters/:filterId` - Update filter
- `DELETE /api/filters/:filterId` - Delete filter

## WebSocket Events

### Client to Server
- `message:received` - Notify new message
- `conversation:updated` - Update conversation
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `presence:update` - Update presence status
- `conversation:subscribe` - Subscribe to conversation
- `conversation:unsubscribe` - Unsubscribe from conversation

### Server to Client
- `message:new` - New message arrived
- `conversation:changed` - Conversation updated
- `typing:active` - User is typing
- `typing:inactive` - User stopped typing
- `presence:changed` - User presence changed

## Architecture

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/          # Database models (TypeORM)
├── services/        # Business logic
├── integrations/    # Platform integrations
├── utils/           # Utility functions
├── routes/          # API routes
└── types/           # TypeScript types
```

## Security

- AES-256-CBC encryption for credentials
- JWT token-based authentication
- Rate limiting (configurable)
- Input validation with Joi
- CORS configuration
- Helmet for HTTP headers
- Account isolation per user

## Testing

```bash
npm run test
npm run test:coverage
```

## Deployment

### Docker

```bash
docker build -t nexuscomm-backend .
docker run -p 3000:3000 --env-file .env nexuscomm-backend
```

### Environment Variables

See `.env.example` for all required variables.

## License

Proprietary - NexusComm
