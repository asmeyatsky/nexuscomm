import { AppDataSource } from '@config/database';
import { Account, ChannelType } from '@models/Account';
import { User } from '@models/User';
import { encrypt, decrypt } from '@utils/encryption';
import { AppError } from '@middleware/errorHandler';

export class AccountService {
  private accountRepository = AppDataSource.getRepository(Account);
  private userRepository = AppDataSource.getRepository(User);
  private encryptionKey = process.env.ENCRYPTION_SECRET || 'default_secret_key';

  /**
   * Add a new account for a user
   */
  async addAccount(
    userId: string,
    data: {
      channelType: ChannelType;
      identifier: string;
      displayName: string;
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: Date;
      metadata?: Record<string, any>;
    }
  ): Promise<Account> {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Check if account already exists
    const existing = await this.accountRepository.findOne({
      where: {
        userId,
        channelType: data.channelType,
        identifier: data.identifier,
      },
    });

    if (existing) {
      throw new AppError(409, 'Account already exists', 'ACCOUNT_EXISTS');
    }

    // Encrypt tokens
    let encryptedAccessToken = data.accessToken;
    let encryptedRefreshToken = data.refreshToken;

    if (encryptedAccessToken) {
      encryptedAccessToken = encrypt(encryptedAccessToken, this.encryptionKey);
    }
    if (encryptedRefreshToken) {
      encryptedRefreshToken = encrypt(encryptedRefreshToken, this.encryptionKey);
    }

    const account = this.accountRepository.create({
      userId,
      channelType: data.channelType,
      identifier: data.identifier,
      displayName: data.displayName,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiresAt: data.expiresAt,
      metadata: data.metadata || {},
      syncStatus: 0,
    });

    return this.accountRepository.save(account);
  }

  /**
   * Get user's accounts
   */
  async getUserAccounts(userId: string): Promise<Account[]> {
    return this.accountRepository.find({
      where: { userId, isActive: true },
    });
  }

  /**
   * Get account by ID (with decrypted tokens)
   */
  async getAccountById(accountId: string, userId: string): Promise<Account | null> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, userId },
      select: [
        'id',
        'userId',
        'channelType',
        'identifier',
        'displayName',
        'isActive',
        'accessToken',
        'refreshToken',
        'tokenExpiresAt',
        'metadata',
        'syncStatus',
        'lastSyncedAt',
        'connectedAt',
        'updatedAt',
      ],
    });

    if (!account) return null;

    // Decrypt tokens
    if (account.accessToken) {
      try {
        account.accessToken = decrypt(account.accessToken, this.encryptionKey);
      } catch (error) {
        console.error('Failed to decrypt access token:', error);
      }
    }
    if (account.refreshToken) {
      try {
        account.refreshToken = decrypt(account.refreshToken, this.encryptionKey);
      } catch (error) {
        console.error('Failed to decrypt refresh token:', error);
      }
    }

    return account;
  }

  /**
   * Update account tokens
   */
  async updateAccountTokens(
    accountId: string,
    userId: string,
    tokens: { accessToken?: string; refreshToken?: string; expiresAt?: Date }
  ): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new AppError(404, 'Account not found', 'ACCOUNT_NOT_FOUND');
    }

    if (tokens.accessToken) {
      account.accessToken = encrypt(tokens.accessToken, this.encryptionKey);
    }
    if (tokens.refreshToken) {
      account.refreshToken = encrypt(tokens.refreshToken, this.encryptionKey);
    }
    if (tokens.expiresAt) {
      account.tokenExpiresAt = tokens.expiresAt;
    }

    return this.accountRepository.save(account);
  }

  /**
   * Disconnect account
   */
  async disconnectAccount(accountId: string, userId: string): Promise<void> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new AppError(404, 'Account not found', 'ACCOUNT_NOT_FOUND');
    }

    account.isActive = false;
    await this.accountRepository.save(account);
  }

  /**
   * Update sync status
   */
  async updateSyncStatus(
    accountId: string,
    status: number,
    userId: string
  ): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new AppError(404, 'Account not found', 'ACCOUNT_NOT_FOUND');
    }

    account.syncStatus = status;
    account.lastSyncedAt = new Date();

    return this.accountRepository.save(account);
  }
}
