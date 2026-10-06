import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/database.ts';
import authRoutes from './routes/authRoutes.ts';
import customerRoutes from './routes/customerRoutes.ts';
import productRoutes from './routes/productRoutes.ts';
import transactionRoutes from './routes/transactionRoutes.ts';
import notificationRoutes from './routes/notificationRoutes.ts';
import reportRoutes from './routes/reportRoutes.ts';
import auditLogRoutes from './routes/auditLogRoutes.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import { authRateLimiter, apiRateLimiter } from './middleware/rateLimiter.ts';

dotenv.config();

const app = express();

// Enable CORS for cross-origin and Vercel deployments
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Prevent browser/proxy stale caching
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
});

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure database connection for API routes
app.use('/api', async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Health check endpoint (both /api/health and /health)
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    system: 'CredEx Financial Ledger API',
  });
});

// Apply rate limiting
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);
app.use('/api', apiRateLimiter);

// REST API routes - Mounted on both /api/* and /* so Vercel rewrites work regardless of path prefix
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/customers', '/customers'], customerRoutes);
app.use(['/api/products', '/products'], productRoutes);
app.use(['/api/transactions', '/transactions'], transactionRoutes);
app.use(['/api/notifications', '/notifications'], notificationRoutes);
app.use(['/api/reports', '/reports'], reportRoutes);
app.use(['/api/audit-logs', '/audit-logs'], auditLogRoutes);

// Centralized Express Error Handler
app.use(errorHandler);

export default app;
export { app };
