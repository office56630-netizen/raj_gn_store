import app from '../server.ts';
import { connectDB } from '../config/database.ts';

export default async function handler(req: any, res: any) {
  try {
    await connectDB();
  } catch (err: any) {
    console.error('Database connection error in Vercel serverless handler:', err?.message || err);
  }
  return app(req, res);
}
