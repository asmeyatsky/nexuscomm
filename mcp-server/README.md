# NexusComm MCP Server

Model Context Protocol (MCP) server for NexusComm, providing advanced AI assistant capabilities that bridge the gap between cloud-based communication management and local system automation.

## 🚀 Features

### 📱 NexusComm Integration
- **Message Management**: Send, receive, and organize messages across all channels
- **AI-Powered Analytics**: Sentiment analysis, smart categorization, semantic search
- **Conversation Intelligence**: Auto-summarization, reply suggestions, health monitoring
- **Multi-Channel Support**: Gmail, WhatsApp, Instagram, LinkedIn integration

### 🖥️ Local System Access
- **File System Operations**: Read, write, list, search files in allowed directories
- **Shell Command Execution**: Secure command execution with safety restrictions
- **Browser Automation**: Navigate, click, type, screenshot capabilities (configurable)
- **System Monitoring**: Real-time system information and status tracking

### 🎯 Productivity Tools
- **Smart Triage**: Automatically categorize and prioritize messages
- **Daily Digests**: Comprehensive communication summaries and insights
- **Optimal Timing**: AI-powered message scheduling recommendations
- **Follow-Up Reminders**: Automated reminder system for important conversations

## 🛠️ Installation

```bash
# Navigate to MCP server directory
cd nexuscomm/mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## ⚙️ Configuration

Create a `.env` file in the `mcp-server` directory:

```env
# NexusComm Configuration
NEXUSCOMM_API_URL=http://localhost:3000
NEXUSCOMM_API_KEY=your_api_key_here
NEXUSCOMM_USER_ID=your_user_id_here

# Local System Configuration
ENABLE_FILE_SYSTEM=true
ALLOWED_PATHS=/Users/username/Documents,/Users/username/Downloads
ENABLE_SHELL_ACCESS=false
ENABLE_BROWSER_CONTROL=false

# AI Configuration
ANTHROPIC_API_KEY=your_anthropic_key_here
AI_DEFAULT_MODEL=claude-3-sonnet-20240229
AI_MAX_TOKENS=4096
```

## 🔧 Security

### File System Access
- Restricted to explicitly allowed paths
- Path traversal protection
- Read/write permissions controlled by configuration

### Shell Command Execution
- Disabled by default
- Dangerous command filtering
- Sudo command blocking
- Configurable timeout protection

### Browser Control
- Disabled by default for security
- Can be enabled for trusted environments

## 📋 Available Tools

### Messaging Tools
- `get_conversations` - List user conversations
- `get_messages` - Retrieve messages from conversations
- `send_message` - Send new messages
- `analyze_sentiment` - AI sentiment analysis
- `get_reply_suggestions` - Generate AI reply suggestions
- `semantic_search` - Search across messages semantically

### Productivity Tools
- `triage_messages` - Auto-categorize messages
- `generate_daily_summary` - Create daily communication digest
- `suggest_optimal_timing` - Get AI scheduling recommendations
- `set_follow_up_reminder` - Create automated reminders
- `check_conversation_health` - Analyze conversation health

### System Tools
- `file_system` - File operations (read, write, list, delete, search)
- `execute_command` - Secure shell command execution
- `browser_action` - Browser automation
- `get_system_info` - System information and capabilities

## 📚 Available Resources

### Communication Resources
- `nexuscomm://conversations` - All user conversations
- `nexuscomm://messages/unread` - Unread messages
- `nexuscomm://digest/daily` - Daily communication summary
- `nexuscomm://ai/usage` - AI usage metrics

### System Resources
- `system://status` - System status and capabilities
- `system://files` - File system information
- `system://reminders` - Active follow-up reminders

## 🔄 Integration with Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "nexuscomm": {
      "command": "node",
      "args": ["/path/to/nexuscomm/mcp-server/dist/index.js"],
      "env": {
        "NEXUSCOMM_API_URL": "http://localhost:3000",
        "NEXUSCOMM_API_KEY": "your_api_key",
        "NEXUSCOMM_USER_ID": "your_user_id",
        "ALLOWED_PATHS": "/Users/username/Documents,/Users/username/Downloads"
      }
    }
  }
}
```

## 🎯 Usage Examples

### Example 1: Smart Email Triage
```
"Help me triage my unread messages and categorize them by urgency"
```

### Example 2: Generate Daily Summary
```
"Create a comprehensive summary of all my communications from today"
```

### Example 3: File-Based Follow-up
```
"Read the meeting notes from /Users/username/Documents/meeting.txt and set a follow-up reminder for tomorrow at 10 AM"
```

### Example 4: Cross-Platform Integration
```
"Find all messages about 'Project Alpha' across Gmail and WhatsApp, then create a summary and suggest optimal reply timing"
```

## 🧪 Development

```bash
# Run in development mode with watch
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Run MCP Inspector for debugging
npm run inspector
```

## 🔍 MCP Inspector

Use the MCP Inspector to test and debug the server:

```bash
npx @modelcontextprotocol/inspector src/index.ts
```

## 🛡️ Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **File Paths**: Be conservative with allowed file system paths
3. **Shell Access**: Keep shell access disabled unless absolutely necessary
4. **Network**: Consider running the server in a sandboxed environment

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add tests for new functionality
3. Update documentation for new tools/resources
4. Ensure security best practices

## 📄 License

Proprietary License - see main NexusComm license file.

---

**NexusComm MCP Server** - Bridging Communication and Automation 🚀