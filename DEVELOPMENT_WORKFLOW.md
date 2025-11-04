# Development Workflow & Architecture Verification

## Git Hooks

This project includes automated verification hooks that run after each commit to ensure architectural integrity.

### Post-Commit Hook
The post-commit hook automatically runs after each commit and performs the following checks:

1. **Architecture Detection**: Checks if the commit includes architecture-related files
2. **Dependency Injection Verification**: Ensures DI configuration exists and is accessible
3. **Core Components Check**: Verifies presence of domain, application, and infrastructure components
4. **Documentation Verification**: Confirms architecture documentation exists
5. **DDD Compliance**: Validates domain-driven design principles are maintained

### Hook Location
- File: `.git/hooks/post-commit`
- Runs automatically after each commit
- Only performs detailed verification when architecture-related files are changed

## Architecture Verification Process

The automated verification ensures:
- ✅ Clean/Hexagonal architecture boundaries are maintained
- ✅ Domain entities remain independent of infrastructure concerns
- ✅ Application layer properly orchestrates use cases
- ✅ Infrastructure layer only implements domain-defined interfaces
- ✅ Dependency injection configuration is correct
- ✅ Tests follow architectural patterns

## Development Guidelines

When making changes to the codebase:
1. Always maintain the four-layer architecture (Domain → Application → Infrastructure → Presentation)
2. Keep domain models independent of infrastructure concerns
3. Use dependency injection for all cross-layer dependencies
4. Maintain immutability in domain entities where possible
5. Follow DDD principles for complex business logic

## Manual Verification

If you need to manually verify the architecture, you can run:
```bash
# Check all architectural components
git diff --name-only HEAD^ HEAD | grep -E "(domain|application|infrastructure|ARCHITECTURE)"

# Verify dependency injection
ls backend/src/infrastructure/config/DependencyInjectionConfig.ts

# Check core components exist
ls backend/src/domain/entities/Message.ts
ls backend/src/application/use_cases/CreateMessageUseCase.ts
ls backend/src/infrastructure/repositories/TypeORMMessageRepositoryAdapter.ts
```

This automated verification system helps maintain the high architectural standards of the NexusComm platform.