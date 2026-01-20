# NexusComm Testing Guide

Comprehensive testing guide for running tests, writing new tests, and maintaining code quality.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Backend Testing](#backend-testing)
3. [Frontend Testing](#frontend-testing)
4. [Integration Testing](#integration-testing)
5. [Test Structure](#test-structure)
6. [Writing Tests](#writing-tests)
7. [Coverage Requirements](#coverage-requirements)
8. [CI/CD Testing](#cicd-testing)

## Quick Start

### Run All Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd ../web
npm test

# Both (from root)
npm test
```

### Run Tests with Coverage

```bash
# Backend coverage
cd backend
npm run test:coverage

# Frontend coverage
cd ../web
npm run test:coverage
```

### Watch Mode (Auto-rerun on changes)

```bash
# Backend
cd backend
npm test -- --watch

# Frontend
cd ../web
npm test -- --watch
```

## Backend Testing

### Test Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test AnalyzeSentimentUseCase.test.ts

# Run tests matching pattern
npm test -- --grep "AI Features"

# Run with specific reporter
npm test -- --reporter=verbose
```

### Backend Test Files

Located in `backend/src/__tests__/`:

```
__tests__/
├── AnalyzeSentimentUseCase.test.ts      # Sentiment analysis tests
├── MessageAnalysis.test.ts               # MessageAnalysis value object
├── MessageSuggestion.test.ts             # MessageSuggestion value object
├── Integration.test.ts                   # Integration tests
└── (more test files)
```

### Backend Test Coverage

Current test coverage areas:

- **Domain Layer**
  - Value Objects: MessageAnalysis, MessageSuggestion, ConversationSummary, SmartScheduleRecommendation, ConversationInsight
  - Domain Services: MessageDomainService, ConversationDomainService, UserDomainService
  - Entities validation and business logic

- **Application Layer**
  - Use Cases: AnalyzeSentimentUseCase, CategorizeMessageUseCase, GenerateReplySuggestionsUseCase, SemanticSearchUseCase
  - Advanced Use Cases: SummarizeConversationUseCase, GetSmartScheduleRecommendationUseCase, GetConversationInsightsUseCase
  - Input validation and error handling

- **Infrastructure Layer**
  - Repository Adapters: TypeORMMessageRepositoryAdapter, UserAIQuotaRepository, AIAnalysisResultsRepository
  - Service Adapters: ClaudeAIServiceAdapter, PineconeVectorStoreAdapter, ClaudeAdvancedAIAdapter
  - Database interactions

## Frontend Testing

### Test Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test SentimentBadge

# Run with specific reporter
npm test -- --reporters=verbose
```

### Frontend Test Files

Located in `web/`:

```
web/
├── __tests__/
│   ├── components/
│   │   ├── SentimentBadge.test.tsx
│   │   ├── CategoryTags.test.tsx
│   │   ├── ReplySuggestions.test.tsx
│   │   ├── AIUsageMetrics.test.tsx
│   │   ├── MessageWithAI.test.tsx
│   │   └── AIPanel.test.tsx
│   └── hooks/
│       └── useAIAnalysis.test.ts
```

### Frontend Test Coverage

Areas to test:

- **AI Components**
  - SentimentBadge: Rendering, color mapping, confidence display
  - CategoryTags: Tag rendering, relevance display
  - ReplySuggestions: List display, click handling
  - AIUsageMetrics: Progress bars, warning states
  - MessageWithAI: Loading states, error boundaries
  - AIPanel: Tab switching, data loading

- **Hooks**
  - useAIAnalysis: API calls, error handling, caching

- **Integration**
  - Component composition
  - State management (Zustand)
  - API integration (axios)

## Integration Testing

### Running Integration Tests

```bash
# From project root
npm run test:integration

# Or from backend
cd backend
npm test -- --grep "Integration"
```

### Integration Test Areas

1. **Message Creation with AI**
   - Create message → Trigger AI analysis → Verify results stored
   - Test AI quota enforcement
   - Test async processing queue

2. **Conversation Analytics**
   - Multiple messages → Sentiment analysis → Insights generation
   - Verify database persistence
   - Test analytics accuracy

3. **Semantic Search**
   - Index message embeddings → Search query → Return results
   - Test with Pinecone mock
   - Verify ranking accuracy

4. **User Quotas**
   - Track usage across operations
   - Enforce daily/monthly limits
   - Test quota reset behavior

## Test Structure

### Backend Test Example

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnalyzeSentimentUseCase } from '../application/use_cases/AnalyzeSentimentUseCase';

describe('AnalyzeSentimentUseCase', () => {
  let useCase: AnalyzeSentimentUseCase;
  let mockAIPort: any;

  beforeEach(() => {
    // Setup mocks
    mockAIPort = {
      analyzeSentiment: vi.fn(),
      isHealthy: vi.fn().mockResolvedValue(true),
    };
    useCase = new AnalyzeSentimentUseCase(mockAIPort);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should analyze sentiment correctly', async () => {
    mockAIPort.analyzeSentiment.mockResolvedValue({
      sentiment: { positive: 0.8, neutral: 0.1, negative: 0.1, overall: 'positive' },
      confidence: 0.95,
    });

    const result = await useCase.execute({
      messageId: 'msg-123',
      content: 'This is great!',
      userId: 'user-123',
    });

    expect(result.sentiment).toBe('positive');
    expect(mockAIPort.analyzeSentiment).toHaveBeenCalled();
  });

  it('should throw error when service unhealthy', async () => {
    mockAIPort.isHealthy.mockResolvedValue(false);

    expect(async () => {
      await useCase.execute({
        messageId: 'msg-123',
        content: 'Test',
        userId: 'user-123',
      });
    }).rejects.toThrow();
  });

  it('should validate input', async () => {
    expect(async () => {
      await useCase.execute({
        messageId: '',
        content: 'Test',
        userId: 'user-123',
      });
    }).rejects.toThrow('messageId is required');
  });
});
```

### Frontend Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SentimentBadge } from '@/components/ai/SentimentBadge';

describe('SentimentBadge', () => {
  it('should render positive sentiment', () => {
    render(
      <SentimentBadge
        sentiment="positive"
        confidence={0.95}
        size="md"
        showConfidence={true}
      />
    );

    expect(screen.getByText('😊')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('should render neutral sentiment', () => {
    render(
      <SentimentBadge
        sentiment="neutral"
        confidence={0.5}
        size="md"
        showConfidence={true}
      />
    );

    expect(screen.getByText('😐')).toBeInTheDocument();
  });

  it('should apply correct size classes', () => {
    render(
      <SentimentBadge
        sentiment="positive"
        confidence={0.8}
        size="lg"
      />
    );

    const badge = screen.getByRole('img', { hidden: true }).parentElement;
    expect(badge).toHaveClass('text-lg');
  });

  it('should hide confidence when showConfidence is false', () => {
    render(
      <SentimentBadge
        sentiment="positive"
        confidence={0.95}
        showConfidence={false}
      />
    );

    expect(screen.queryByText('95%')).not.toBeInTheDocument();
  });
});
```

## Writing Tests

### Best Practices

1. **Test Behavior, Not Implementation**
   - Test what the code does, not how it does it
   - Mock external dependencies
   - Use descriptive test names

2. **Arrange-Act-Assert (AAA)**
   ```typescript
   it('should do something', () => {
     // Arrange: Set up test data
     const input = { data: 'test' };

     // Act: Execute the code
     const result = myFunction(input);

     // Assert: Verify the result
     expect(result).toBe('expected');
   });
   ```

3. **Error Cases**
   - Always test error conditions
   - Test validation failures
   - Test edge cases

4. **Mocking External Services**
   ```typescript
   const mockAIService = {
     analyzeSentiment: vi.fn().mockResolvedValue({...}),
     categorizeMessage: vi.fn().mockRejectedValue(new Error('Failed')),
   };
   ```

### Adding New Tests

1. Create test file next to implementation:
   ```
   src/
   ├── services/
   │   ├── MyService.ts
   │   └── __tests__/
   │       └── MyService.test.ts
   ```

2. Follow naming convention: `[Module].test.ts` or `[Module].spec.ts`

3. Organize tests with `describe` blocks:
   ```typescript
   describe('MyService', () => {
     describe('method1', () => {
       it('should do X', () => {...});
       it('should do Y', () => {...});
     });

     describe('method2', () => {
       it('should do Z', () => {...});
     });
   });
   ```

## Coverage Requirements

### Target Coverage

- **Backend**: Minimum 80% for AI features
- **Frontend**: Minimum 70% for components
- **Critical paths**: 100% coverage required

### Checking Coverage

```bash
# Backend
cd backend
npm run test:coverage

# Frontend
cd ../web
npm run test:coverage

# View HTML report
open coverage/index.html
```

### Coverage Reports

Generated in `coverage/` directory:

- **index.html**: Interactive coverage report
- **lcov.info**: LCOV format for tools
- **coverage.json**: Raw coverage data

### Improving Coverage

1. Identify untested code:
   ```bash
   npm run test:coverage -- --reporter=text-summary
   ```

2. Add tests for uncovered lines
3. Test error paths
4. Test edge cases

## CI/CD Testing

### GitHub Actions Pipeline

The CI/CD pipeline automatically runs tests:

1. **Lint Check** - Code quality
2. **Build** - Compilation
3. **Unit Tests** - Individual component tests
4. **Integration Tests** - Component interaction
5. **Coverage Report** - Sent to Codecov

### Viewing Test Results

```bash
# In GitHub Actions
1. Go to Actions tab
2. Click on workflow run
3. View test results in job logs
4. Coverage uploaded to Codecov

# Coverage badge
![Coverage](https://codecov.io/gh/asmeyatsky/nexuscomm/branch/master/graph/badge.svg)
```

### Blocking on Test Failures

- Pull requests require passing tests
- Failed tests block merge
- Coverage cannot decrease

## Test Commands Reference

### Backend

| Command | Purpose |
|---------|---------|
| `npm test` | Run all tests |
| `npm test -- --watch` | Watch mode |
| `npm run test:coverage` | Coverage report |
| `npm test [file]` | Run specific file |
| `npm test -- --grep "[pattern]"` | Run matching tests |
| `npm test -- --reporter=verbose` | Verbose output |

### Frontend

| Command | Purpose |
|---------|---------|
| `npm test` | Run all tests |
| `npm test -- --watch` | Watch mode |
| `npm run test:coverage` | Coverage report |
| `npm test [component]` | Run component tests |
| `npm test -- --reporters=verbose` | Verbose output |

## Debugging Tests

### Backend

```bash
# Run single test with debugging
node --inspect-brk ./node_modules/.bin/vitest AnalyzeSentimentUseCase.test.ts

# Use VS Code debugger with launch config
# Add to .vscode/launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "program": "${workspaceFolder}/node_modules/.bin/vitest",
  "args": ["--inspect-brk"],
  "console": "integratedTerminal",
  "cwd": "${workspaceFolder}/backend"
}
```

### Frontend

```bash
# Run with debugging
npm test -- --debug

# Use VS Code debugger
# Open DevTools: Inspector will be available
```

## Common Issues

### Tests timeout

```bash
# Increase timeout
npm test -- --reporter=verbose --testTimeout=10000
```

### Mock not working

```typescript
// Clear mocks between tests
afterEach(() => {
  vi.clearAllMocks();  // Vitest
  // or
  jest.clearAllMocks(); // Jest
});
```

### Import errors

```bash
# Ensure paths are correct
# Use aliases from tsconfig/jest config
import { MyClass } from '@domain/entities/MyClass';
```

## Performance Testing

### Load Testing AI Features

```bash
# Test concurrent requests
npm run test:performance

# Monitor memory/CPU
npm test -- --reporter=verbose --detectOpenHandles
```

### Database Query Performance

```sql
-- Check slow queries
EXPLAIN ANALYZE SELECT * FROM messages WHERE user_id = 'test';

-- Create indexes for tests
CREATE INDEX idx_messages_user_id ON messages(user_id);
```

## Continuous Improvement

### Test Maintenance

- Review failing tests regularly
- Update tests when requirements change
- Remove outdated tests
- Refactor duplicate test code

### Coverage Goals

- **Week 1-2**: Core functionality (80%)
- **Week 3-4**: Edge cases (85%)
- **Ongoing**: Critical paths (95%+)

---

For more information, see:
- [README.md](./README.md) - Project overview
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [Vitest Documentation](https://vitest.dev/)
- [Jest Documentation](https://jestjs.io/)
