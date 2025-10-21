# NexusComm - Unified Communication Hub

A secure, single-pane-of-glass application that consolidates all personal, professional, and social digital communications into one unified inbox.

## Vision

Eliminate app-switching fatigue by consolidating messages from WhatsApp, Email, SMS, Instagram, and LinkedIn into one intelligent, organized stream.

## Project Structure

```
nexuscomm/
├── backend/              # Node.js/Express gateway service
├── mobile/               # React Native mobile app
├── shared/               # Shared types and utilities
├── docs/                 # Documentation
├── config/               # Configuration files
├── claude.md             # Claude AI guidelines
└── README.md             # This file
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT
- **Encryption**: AES-256-CBC
- **Real-time**: WebSockets (Socket.io)
- **Queue**: Bull (Redis)

### Mobile
- **Framework**: React Native + Expo
- **Language**: TypeScript
- **State**: Zustand
- **Navigation**: React Navigation
- **API Client**: Axios
- **Real-time**: Socket.io client
- **Storage**: AsyncStorage

## Key Features (Phase 1 MVP)

### ✅ Unified Inbox (UC-101)
Single chronologically sorted feed of all messages

### ✅ Thread Consolidation (UC-102)
Messages from same contact across channels grouped together

### ✅ Contextual Reply (UC-103)
Reply directly within thread using correct channel

### ✅ Multi-Account Send (UC-104)
Select outbound identity/number when sending messages

### ✅ Custom Identity Filters (UC-105)
Filter inbox by business/personal profiles

### ✅ Real-time Sync (UC-106)
Immediate message fetching with customizable notifications

## Platform Integrations

| Platform | Status | Features |
|----------|--------|----------|
| WhatsApp | ✅ Ready | 3x accounts, real-time messaging |
| Email | ✅ Ready | Gmail, Outlook, OAuth support |
| SMS/MMS | ✅ Ready | Via carrier API |
| Instagram DM | ✅ Ready | Direct messages only |
| LinkedIn DM | ✅ Ready | InMail & Direct Messaging |
| Telegram | 🔜 Planned | Phase 2 |
| Slack | 🔜 Planned | Phase 3 |

## Quick Start

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Update .env with your credentials
npm run migrate
npm run dev
```

Backend runs on `http://localhost:3000`

### Mobile Setup

```bash
cd mobile
npm install
npm run dev
```

Scan QR code with Expo Go or run on simulator

## Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────────┐
│     React Native Mobile App (Expo)      │
│  - Unified Inbox UI                     │
│  - Thread Consolidation View            │
│  - Contextual Reply Interface           │
│  - Account & Filter Management          │
└─────────────────────────────────────────┘
                    ↕
         WebSockets / REST API
                    ↕
┌─────────────────────────────────────────┐
│   NexusComm Gateway (Express.js)        │
│  - Message aggregation                  │
│  - Thread consolidation logic           │
│  - Account isolation & security         │
│  - Rate limiting & caching              │
│  - API integrations                     │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│  PostgreSQL Database + Redis Cache      │
│  ├── Users & Accounts                   │
│  ├── Messages & Conversations           │
│  ├── Identity Filters                   │
│  └── Session Management                 │
└─────────────────────────────────────────┘
```

## Security & Privacy

### Data Protection
- ✅ AES-256-CBC encryption for stored credentials
- ✅ JWT-based stateless authentication
- ✅ HTTPS/TLS for all connections
- ✅ GDPR-compliant data deletion

### Account Isolation
- ✅ Per-user credential isolation
- ✅ Row-level security in database
- ✅ No cross-user data leakage
- ✅ Audit logging for sensitive operations

### API Security
- ✅ Rate limiting (configurable)
- ✅ Input validation with Joi
- ✅ CORS configuration
- ✅ Helmet headers
- ✅ Official APIs only (no web scraping)

## API Endpoints

See [Backend README](backend/README.md) for complete API documentation

## Success Metrics (Phase 1)

| Metric | Target |
|--------|--------|
| DAU/MAU Ratio | > 50% |
| App-Switching Reduction | 75% decrease |
| Channel Coverage | > 90% |
| Reply Latency | < 2 seconds |
| API Error Rate | < 0.5% |

## Development

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm or yarn
- Xcode (for iOS development)
- Android Studio (for Android development)

### Setup Scripts

```bash
# Install dependencies for all packages
npm install

# Run backend in development
npm --prefix backend run dev

# Run mobile in development
npm --prefix mobile run dev

# Run tests
npm run test

# Run linting
npm run lint

# Build for production
npm run build
```

### Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test
3. Commit with clear messages: `git commit -m "Add: description"`
4. Push to remote: `git push origin feature/your-feature`
5. Create pull request

### Code Quality

- **Linting**: ESLint with TypeScript support
- **Type Safety**: Strict TypeScript
- **Testing**: Jest with 80% coverage target
- **Formatting**: Prettier
- **Pre-commit**: Husky hooks

## Deployment

### Docker Support

```bash
# Build backend image
docker build -t nexuscomm-backend ./backend

# Run container
docker run -p 3000:3000 --env-file .env nexuscomm-backend
```

### Cloud Deployment

- **Backend**: Heroku, AWS ECS, Google Cloud Run
- **Database**: AWS RDS PostgreSQL
- **Mobile**: App Store, Google Play (via EAS)

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U nexuscomm -d nexuscomm_db

# Reset database
npm --prefix backend run db:reset
```

### WebSocket Connection Issues
1. Verify backend is running
2. Check firewall/proxy settings
3. Review browser console for errors

### Token Expiry
- Access token: 7 days
- Refresh token: 30 days
- Both auto-refresh on 401

## Contributing

1. Read [claude.md](claude.md) for AI development guidelines
2. Follow code style guide
3. Write tests for new features
4. Update documentation
5. Submit PR with clear description

## Documentation

- [Backend API](backend/README.md)
- [Mobile App](mobile/README.md)
- [Architecture Decision Records](docs/adr/)
- [API Integrations](docs/integrations/)

## Roadmap

### Phase 1 (Current - MVP)
- ✅ Unified inbox
- ✅ Thread consolidation
- ✅ Core integrations (WhatsApp, Email, Instagram, LinkedIn)
- ✅ Authentication & security
- 🔄 Testing & QA

### Phase 2
- Instagram & LinkedIn advanced features
- Advanced filtering & search
- Message scheduling
- Read receipts
- Typing indicators

### Phase 3
- Telegram, Slack integration
- Automation & pre-set replies
- Analytics dashboard
- Team collaboration
- Custom webhooks

## Support

For issues and questions:
1. Check existing GitHub issues
2. Review documentation
3. Create new issue with details
4. Contact team leads

## License

Proprietary - NexusComm Inc.

## Team

- **Product**: Gemini AI
- **Engineering**: Development Team
- **QA**: Quality Assurance Team

---

**Last Updated**: October 2025
**Status**: Active Development
**Phase**: MVP (Phase 1)
