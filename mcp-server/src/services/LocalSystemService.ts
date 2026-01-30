/**
 * Local System Service
 * Handles file system, shell, and browser operations
 */

import { exec, spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import pino from 'pino';
import chokidar from 'chokidar';
import { FileSystemOptions, ShellCommand, BrowserAction } from '../types/index.js';

const execAsync = promisify(exec);

export class LocalSystemService {
  private logger: pino.Logger;
  private allowedPaths: string[];
  private enableShellAccess: boolean;
  private enableBrowserControl: boolean;

  constructor(config: {
    allowedPaths: string[];
    enableShellAccess: boolean;
    enableBrowserControl: boolean;
  }) {
    this.allowedPaths = config.allowedPaths.map(p => path.resolve(p));
    this.enableShellAccess = config.enableShellAccess;
    this.enableBrowserControl = config.enableBrowserControl;
    this.logger = pino({ name: 'LocalSystemService' });
  }

  /**
   * Validate if a path is allowed for access
   */
  private validatePath(requestedPath: string): string {
    const resolvedPath = path.resolve(requestedPath);
    
    if (!this.allowedPaths.some(allowed => 
      resolvedPath.startsWith(allowed) || resolvedPath === allowed
    )) {
      throw new Error(`Access denied: ${requestedPath} is not in allowed paths`);
    }
    
    return resolvedPath;
  }

  /**
   * File system operations
   */
  async fileSystem(options: FileSystemOptions): Promise<any> {
    const validPath = this.validatePath(options.path);
    
    try {
      switch (options.operation) {
        case 'read':
          return await fs.readFile(validPath, 'utf-8');
          
        case 'write':
          if (!options.content) {
            throw new Error('Content is required for write operation');
          }
          await fs.writeFile(validPath, options.content, 'utf-8');
          return { success: true, message: 'File written successfully' };
          
        case 'list':
          const entries = await fs.readdir(validPath, { withFileTypes: true });
          return entries.map(entry => ({
            name: entry.name,
            isDirectory: entry.isDirectory(),
            isFile: entry.isFile(),
            path: path.join(validPath, entry.name),
          }));
          
        case 'delete':
          await fs.rm(validPath, { recursive: options.recursive || false });
          return { success: true, message: 'File/directory deleted successfully' };
          
        case 'search':
          return await this.searchInDirectory(validPath, options.pattern || '');
          
        default:
          throw new Error(`Unsupported file system operation: ${options.operation}`);
      }
    } catch (error) {
      this.logger.error({ error, options }, 'File system operation failed');
      throw error;
    }
  }

  /**
   * Search for files in directory
   */
  private async searchInDirectory(dirPath: string, pattern: string): Promise<string[]> {
    const results: string[] = [];
    const regex = new RegExp(pattern, 'i');
    
    const search = async (currentPath: string) => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (regex.test(entry.name)) {
          results.push(fullPath);
        }
        
        if (entry.isDirectory()) {
          await search(fullPath);
        }
      }
    };
    
    await search(dirPath);
    return results;
  }

  /**
   * Execute shell command
   */
  async executeCommand(command: ShellCommand): Promise<any> {
    if (!this.enableShellAccess) {
      throw new Error('Shell access is disabled');
    }

    // Security checks
    if (command.allowSudo && command.command.includes('sudo')) {
      throw new Error('Sudo commands are not allowed');
    }

    const dangerousCommands = [
      'rm -rf /',
      'mkfs',
      'dd if=',
      'chmod 777 /',
      'chown root',
      'crontab',
      'systemctl',
    ];

    if (dangerousCommands.some(dangerous => 
      command.command.includes(dangerous)
    )) {
      throw new Error(`Dangerous command detected: ${command.command}`);
    }

    try {
      const timeout = command.timeout || 30000;
      const cwd = command.cwd || process.cwd();
      
      this.logger.info({ command: command.command, args: command.args, cwd }, 'Executing command');
      
      return new Promise((resolve, reject) => {
        const child = spawn(command.command, command.args || [], {
          cwd,
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true,
        });

        let stdout = '';
        let stderr = '';

        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });

        const timer = setTimeout(() => {
          child.kill('SIGTERM');
          reject(new Error('Command execution timeout'));
        }, timeout);

        child.on('close', (code) => {
          clearTimeout(timer);
          resolve({
            exitCode: code,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            success: code === 0,
          });
        });

        child.on('error', (error) => {
          clearTimeout(timer);
          reject(error);
        });
      });
    } catch (error) {
      this.logger.error({ error, command }, 'Command execution failed');
      throw error;
    }
  }

  /**
   * Browser automation (placeholder for future implementation)
   */
  async browserAction(action: BrowserAction): Promise<any> {
    if (!this.enableBrowserControl) {
      throw new Error('Browser control is disabled');
    }

    // This would integrate with a browser automation library like Puppeteer
    // For now, return a placeholder response
    this.logger.info({ action }, 'Browser action requested');
    
    return {
      success: true,
      message: `Browser action '${action.action}' executed successfully`,
      // In real implementation, would return actual results
    };
  }

  /**
   * Watch for file system changes
   */
  async watchPath(watchPath: string, callback: (event: string, path: string) => void): Promise<void> {
    const validPath = this.validatePath(watchPath);
    
    const watcher = chokidar.watch(validPath, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
    });

    watcher
      .on('change', (path) => callback('change', path))
      .on('add', (path) => callback('add', path))
      .on('unlink', (path) => callback('unlink', path));

    this.logger.info({ path: validPath }, 'Started watching path');
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<any> {
    try {
      const [platform, arch, nodeVersion, memory] = await Promise.all([
        execAsync('uname -s').catch(() => ({ stdout: process.platform })),
        execAsync('uname -m').catch(() => ({ stdout: process.arch })),
        execAsync('node --version').catch(() => ({ stdout: process.version })),
        execAsync('free -h').catch(() => ({ stdout: 'N/A' })),
      ]);

      return {
        platform: platform.stdout.trim(),
        architecture: arch.stdout.trim(),
        nodeVersion: nodeVersion.stdout.trim(),
        memory: memory.stdout.trim(),
        allowedPaths: this.allowedPaths,
        shellAccess: this.enableShellAccess,
        browserControl: this.enableBrowserControl,
      };
    } catch (error) {
      this.logger.error({ error }, 'Failed to get system info');
      throw error;
    }
  }
}