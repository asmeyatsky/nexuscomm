/**
 * UseCase Interface
 * 
 * Architectural Intent:
 * - Defines the contract for all use cases in the application
 * - Provides a standard way to execute business operations
 * - Enables consistent error handling and validation
 * - Supports the clean architecture boundary between layers
 * 
 * Key Design Decisions:
 * 1. Generic interface to work with any input/output types
 * 2. Asynchronous execution to support I/O operations
 * 3. Consistent interface across all use cases
 */
export interface UseCase<Input, Output> {
  execute(input: Input): Promise<Output>;
}