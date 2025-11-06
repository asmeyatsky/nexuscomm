import { AppDataSource } from '../config/database';
import { MessageDomainService } from '../domain/services/MessageDomainService';
import { ConversationDomainService } from '../domain/services/ConversationDomainService';
import { UserDomainService } from '../domain/services/UserDomainService';
import { TypeORMMessageRepositoryAdapter } from '../infrastructure/repositories/TypeORMMessageRepositoryAdapter';
import { TypeORMConversationRepositoryAdapter } from '../infrastructure/repositories/TypeORMConversationRepositoryAdapter';
import { TypeORMUserRepositoryAdapter } from '../infrastructure/repositories/TypeORMUserRepositoryAdapter';
import { CreateMessageUseCase } from './use_cases/CreateMessageUseCase';
import { UpdateMessageUseCase } from './use_cases/UpdateMessageUseCase';
import { DeleteMessageUseCase } from './use_cases/DeleteMessageUseCase';
import { AddReactionUseCase } from './use_cases/AddReactionUseCase';
import { GetMessageHistoryUseCase, SearchMessagesUseCase, GetMessageByIdUseCase } from './use_cases/GetMessageUseCases';
import { MarkMessagesAsReadUseCase } from './use_cases/MarkMessagesAsReadUseCase';
import { MarkIndividualMessageAsReadUseCase } from './use_cases/MarkIndividualMessageAsReadUseCase';
import {
  SendMessageWithMentionsUseCase,
  SendMessageWithRichTextUseCase,
  GetThreadMessagesUseCase,
  GetMessageAnalyticsUseCase,
  BulkMarkMessagesUseCase
} from './use_cases/AdvancedMessagingUseCases';
import {
  AdvancedMessageSearchUseCase,
  GetMessageContextUseCase,
  GetConversationInsightsUseCase,
  GetMessageTrendsUseCase
} from './use_cases/SearchIntelligenceUseCases';
import { CreateConversationUseCase, AddParticipantUseCase, RemoveParticipantUseCase, ManageConversationUseCase, GetConversationsUseCase } from './use_cases/ConversationUseCases';
import { CreateUserUseCase, UpdateUserStatusUseCase, UpdateUserOnlineStatusUseCase, UpdateUserProfileUseCase } from './use_cases/UserUseCases';
import { AnalyzeSentimentUseCase } from '@application/use_cases/AnalyzeSentimentUseCase';
import { CategorizeMessageUseCase } from '@application/use_cases/CategorizeMessageUseCase';
import { GenerateReplySuggestionsUseCase } from '@application/use_cases/GenerateReplySuggestionsUseCase';
import { SemanticSearchUseCase } from '@application/use_cases/SemanticSearchUseCase';
import { ClaudeAIServiceAdapter } from '@infrastructure/adapters/ClaudeAIServiceAdapter';
import { AIAnalysisPort } from '@domain/ports/AIAnalysisPort';

/**
 * DependencyInjectionConfig
 * 
 * Architectural Intent:
 * - Centralizes the creation and wiring of all application components
 * - Implements the dependency injection pattern for clean architecture
 * - Ensures proper separation of concerns across layers
 * - Provides a single source of truth for application dependencies
 * 
 * Key Design Decisions:
 * 1. Follows the dependency inversion principle
 * 2. Creates instances in the correct order (infrastructure → domain → application)
 * 3. Injects dependencies through constructors
 * 4. Maintains layer boundaries by preventing cross-layer dependencies
 */
export class DependencyInjectionConfig {
  // Domain services
  private messageDomainService: MessageDomainService;
  private conversationDomainService: ConversationDomainService;
  private userDomainService: UserDomainService;

  // Application use cases
  private createMessageUseCase: CreateMessageUseCase;
  private updateMessageUseCase: UpdateMessageUseCase;
  private deleteMessageUseCase: DeleteMessageUseCase;
  private addReactionUseCase: AddReactionUseCase;
  private getMessageHistoryUseCase: GetMessageHistoryUseCase;
  private searchMessagesUseCase: SearchMessagesUseCase;
  private getMessageByIdUseCase: GetMessageByIdUseCase;
  private markMessagesAsReadUseCase: MarkMessagesAsReadUseCase;
  private markIndividualMessageAsReadUseCase: MarkIndividualMessageAsReadUseCase;
  private sendMessageWithMentionsUseCase: SendMessageWithMentionsUseCase;
  private sendMessageWithRichTextUseCase: SendMessageWithRichTextUseCase;
  private getThreadMessagesUseCase: GetThreadMessagesUseCase;
  private getMessageAnalyticsUseCase: GetMessageAnalyticsUseCase;
  private bulkMarkMessagesUseCase: BulkMarkMessagesUseCase;
  private advancedMessageSearchUseCase: AdvancedMessageSearchUseCase;
  private getMessageContextUseCase: GetMessageContextUseCase;
  private getConversationInsightsUseCase: GetConversationInsightsUseCase;
  private getMessageTrendsUseCase: GetMessageTrendsUseCase;
  private createConversationUseCase: CreateConversationUseCase;
  private addParticipantUseCase: AddParticipantUseCase;
  private removeParticipantUseCase: RemoveParticipantUseCase;
  private manageConversationUseCase: ManageConversationUseCase;
  private getConversationsUseCase: GetConversationsUseCase;
  private createUserUseCase: CreateUserUseCase;
  private updateUserStatusUseCase: UpdateUserStatusUseCase;
  private updateUserOnlineStatusUseCase: UpdateUserOnlineStatusUseCase;
  private updateUserProfileUseCase: UpdateUserProfileUseCase;

  // AI analysis services
  private aiAnalysisPort: AIAnalysisPort;
  private analyzeSentimentUseCase: AnalyzeSentimentUseCase;
  private categorizeMessageUseCase: CategorizeMessageUseCase;
  private generateReplySuggestionsUseCase: GenerateReplySuggestionsUseCase;
  private semanticSearchUseCase: SemanticSearchUseCase;

  constructor() {
    // Initialize infrastructure layer (repositories)
    const messageRepository = new TypeORMMessageRepositoryAdapter(AppDataSource);
    const conversationRepository = new TypeORMConversationRepositoryAdapter(AppDataSource);
    const userRepository = new TypeORMUserRepositoryAdapter(AppDataSource);

    // Initialize domain services
    this.messageDomainService = new MessageDomainService(messageRepository, conversationRepository);
    this.conversationDomainService = new ConversationDomainService(conversationRepository, userRepository);
    this.userDomainService = new UserDomainService(userRepository);

    // Initialize application use cases
    this.createMessageUseCase = new CreateMessageUseCase(this.messageDomainService);
    this.updateMessageUseCase = new UpdateMessageUseCase(this.messageDomainService);
    this.deleteMessageUseCase = new DeleteMessageUseCase(this.messageDomainService);
    this.addReactionUseCase = new AddReactionUseCase(this.messageDomainService);
    this.getMessageHistoryUseCase = new GetMessageHistoryUseCase(this.messageDomainService);
    this.searchMessagesUseCase = new SearchMessagesUseCase(this.messageDomainService);
    this.getMessageByIdUseCase = new GetMessageByIdUseCase(this.messageDomainService);
    this.markMessagesAsReadUseCase = new MarkMessagesAsReadUseCase(this.messageDomainService);
    this.markIndividualMessageAsReadUseCase = new MarkIndividualMessageAsReadUseCase(this.messageDomainService, messageRepository);
    this.sendMessageWithMentionsUseCase = new SendMessageWithMentionsUseCase(this.messageDomainService, this.userDomainService);
    this.sendMessageWithRichTextUseCase = new SendMessageWithRichTextUseCase(this.messageDomainService);
    this.getThreadMessagesUseCase = new GetThreadMessagesUseCase(this.messageDomainService);
    this.getMessageAnalyticsUseCase = new GetMessageAnalyticsUseCase(this.messageDomainService, this.conversationDomainService);
    this.bulkMarkMessagesUseCase = new BulkMarkMessagesUseCase(this.messageDomainService);
    this.advancedMessageSearchUseCase = new AdvancedMessageSearchUseCase(this.messageDomainService, this.conversationDomainService);
    this.getMessageContextUseCase = new GetMessageContextUseCase(this.messageDomainService);
    this.getConversationInsightsUseCase = new GetConversationInsightsUseCase(this.messageDomainService, this.conversationDomainService);
    this.getMessageTrendsUseCase = new GetMessageTrendsUseCase(this.messageDomainService);
    this.createConversationUseCase = new CreateConversationUseCase(this.conversationDomainService, this.userDomainService);
    this.addParticipantUseCase = new AddParticipantUseCase(this.conversationDomainService);
    this.removeParticipantUseCase = new RemoveParticipantUseCase(this.conversationDomainService);
    this.manageConversationUseCase = new ManageConversationUseCase(this.conversationDomainService);
    this.getConversationsUseCase = new GetConversationsUseCase(this.conversationDomainService);
    this.createUserUseCase = new CreateUserUseCase(this.userDomainService);
    this.updateUserStatusUseCase = new UpdateUserStatusUseCase(this.userDomainService);
    this.updateUserOnlineStatusUseCase = new UpdateUserOnlineStatusUseCase(this.userDomainService);
    this.updateUserProfileUseCase = new UpdateUserProfileUseCase(this.userDomainService);

    // Initialize AI analysis services
    this.aiAnalysisPort = new ClaudeAIServiceAdapter(
      process.env.ANTHROPIC_API_KEY,
      process.env.PINECONE_API_KEY,
      process.env.PINECONE_INDEX || 'nexuscomm-messages',
    );
    this.analyzeSentimentUseCase = new AnalyzeSentimentUseCase(this.aiAnalysisPort);
    this.categorizeMessageUseCase = new CategorizeMessageUseCase(this.aiAnalysisPort);
    this.generateReplySuggestionsUseCase = new GenerateReplySuggestionsUseCase(this.aiAnalysisPort);
    this.semanticSearchUseCase = new SemanticSearchUseCase(this.aiAnalysisPort);
  }

  // Message use cases
  public getCreateMessageUseCase(): CreateMessageUseCase {
    return this.createMessageUseCase;
  }

  public getUpdateMessageUseCase(): UpdateMessageUseCase {
    return this.updateMessageUseCase;
  }

  public getDeleteMessageUseCase(): DeleteMessageUseCase {
    return this.deleteMessageUseCase;
  }

  public getAddReactionUseCase(): AddReactionUseCase {
    return this.addReactionUseCase;
  }

  public getGetMessageHistoryUseCase(): GetMessageHistoryUseCase {
    return this.getMessageHistoryUseCase;
  }

  public getSearchMessagesUseCase(): SearchMessagesUseCase {
    return this.searchMessagesUseCase;
  }

  public getGetMessageByIdUseCase(): GetMessageByIdUseCase {
    return this.getMessageByIdUseCase;
  }

  public getMarkMessagesAsReadUseCase(): MarkMessagesAsReadUseCase {
    return this.markMessagesAsReadUseCase;
  }

  public getMarkIndividualMessageAsReadUseCase(): MarkIndividualMessageAsReadUseCase {
    return this.markIndividualMessageAsReadUseCase;
  }

  public getSendMessageWithMentionsUseCase(): SendMessageWithMentionsUseCase {
    return this.sendMessageWithMentionsUseCase;
  }

  public getSendMessageWithRichTextUseCase(): SendMessageWithRichTextUseCase {
    return this.sendMessageWithRichTextUseCase;
  }

  public getGetThreadMessagesUseCase(): GetThreadMessagesUseCase {
    return this.getThreadMessagesUseCase;
  }

  public getGetMessageAnalyticsUseCase(): GetMessageAnalyticsUseCase {
    return this.getMessageAnalyticsUseCase;
  }

  public getBulkMarkMessagesUseCase(): BulkMarkMessagesUseCase {
    return this.bulkMarkMessagesUseCase;
  }

  public getAdvancedMessageSearchUseCase(): AdvancedMessageSearchUseCase {
    return this.advancedMessageSearchUseCase;
  }

  public getGetMessageContextUseCase(): GetMessageContextUseCase {
    return this.getMessageContextUseCase;
  }

  public getGetConversationInsightsUseCase(): GetConversationInsightsUseCase {
    return this.getConversationInsightsUseCase;
  }

  public getGetMessageTrendsUseCase(): GetMessageTrendsUseCase {
    return this.getMessageTrendsUseCase;
  }

  // Conversation use cases
  public getCreateConversationUseCase(): CreateConversationUseCase {
    return this.createConversationUseCase;
  }

  public getAddParticipantUseCase(): AddParticipantUseCase {
    return this.addParticipantUseCase;
  }

  public getRemoveParticipantUseCase(): RemoveParticipantUseCase {
    return this.removeParticipantUseCase;
  }

  public getManageConversationUseCase(): ManageConversationUseCase {
    return this.manageConversationUseCase;
  }

  public getGetConversationsUseCase(): GetConversationsUseCase {
    return this.getConversationsUseCase;
  }

  // User use cases
  public getCreateUserUseCase(): CreateUserUseCase {
    return this.createUserUseCase;
  }

  public getUpdateUserStatusUseCase(): UpdateUserStatusUseCase {
    return this.updateUserStatusUseCase;
  }

  public getUpdateUserOnlineStatusUseCase(): UpdateUserOnlineStatusUseCase {
    return this.updateUserOnlineStatusUseCase;
  }

  public getUpdateUserProfileUseCase(): UpdateUserProfileUseCase {
    return this.updateUserProfileUseCase;
  }

  // AI analysis use cases
  public getAIAnalysisPort(): AIAnalysisPort {
    return this.aiAnalysisPort;
  }

  public getAnalyzeSentimentUseCase(): AnalyzeSentimentUseCase {
    return this.analyzeSentimentUseCase;
  }

  public getCategorizeMessageUseCase(): CategorizeMessageUseCase {
    return this.categorizeMessageUseCase;
  }

  public getGenerateReplySuggestionsUseCase(): GenerateReplySuggestionsUseCase {
    return this.generateReplySuggestionsUseCase;
  }

  public getSemanticSearchUseCase(): SemanticSearchUseCase {
    return this.semanticSearchUseCase;
  }
}

// Singleton instance
const diConfig = new DependencyInjectionConfig();
export default diConfig;