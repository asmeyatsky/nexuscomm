# NexusComm Architecture Documentation

## Overview

This document describes the current architecture of the NexusComm unified messaging platform. The system follows clean/hexagonal architecture principles as defined in `skill.md` and implements domain-driven design patterns.

## Architecture Layers

### 1. Domain Layer
The domain layer contains the core business logic and entities of the application.

#### Entities
- **Message**: The primary entity representing a message in the system. It's immutable and contains all business logic for message operations.
- **User**: Represents a user in the communication domain.
- **Conversation**: Represents a conversation thread with participants and metadata.

#### Value Objects
- **MessageContent**: Represents the content of a message with rich text capabilities
- **Attachment**: Represents file attachments
- **Reaction**: Represents emoji reactions to messages

#### Domain Services
- **MessageDomainService**: Orchestrates complex message operations
- **ConversationDomainService**: Handles conversation-related business logic
- **UserDomainService**: Manages user-related operations

#### Ports (Interfaces)
- **MessageRepositoryPort**: Defines the contract for message data access
- **ConversationRepositoryPort**: Defines the contract for conversation data access
- **UserRepositoryPort**: Defines the contract for user data access
- **ExternalMessageServicePort**: Defines the contract for external messaging services
- **AIAnalysisPort**: Defines the contract for AI analysis services
  - `analyzeSentiment()`: Analyze message sentiment and emotional tone
  - `categorizeMessage()`: Categorize message by type, urgency, and topic
  - `generateSuggestions()`: Generate context-aware reply suggestions
  - `semanticSearch()`: Perform semantic search across messages
  - `generateEmbedding()`: Generate vector embeddings for semantic operations
  - `isHealthy()`: Health check for AI service availability
  - `getUsageMetrics()`: Retrieve usage and cost metrics

### 2. Application Layer
The application layer contains use cases that orchestrate the execution of business logic.

#### Use Cases
- **Message Use Cases**:
  - `CreateMessageUseCase`: Creates new messages
  - `UpdateMessageUseCase`: Updates existing messages
  - `DeleteMessageUseCase`: Deletes messages
  - `AddReactionUseCase`: Adds reactions to messages
  - `GetMessageHistoryUseCase`: Retrieves message history
  - `SearchMessagesUseCase`: Searches messages
  - `GetMessageByIdUseCase`: Retrieves a specific message
  - `MarkMessagesAsReadUseCase`: Marks messages as read
  - `MarkIndividualMessageAsReadUseCase`: Marks a single message as read

- **Advanced Use Cases**:
  - `SendMessageWithMentionsUseCase`: Sends messages with user mentions
  - `SendMessageWithRichTextUseCase`: Sends messages with rich text formatting
  - `GetThreadMessagesUseCase`: Retrieves threaded message conversations
  - `GetMessageAnalyticsUseCase`: Provides message analytics
  - `BulkMarkMessagesUseCase`: Bulk marks messages

- **Search and Intelligence Use Cases**:
  - `AdvancedMessageSearchUseCase`: Provides advanced search capabilities
  - `GetMessageContextUseCase`: Gets context around a message
  - `GetConversationInsightsUseCase`: Provides conversation insights
  - `GetMessageTrendsUseCase`: Provides message trend analysis

- **AI Analysis Use Cases** (Claude-powered):
  - `AnalyzeSentimentUseCase`: Analyzes emotional tone and sentiment of messages
  - `CategorizeMessageUseCase`: Auto-categorizes messages by type, urgency, and topic
  - `GenerateReplySuggestionsUseCase`: Generates context-aware reply suggestions
  - `SemanticSearchUseCase`: Performs semantic search using AI embeddings

### 3. Infrastructure Layer
The infrastructure layer provides concrete implementations for the domain ports.

#### Repository Adapters
- **TypeORMMessageRepositoryAdapter**: Implements MessageRepositoryPort using TypeORM
- **TypeORMConversationRepositoryAdapter**: Implements ConversationRepositoryPort using TypeORM
- **TypeORMUserRepositoryAdapter**: Implements UserRepositoryPort using TypeORM

#### External Service Adapters
- **WhatsAppServiceAdapter**: Implements WhatsApp messaging service integration
- **EmailServiceAdapter**: Implements email service integration
- **SMSServiceAdapter**: Implements SMS service integration
- **MessagingAdapter**: Coordinates multiple channel adapters
- **ClaudeAIServiceAdapter**: Implements AIAnalysisPort using Anthropic Claude API
  - Sentiment analysis with confidence scoring
  - Message categorization and topic extraction
  - Reply suggestion generation
  - Semantic search capabilities
  - Health checking and usage metrics tracking

#### Configuration
- **DependencyInjectionConfig**: Centralizes dependency injection setup
  - Wires all domain services, repositories, and use cases
  - Initializes AI analysis port with Claude adapter

### 4. Presentation Layer
The presentation layer handles HTTP requests and responses.

#### Controllers
- **MessageController**: Handles message-related API endpoints
- Other controllers in the system follow similar patterns

## Key Design Decisions

### 1. Immutability
Domain entities are designed to be immutable to prevent state corruption during concurrent operations. All state changes return new instances instead of mutating existing ones.

### 2. Separation of Concerns
Each layer has a well-defined responsibility:
- Domain: Contains business logic and domain models
- Application: Orchestrates business operations
- Infrastructure: Handles external dependencies and data access
- Presentation: Handles API requests/responses

### 3. Port/Adapter Pattern
Domain ports define contracts that infrastructure adapters implement, ensuring domain independence from infrastructure concerns.

### 4. Dependency Injection
All dependencies are injected through constructors, following dependency inversion principle.

### 5. Comprehensive Testing
The system includes tests for all layers:
- Domain entity tests
- Domain service tests
- Application use case tests
- Infrastructure adapter tests
- Integration tests

## API Endpoints

### Messages
- `POST /api/messages` - Create a new message
- `GET /api/messages/:conversationId` - Get messages for a conversation
- `GET /api/messages/:messageId` - Get a specific message
- `PUT /api/messages/:messageId` - Update a message
- `DELETE /api/messages/:messageId` - Delete a message
- `POST /api/messages/:messageId/reactions` - Add a reaction
- `PUT /api/messages/:messageId/read` - Mark a message as read
- `PUT /api/conversations/:conversationId/read` - Mark all messages in conversation as read
- `GET /api/messages/search` - Search messages

## Data Models

### Message Entity
The Message entity includes:
- Basic message properties (id, content, timestamps)
- Rich content support (html, entities for mentions/hashtags)
- Attachments support
- Reactions support
- Threading support (parentId, replyCount)
- Edit history tracking
- Soft delete capability
- Read status tracking
- Channel type tracking

### Conversation Entity
The Conversation entity includes:
- Basic conversation properties (id, name, type)
- Participant management
- Unread count tracking
- Archive/mute status
- Last message tracking

### User Entity
The User entity includes:
- Basic user information (id, name, email)
- Online status tracking
- Presence information
- Status messages

## Security Considerations

1. **Input Validation**: All use cases validate input at the application boundary
2. **Authorization**: User permissions are verified before operations
3. **Data Access**: Repositories ensure users only access authorized data
4. **Immutable Models**: Prevent accidental state corruption

## Performance Considerations

1. **Caching**: Implement repository-level caching where appropriate
2. **Indexing**: Proper database indexing for common queries
3. **Pagination**: All list operations support pagination
4. **Efficient Queries**: Use TypeORM query builders for optimized database access

## Testing Strategy

The system follows a comprehensive testing approach:
1. Unit tests for domain entities
2. Integration tests for domain services
3. Use case tests with mocked dependencies
4. Repository adapter tests
5. End-to-end integration tests