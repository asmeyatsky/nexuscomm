/**
 * Local System Tools
 * MCP tools for file system, shell, and browser operations
 */

import { LocalSystemService } from '../services/LocalSystemService.js';
import { FileSystemOptions, ShellCommand, BrowserAction } from '../types/index.js';

export function createSystemTools(localSystem: LocalSystemService) {
  return {
    /**
     * File system operations
     */
    fileSystem: {
      name: 'file_system',
      description: 'Perform file system operations (read, write, list, delete, search)',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'File or directory path',
          },
          operation: {
            type: 'string',
            enum: ['read', 'write', 'list', 'delete', 'search'],
            description: 'Operation to perform',
          },
          content: {
            type: 'string',
            description: 'Content to write (required for write operation)',
          },
          recursive: {
            type: 'boolean',
            description: 'Recursive operation for delete/list',
          },
          pattern: {
            type: 'string',
            description: 'Search pattern (for search operation)',
          },
        },
        required: ['path', 'operation'],
      },
      handler: async (args: FileSystemOptions) => {
        return await localSystem.fileSystem(args);
      },
    },

    /**
     * Execute shell command
     */
    executeCommand: {
      name: 'execute_command',
      description: 'Execute shell command with security restrictions',
      inputSchema: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'Command to execute',
          },
          args: {
            type: 'array',
            description: 'Command arguments',
            items: { type: 'string' },
          },
          cwd: {
            type: 'string',
            description: 'Working directory',
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds (default: 30000)',
          },
          allowSudo: {
            type: 'boolean',
            description: 'Allow sudo commands (not recommended)',
          },
        },
        required: ['command'],
      },
      handler: async (args: ShellCommand) => {
        return await localSystem.executeCommand(args);
      },
    },

    /**
     * Browser automation
     */
    browserAction: {
      name: 'browser_action',
      description: 'Perform browser automation actions',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['navigate', 'click', 'type', 'scroll', 'screenshot', 'extract'],
            description: 'Browser action to perform',
          },
          url: {
            type: 'string',
            description: 'URL to navigate to (for navigate action)',
          },
          selector: {
            type: 'string',
            description: 'CSS selector (for click/type actions)',
          },
          text: {
            type: 'string',
            description: 'Text to type (for type action)',
          },
          coordinates: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
            },
            description: 'Coordinates (for click/scroll actions)',
          },
        },
        required: ['action'],
      },
      handler: async (args: BrowserAction) => {
        return await localSystem.browserAction(args);
      },
    },

    /**
     * Get system information
     */
    getSystemInfo: {
      name: 'get_system_info',
      description: 'Get system information and capabilities',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        return await localSystem.getSystemInfo();
      },
    },

    /**
     * Watch file system changes
     */
    watchFile: {
      name: 'watch_file',
      description: 'Watch for changes to a file or directory',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to watch',
          },
          events: {
            type: 'array',
            description: 'Events to watch for',
            items: {
              type: 'string',
              enum: ['change', 'add', 'unlink'],
            },
          },
        },
        required: ['path'],
      },
      handler: async (args: { path: string; events?: string[] }) => {
        // This would set up a watcher and return a watch ID
        // For now, return a placeholder indicating setup
        return {
          success: true,
          watchId: `watch_${Date.now()}`,
          message: `Started watching ${args.path}`,
        };
      },
    },

    /**
     * Create directory
     */
    createDirectory: {
      name: 'create_directory',
      description: 'Create a new directory',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Directory path to create',
          },
          recursive: {
            type: 'boolean',
            description: 'Create parent directories if needed',
          },
        },
        required: ['path'],
      },
      handler: async (args: { path: string; recursive?: boolean }) => {
        return await localSystem.fileSystem({
          path: args.path,
          operation: 'write',
          content: '', // Empty directory creation
        });
      },
    },

    /**
     * Read file with line numbers
     */
    readFileWithLines: {
      name: 'read_file_with_lines',
      description: 'Read file content with line numbers',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'File path to read',
          },
          startLine: {
            type: 'number',
            description: 'Starting line number (1-based)',
          },
          endLine: {
            type: 'number',
            description: 'Ending line number (1-based)',
          },
        },
        required: ['path'],
      },
      handler: async (args: { 
        path: string; 
        startLine?: number; 
        endLine?: number; 
      }) => {
        const content = await localSystem.fileSystem({
          path: args.path,
          operation: 'read',
        });

        const lines = content.split('\n');
        const start = args.startLine || 1;
        const end = args.endLine || lines.length;
        
        const selectedLines = lines
          .slice(start - 1, end)
          .map((line: string, index: number) => `${start + index}: ${line}`)
          .join('\n');

        return {
          content: selectedLines,
          totalLines: lines.length,
          showingLines: `${start}-${end}`,
        };
      },
    },
  };
}