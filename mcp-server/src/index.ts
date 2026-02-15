/**
 * NexusComm MCP Server
 * 
 * Security Features (2026 Best Practices):
 * - Input validation with Zod schemas
 * - Rate limiting per tool
 * - Audit logging
 * - Command filtering for shell access
 * - Path traversal prevention
 * - Timeout enforcement
 * - Resource limits
 */

import pino from 'pino';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

import { NexusCommService } from './services/NexusCommService.js';
import { LocalSystemService } from './services/LocalSystemService.js';
import { createMessagingTools } from './tools/messaging.js';
import { createSystemTools } from './tools/system.js';
import { createProductivityTools } from './tools/productivity.js';
import { createResources } from './resources/index.js';
import { MCPConfig, AuditLogEntry, RateLimitConfig } from './types/index.js';

config();

const logger = pino({
  name: 'NexusComm-MCP-Server',
  level: process.env.LOG_LEVEL || 'info',
});

const AUDIT_LOG: AuditLogEntry[] = [];
const MAX_AUDIT_LOG_SIZE = 10000;

function addAuditEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  const fullEntry: AuditLogEntry = {
    ...entry,
    id: uuidv4(),
    timestamp: new Date().toISOString(),
  };
  AUDIT_LOG.push(fullEntry);
  if (AUDIT_LOG.length > MAX_AUDIT_LOG_SIZE) {
    AUDIT_LOG.shift();
  }
}

export class SecurityManager {
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly WINDOW_MS = 60000;
  private readonly MAX_REQUESTS = 100;

  private readonly DANGEROUS_PATTERNS = [
    /rm\s+-rf/i,
    /format\s+c:/i,
    /mkfs/i,
    /dd\s+if=/i,
    />\s*\/dev\/sd/i,
    /curl.*\|\s*sh/i,
    /wget.*\|\s*sh/i,
    /fork\(\)/i,
    /:\(\)\{/i,
  ];

  private readonly ALLOWED_SHELL_COMMANDS = new Set([
    'ls', 'cat', 'pwd', 'cd', 'echo', 'grep', 'find', 'head', 'tail',
    'mkdir', 'touch', 'cp', 'mv', 'rm', 'chmod', 'chown',
    'git', 'npm', 'node', 'python', 'python3', 'ruby',
    'docker', 'kubectl', 'terraform',
  ]);

  constructor(private config: RateLimitConfig) {}

  checkRateLimit(key: string): boolean {
    const now = Date.now();
    const entry = this.rateLimits.get(key);

    if (!entry || now > entry.resetTime) {
      this.rateLimits.set(key, { count: 1, resetTime: now + this.WINDOW_MS });
      return true;
    }

    if (entry.count >= this.MAX_REQUESTS) {
      return false;
    }

    entry.count++;
    return true;
  }

  validatePath(path: string): boolean {
    const normalized = path.replace(/\\/g, '/');
    if (normalized.includes('..')) return false;
    if (normalized.startsWith('/etc') || normalized.startsWith('/sys')) return false;
    if (normalized.startsWith('/proc') && !normalized.startsWith('/proc/self')) return false;
    
    for (const allowed of this.config.allowedPaths || []) {
      if (normalized.startsWith(allowed)) return true;
    }
    return false;
  }

  validateCommand(command: string): { valid: boolean; reason?: string } {
    const trimmed = command.trim().split(/\s+/)[0];
    const baseCmd = trimmed.replace(/^.*\//, '').toLowerCase();

    if (!this.ALLOWED_SHELL_COMMANDS.has(baseCmd)) {
      return { valid: false, reason: `Command '${baseCmd}' is not allowed` };
    }

    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        return { valid: false, reason: 'Command contains dangerous pattern' };
      }
    }

    return { valid: true };
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.rateLimits.entries()) {
      if (now > value.resetTime) {
        this.rateLimits.delete(key);
      }
    }
  }
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: unknown) => Promise<unknown>;
}

interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  handler: () => Promise<unknown>;
}

interface MCPServer {
  run(): Promise<void>;
}

class NexusCommMCPServer implements MCPServer {
  private tools: Map<string, MCPTool> = new Map();
  private resources: Map<string, MCPResource> = new Map();
  private securityManager: SecurityManager;
  private readonly mcpConfig: MCPConfig;

  constructor(mcpConfig: MCPConfig) {
    this.mcpConfig = mcpConfig;
    this.securityManager = new SecurityManager({
      allowedPaths: mcpConfig.localSystem.allowedPaths,
      maxRequests: mcpConfig.security.rateLimitMaxRequests,
      windowMs: mcpConfig.security.rateLimitWindowMs,
    });

    setInterval(() => this.securityManager.clearExpired(), 60000);
  }

  registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
  }

  registerResource(resource: MCPResource): void {
    this.resources.set(resource.uri, resource);
  }

  async handleToolCall(name: string, args: unknown): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    const startTime = Date.now();

    addAuditEntry({
      action: 'tool_call',
      tool: name,
      userId: this.mcpConfig.nexusComm.userId,
      params: args as Record<string, unknown>,
      success: false,
    });

    if (!this.securityManager.checkRateLimit(name)) {
      logger.warn({ tool: name }, 'Rate limit exceeded');
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }) }],
        isError: true,
      };
    }

    const tool = this.tools.get(name);
    if (!tool) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: `Tool '${name}' not found` }) }],
        isError: true,
      };
    }

    try {
      const timeoutMs = this.mcpConfig.security.maxToolTimeoutMs;
      const result = await Promise.race([
        tool.handler(args),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Tool execution timeout')), timeoutMs)
        ),
      ]);

      const entryIdx = AUDIT_LOG.length - 1;
      if (entryIdx >= 0 && AUDIT_LOG[entryIdx]) {
        AUDIT_LOG[entryIdx].success = true;
        AUDIT_LOG[entryIdx].durationMs = Date.now() - startTime;
      }

      return {
        content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      const entryIdx = AUDIT_LOG.length - 1;
      if (entryIdx >= 0 && AUDIT_LOG[entryIdx]) {
        AUDIT_LOG[entryIdx].success = false;
        AUDIT_LOG[entryIdx].error = error instanceof Error ? error.message : String(error);
        AUDIT_LOG[entryIdx].durationMs = Date.now() - startTime;
      }

      logger.error({ tool: name, error }, 'Tool execution failed');
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }) }],
        isError: true,
      };
    }
  }

  handleListTools(): Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  handleListResources(): Array<{ uri: string; name: string; description: string; mimeType?: string }> {
    return Array.from(this.resources.values()).map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
    }));
  }

  async handleReadResource(uri: string): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }> {
    const resource = this.resources.get(uri);
    if (!resource) {
      throw new Error(`Resource '${uri}' not found`);
    }

    const content = await resource.handler();
    return {
      contents: [{
        uri,
        mimeType: resource.mimeType,
        text: typeof content === 'string' ? content : JSON.stringify(content),
      }],
    };
  }

  getSecurityManager(): SecurityManager {
    return this.securityManager;
  }

  async run(): Promise<void> {
    process.stdin.setEncoding('utf-8');
    
    let buffer = '';
    
    for await (const chunk of process.stdin) {
      buffer += chunk;
      
      try {
        const messages = buffer.split('\n').filter(line => line.trim());
        buffer = '';
        
        for (const line of messages) {
          const msg = JSON.parse(line);
          await this.handleMessage(msg);
        }
      } catch {
        // Continue accumulating
      }
    }
  }

  private async handleMessage(msg: { jsonrpc?: string; method?: string; id?: unknown; params?: unknown }): Promise<void> {
    if (msg.jsonrpc !== '2.0') return;

    const response: { jsonrpc: string; id: unknown; result?: unknown; error?: { code: number; message: string } } = {
      jsonrpc: '2.0',
      id: msg.id,
    };

    try {
      switch (msg.method) {
        case 'tools/list':
          response.result = { tools: this.handleListTools() };
          break;
        case 'tools/call': {
          const callParams = msg.params as { name: string; arguments: unknown };
          const toolResult = await this.handleToolCall(callParams.name, callParams.arguments);
          response.result = toolResult;
          break;
        }
        case 'resources/list':
          response.result = { resources: this.handleListResources() };
          break;
        case 'resources/read': {
          const readParams = msg.params as { uri: string };
          response.result = await this.handleReadResource(readParams.uri);
          break;
        }
        case 'initialize':
          response.result = {
            protocolVersion: '2024-11-05',
            serverInfo: { name: this.mcpConfig.name, version: this.mcpConfig.version },
            capabilities: { tools: {}, resources: {} },
          };
          break;
        default:
          response.error = { code: -32601, message: 'Method not found' };
      }
    } catch (error) {
      response.error = { code: -32603, message: error instanceof Error ? error.message : 'Internal error' };
    }

    process.stdout.write(JSON.stringify(response) + '\n');
  }
}

async function createServer(): Promise<NexusCommMCPServer> {
  const mcpConfig: MCPConfig = {
    name: 'nexuscomm-mcp-server',
    version: '1.1.0',
    nexusComm: {
      apiUrl: process.env.NEXUSCOMM_API_URL || 'http://localhost:3000',
      apiKey: process.env.NEXUSCOMM_API_KEY || '',
      userId: process.env.NEXUSCOMM_USER_ID || '',
    },
    localSystem: {
      enableFileSystem: process.env.ENABLE_FILE_SYSTEM !== 'false',
      allowedPaths: (process.env.ALLOWED_PATHS || process.cwd()).split(','),
      enableShellAccess: process.env.ENABLE_SHELL_ACCESS === 'true',
      enableBrowserControl: process.env.ENABLE_BROWSER_CONTROL === 'true',
    },
    ai: {
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      defaultModel: process.env.AI_DEFAULT_MODEL || 'claude-3-5-sonnet-20241022',
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096'),
    },
    security: {
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      maxToolTimeoutMs: parseInt(process.env.MAX_TOOL_TIMEOUT_MS || '30000'),
      enableAuditLog: process.env.ENABLE_AUDIT_LOG !== 'false',
    },
  };

  if (!mcpConfig.nexusComm.apiKey) {
    logger.warn('NexusComm API key not configured, some features may not work');
  }

  if (!mcpConfig.nexusComm.userId) {
    logger.warn('NexusComm user ID not configured, some features may not work');
  }

  const server = new NexusCommMCPServer(mcpConfig);

  const nexusComm = new NexusCommService(
    mcpConfig.nexusComm.apiUrl,
    mcpConfig.nexusComm.apiKey,
    mcpConfig.nexusComm.userId
  );

  const localSystem = new LocalSystemService({
    allowedPaths: mcpConfig.localSystem.allowedPaths,
    enableShellAccess: mcpConfig.localSystem.enableShellAccess,
    enableBrowserControl: mcpConfig.localSystem.enableBrowserControl,
  });

  const messagingTools = createMessagingTools(nexusComm, server.getSecurityManager());
  const systemTools = createSystemTools(localSystem, server.getSecurityManager());
  const productivityTools = createProductivityTools(nexusComm, localSystem, server.getSecurityManager());
  const resources = createResources(nexusComm, localSystem);

  for (const tool of Object.values(messagingTools)) {
    server.registerTool(tool);
  }
  for (const tool of Object.values(systemTools)) {
    server.registerTool(tool);
  }
  for (const tool of Object.values(productivityTools)) {
    server.registerTool(tool);
  }
  for (const resource of Object.values(resources)) {
    server.registerResource(resource);
  }

  server.registerTool({
    name: 'mcp_server_info',
    description: 'Get information about the MCP server and its capabilities',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const systemInfo = await localSystem.getSystemInfo();
      const nexusCommStatus = await nexusComm.testConnection();
      return {
        server: mcpConfig.name,
        version: mcpConfig.version,
        capabilities: {
          nexusComm: nexusCommStatus ? 'connected' : 'disconnected',
          fileSystem: mcpConfig.localSystem.enableFileSystem,
          shellAccess: mcpConfig.localSystem.enableShellAccess,
          browserControl: mcpConfig.localSystem.enableBrowserControl,
        },
        allowedPaths: systemInfo.allowedPaths,
        tools: server.handleListTools().map(t => t.name),
        resources: server.handleListResources().map(r => r.uri),
      };
    },
  });

  logger.info({ version: mcpConfig.version }, 'MCP Server configured');
  return server;
}

async function startServer(): Promise<void> {
  try {
    const server = await createServer();
    
    logger.info('NexusComm MCP Server started and connected via stdio');

    const shutdown = (code: number) => {
      if (code === 0) {
        logger.info('Shutting down MCP server...');
        addAuditEntry({
          action: 'server_shutdown',
          tool: 'system',
          userId: 'system',
          success: true,
        });
      } else {
        logger.error('MCP server shutting down with error');
      }
      process.exit(code);
    };

    process.on('SIGINT', () => shutdown(0));
    process.on('SIGTERM', () => shutdown(0));

    await server.run();
  } catch (error) {
    logger.error({ error }, 'Failed to start MCP server');
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void startServer();
}

export { createServer, startServer };
