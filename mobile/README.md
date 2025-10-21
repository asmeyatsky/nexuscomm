# NexusComm Mobile - React Native

Unified Communication Hub - Mobile Application

## Features

- Single unified inbox for all communication channels
- Real-time message sync with WebSockets
- Thread consolidation across platforms
- Contextual reply system
- Multi-channel support (WhatsApp, Email, SMS, Instagram, LinkedIn)
- Account management
- Custom identity filters
- Offline message caching

## Tech Stack

- React Native with Expo
- TypeScript
- React Navigation
- Zustand for state management
- Socket.io for real-time sync
- Axios for API calls
- AsyncStorage for local persistence

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS or Android device/emulator

### Installation

```bash
npm install
```

### Development

Start development server:

```bash
npm run dev
```

Run on iOS:

```bash
npm run ios
```

Run on Android:

```bash
npm run android
```

### Environment Configuration

Create `.env` file:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## Project Structure

```
src/
├── screens/           # Screen components
├── components/        # Reusable components
├── services/          # API and WebSocket services
├── store/             # Zustand stores
├── utils/             # Utility functions
├── types/             # TypeScript types
├── navigation/        # Navigation configuration
├── hooks/             # Custom hooks
└── assets/            # Images and icons
```

## Key Components

### UnifiedInbox
Main conversation list with search and filtering

### MessageList
Displays all messages for a conversation

### ContextualReply
Reply system with channel/account selection

### Services

- **apiService**: REST API calls to backend
- **webSocketService**: Real-time message sync

### Store

- **useAuthStore**: Authentication state
- **useConversationStore**: Conversations state
- **useMessageStore**: Messages state
- **useAccountStore**: Connected accounts state
- **useFilterStore**: Identity filters state

## Building

### Development Build

```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

### Production Build

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

## Testing

```bash
npm run test
npm run test:coverage
```

## Deployment

### EAS Deployment

```bash
eas submit --platform ios
eas submit --platform android
```

## Security

- Tokens stored securely in AsyncStorage
- API requests include Authorization headers
- Token refresh on 401 errors
- Local data encryption (planned)

## Performance Optimization

- Message pagination
- Conversation caching
- Image lazy loading
- Debounced search
- Memoized components

## Troubleshooting

### Connection Issues

1. Verify backend is running on `http://localhost:3000`
2. Check network connectivity
3. Review API response in Network tab

### State Management

Use React DevTools:
```bash
npm install -D @react-native-async-storage/async-storage-devtools
```

## License

Proprietary - NexusComm
