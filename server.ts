import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import dotenv from 'dotenv';
import app from './app.ts';
import { connectDB } from './config/database.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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

// Only start listening if server.ts is executed directly as the main process
const isMain =
  process.argv[1] &&
  (fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
    process.argv[1].endsWith('server.ts'));

if (isMain && !process.env.VERCEL && !process.env.NOW_REGION) {
  startServer();
}

export default app;
export { app };
