import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase } from '@config/database';
import routes from '@routes/index';
import { errorHandler, asyncHandler } from '@middleware/errorHandler';
import { rateLimit, cleanupOldRecords } from '@middleware/rateLimit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import diConfig from '@infrastructure/config/DependencyInjectionConfig';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Logger setup
const logger = pino();
const httpLogger = pinoHttp({ logger });

// Middleware
app.use(httpLogger);
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
app.use(rateLimit());
cleanupOldRecords();

// Routes
app.use('/api', routes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
    timestamp: new Date(),
  });
});

// Error handler
app.use(errorHandler);

// Initialize and start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Verify DI configuration is working properly
    console.log('✅ Dependency Injection configured successfully');
    console.log('✅ Message creation use case available:', !!diConfig.getCreateMessageUseCase());
    console.log('✅ Message retrieval use case available:', !!diConfig.getGetMessageHistoryUseCase());
    console.log('✅ Conversation management use case available:', !!diConfig.getGetConversationsUseCase());

    app.listen(PORT, () => {
      logger.info(`✅ NexusComm Gateway running on port ${PORT}`);
      console.log(`🚀 Server ready at http://localhost:${PORT}`);
      console.log(`📚 API docs at http://localhost:${PORT}/api/health`);
      console.log(`🔧 Architecture: Clean/Hexagonal with DDD principles`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
