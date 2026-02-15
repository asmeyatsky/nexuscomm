import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

// Support both legacy config and Neon DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl, // Neon connection string
  host: !databaseUrl ? (process.env.DB_HOST || 'localhost') : undefined,
  port: !databaseUrl ? parseInt(process.env.DB_PORT || '5432') : undefined,
  username: !databaseUrl ? (process.env.DB_USER || 'nexuscomm') : undefined,
  password: !databaseUrl ? (process.env.DB_PASSWORD || 'password') : undefined,
  database: !databaseUrl ? (process.env.DB_NAME || 'nexuscomm_db') : undefined,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: ['src/models/**/*.ts'],
  migrations: ['src/database/migrations/**/*.ts'],
  subscribers: ['src/database/subscribers/**/*.ts'],
  poolSize: 10,
  maxQueryExecutionTime: 30000,
  ssl: databaseUrl ? { rejectUnauthorized: false } : undefined,
});

export async function initializeDatabase() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connection established');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}
