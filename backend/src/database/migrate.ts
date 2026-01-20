import { DataSource } from 'typeorm';
import { User } from '../models/User.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { MessageAnalysisResult } from '../models/MessageAnalysisResult.js';
import { UserAIQuota } from '../models/UserAIQuota.js';
import { AIUsageLog } from '../models/AIUsageLog.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'nexuscomm',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nexuscomm_db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    Conversation,
    Message,
    MessageAnalysisResult,
    UserAIQuota,
    AIUsageLog,
  ],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: ['src/database/subscribers/*.ts'],
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established successfully');
    
    // Run migrations in production
    if (process.env.NODE_ENV === 'production') {
      await AppDataSource.runMigrations();
      console.log('✅ Database migrations completed');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const closeDatabase = async () => {
  await AppDataSource.destroy();
  console.log('✅ Database connection closed');
};