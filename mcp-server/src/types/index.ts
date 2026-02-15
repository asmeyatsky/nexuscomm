/**
 * MCP Server Configuration Types
 */

export interface MCPConfig {
  name: string;
  version: string;
  nexusComm: {
    apiUrl: string;
    apiKey: string;
    userId: string;
  };
  localSystem: {
    enableFileSystem: boolean;
    allowedPaths: string[];
    enableShellAccess: boolean;
    enableBrowserControl: boolean;
  };
  ai: {
    anthropicApiKey?: string;
    defaultModel: string;
    maxTokens: number;
  };
  security: {
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    maxToolTimeoutMs: number;
    enableAuditLog: boolean;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  tool: string;
  userId: string;
  params?: Record<string, unknown>;
  success: boolean;
  durationMs?: number;
  error?: string;
}

export interface RateLimitConfig {
  allowedPaths?: string[];
  maxRequests: number;
  windowMs: number;
}

export interface MessageContext {
  conversationId: string;
  messageId?: string;
  participantIds: string[];
  lastMessages?: Array<{
    id: string;
    content: string;
    sender: string;
    timestamp: Date;
  }>;
}

export interface FileSystemOptions {
  path: string;
  operation: 'read' | 'write' | 'list' | 'delete' | 'search';
  content?: string;
  recursive?: boolean;
  pattern?: string;
}

export interface ShellCommand {
  command: string;
  args?: string[];
  cwd?: string;
  timeout?: number;
  allowSudo: boolean;
}

export interface BrowserAction {
  action: 'navigate' | 'click' | 'type' | 'scroll' | 'screenshot' | 'extract';
  url?: string;
  selector?: string;
  text?: string;
  coordinates?: { x: number; y: number };
}

export interface NexusCommTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface ConversationSummary {
  conversationId: string;
  summary: string;
  keyPoints: string[];
  mainTopics: string[];
  participants: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high';
  actionItems: string[];
}