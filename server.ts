import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Prevent browser/proxy stale caching in preview iframe
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
});

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
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

// REST API routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Centralized Express Error Handler
app.use(errorHandler);

async function startServer() {
  try {
    // 1. Connect to MongoDB (Embedded or Remote URI) and seed if empty
    await connectDB();

    // 2. Setup Vite dev middleware or serve production static build
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR !== 'true',
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('Vite middleware mounted in development mode.');
    } else {
      const distPath = path.resolve(__dirname, 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
      console.log(`Serving static files from ${distPath}`);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`CredEx Server running on port ${PORT} at http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Fatal: Failed to start CredEx server:', error);
    process.exit(1);
  }
}

startServer();
