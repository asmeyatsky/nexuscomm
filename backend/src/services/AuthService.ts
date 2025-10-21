import { AppDataSource } from '@config/database';
import { User } from '@models/User';
import { generateAccessToken, generateRefreshToken } from '@utils/jwt';
import { hashPassword, comparePassword, generateToken } from '@utils/encryption';
import { AppError } from '@middleware/errorHandler';
import { validate, registerSchema, loginSchema, isValidEmail } from '@utils/validators';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Register a new user
   */
  async register(data: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    // Validate input
    const { value, error } = await validate(data, registerSchema);

    if (error) {
      const messages = error.details.map((d: any) => d.message).join(', ');
      throw new AppError(400, messages, 'VALIDATION_ERROR');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email: value.email }, { username: value.username }],
    });

    if (existingUser) {
      throw new AppError(409, 'Email or username already exists', 'USER_EXISTS');
    }

    // Hash password
    const passwordHash = await hashPassword(value.password);

    // Create new user
    const user = this.userRepository.create({
      email: value.email,
      username: value.username,
      displayName: value.displayName,
      passwordHash,
      isEmailVerified: false,
      verificationToken: generateToken(),
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await this.userRepository.save(user);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  /**
   * Login user
   */
  async login(data: {
    email: string;
    password: string;
  }): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    // Validate input
    const { value, error } = await validate(data, loginSchema);

    if (error) {
      throw new AppError(400, 'Invalid email or password', 'VALIDATION_ERROR');
    }

    // Find user
    const user = await this.userRepository.findOne({
      where: { email: value.email },
      select: ['id', 'email', 'username', 'displayName', 'passwordHash', 'isEmailVerified', 'status'],
    });

    if (!user || !(await comparePassword(value.password, user.passwordHash))) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (user.status === 'suspended') {
      throw new AppError(403, 'Account is suspended', 'ACCOUNT_SUSPENDED');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['accounts', 'identityFilters'],
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      profilePicture?: string;
    }
  ): Promise<User> {
    const user = await this.getUserById(userId);

    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    if (data.displayName) user.displayName = data.displayName;
    if (data.profilePicture) user.profilePicture = data.profilePicture;

    return this.userRepository.save(user);
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new AppError(400, 'Invalid verification token', 'INVALID_TOKEN');
    }

    if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
      throw new AppError(400, 'Verification token expired', 'TOKEN_EXPIRED');
    }

    user.isEmailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;

    return this.userRepository.save(user);
  }
}
