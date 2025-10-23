export class EmailParsingService {
  private static instance: EmailParsingService;

  private constructor() {}

  public static getInstance(): EmailParsingService {
    if (!EmailParsingService.instance) {
      EmailParsingService.instance = new EmailParsingService();
    }
    return EmailParsingService.instance;
  }

  /**
   * Extract reply content from an email, removing quotes and signatures
   */
  public extractReplyContent(emailContent: string): string {
    // Remove common email reply headers and quoted text
    const cleanedContent = this.removeEmailQuotes(emailContent);
    
    // Remove common signatures
    const withoutSignature = this.removeSignature(cleanedContent);
    
    return withoutSignature.trim();
  }

  /**
   * Remove quoted text from email replies
   */
  private removeEmailQuotes(content: string): string {
    const lines = content.split('\n');
    const result: string[] = [];
    
    let inQuote = false;
    
    for (const line of lines) {
      // Check for common reply indicators
      if (line.trim().match(/^On.*wrote:$/)) {
        inQuote = true;
        continue;
      }
      
      // Check for quote markers
      if (line.trim().startsWith('>')) {
        inQuote = true;
        continue;
      }
      
      // Check for common email header lines
      if (
        line.trim().toLowerCase().startsWith('from:') ||
        line.trim().toLowerCase().startsWith('sent:') ||
        line.trim().toLowerCase().startsWith('to:') ||
        line.trim().toLowerCase().startsWith('subject:') ||
        line.trim().toLowerCase().startsWith('date:')
      ) {
        inQuote = true;
        continue;
      }
      
      // If we're in a quote block and encounter a non-quote line that's not empty,
      // check if it's a continuation of the quote or the user's reply
      if (inQuote && line.trim() !== '') {
        // If the line doesn't start with quote markers and is not a header, it might be the reply
        if (!line.trim().startsWith('>')) {
          inQuote = false;
        }
      }
      
      if (!inQuote) {
        result.push(line);
      }
    }
    
    return result.join('\n');
  }

  /**
   * Remove common email signatures
   */
  private removeSignature(content: string): string {
    const lines = content.split('\n');
    const result: string[] = [];
    
    // Look for signature delimiters like "-- " or "-----"
    let signatureStart = -1;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      
      if (line.trim() === '--' || line.trim().startsWith('-----')) {
        signatureStart = i;
        break;
      }
      
      // If we find a line with just the separator, it's likely the start of the signature
      if (line.trim() === '-- ') {
        signatureStart = i;
        break;
      }
    }
    
    if (signatureStart !== -1) {
      // Only keep lines before the signature
      for (let i = 0; i < signatureStart; i++) {
        result.push(lines[i]);
      }
    } else {
      // If no signature delimiter found, just return the content
      return content;
    }
    
    return result.join('\n');
  }

  /**
   * Check if an email address is valid
   */
  public isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Extract email addresses from text
   */
  public extractEmailAddresses(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(emailRegex) || [];
  }

  /**
   * Parse email subject to identify intent
   */
  public parseEmailSubject(subject: string): {
    isReply: boolean;
    isForward: boolean;
    intent: 'reply' | 'forward' | 'new';
  } {
    if (!subject) return { isReply: false, isForward: false, intent: 'new' };
    
    const subjectLower = subject.toLowerCase().trim();
    
    if (subjectLower.startsWith('re:')) {
      return { isReply: true, isForward: false, intent: 'reply' };
    }
    
    if (subjectLower.startsWith('fw:') || subjectLower.startsWith('fwd:')) {
      return { isReply: false, isForward: true, intent: 'forward' };
    }
    
    return { isReply: false, isForward: false, intent: 'new' };
  }
}

export const emailParsingService = EmailParsingService.getInstance();