import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { checkDatabaseConnection, getDatabaseInfo } from './utils/neon';
import routes from './routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Wallet App API v2.0' });
});

app.use('/api', routes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong!'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'RESOURCE_NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Only start the server if this file is run directly (not imported for testing)
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Check database connection
    const isConnected = await checkDatabaseConnection();
    if (isConnected) {
      console.log('✅ Database connected successfully');
      const dbInfo = await getDatabaseInfo();
      if (dbInfo) {
        console.log(`📊 Database: ${dbInfo.database_name} (${dbInfo.user_name})`);
      }
    } else {
      console.log('❌ Database connection failed');
    }
  });
}

export default app;