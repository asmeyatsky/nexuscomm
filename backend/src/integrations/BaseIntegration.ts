import axios, { AxiosInstance } from 'axios';

/**
 * Base class for all platform integrations
 */
export abstract class BaseIntegration {
  protected client: AxiosInstance;
  protected maxRetries = 3;
  protected retryDelay = 1000; // ms

  constructor(
    protected baseURL: string,
    protected accessToken?: string,
    protected apiKey?: string
  ) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for error handling and retries
   */
  private setupInterceptors() {
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (this.shouldRetry(error)) {
          return this.retryRequest(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: any): boolean {
    if (!error.config) return false;
    if (!error.response) return true; // Network error
    if (error.response.status === 429) return true; // Rate limited
    if (error.response.status >= 500) return true; // Server error
    return false;
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest(config: any): Promise<any> {
    config.retryCount = config.retryCount || 0;
    config.retryCount += 1;

    if (config.retryCount > this.maxRetries) {
      throw new Error(`Max retries exceeded: ${config.url}`);
    }

    const delay = this.retryDelay * Math.pow(2, config.retryCount - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));

    return this.client(config);
  }

  /**
   * Set authorization header
   */
  protected setAuthHeader() {
    if (this.accessToken) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
    } else if (this.apiKey) {
      this.client.defaults.headers.common['X-API-Key'] = this.apiKey;
    }
  }

  /**
   * Fetch incoming messages
   */
  abstract fetchMessages(params?: any): Promise<any>;

  /**
   * Send message
   */
  abstract sendMessage(recipientId: string, message: string, mediaUrls?: string[]): Promise<any>;

  /**
   * Verify webhook
   */
  abstract verifyWebhook(signature: string, payload: any): boolean;

  /**
   * Parse webhook payload
   */
  abstract parseWebhookPayload(payload: any): any;
}
