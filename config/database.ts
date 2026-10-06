import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected || mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }

  const mongoUri =
    process.env.MONGODB_URI ||
    'mongodb+srv://vraj56630_db_user:genralstore123@cluster0.f0iyuqc.mongodb.net/credex?retryWrites=true&w=majority&appName=Cluster0';

  if (mongoUri && mongoUri.trim() !== '') {
    try {
      console.log('Attempting connection to MongoDB Atlas...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      isConnected = true;
      console.log('Connected to MongoDB Atlas successfully.');
      await ensureAdminExists();
      return;
    } catch (err: any) {
      console.warn('MongoDB Atlas connection failed:', err.message);
      if (process.env.VERCEL) {
        console.error(
          'Notice for Vercel deployment: Please verify MONGODB_URI in Vercel Settings -> Environment Variables, and ensure MongoDB Atlas -> Network Access allows 0.0.0.0/0.'
        );
      }
      console.log('Attempting fallback to embedded MongoDB engine...');
    }
  }

  // Fallback to embedded MongoDB (local dev / Docker)
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log(`Embedded MongoDB started at: ${uri}`);
    await mongoose.connect(uri);
    isConnected = true;
    console.log('Connected to embedded MongoDB database.');

    await ensureAdminExists();
  } catch (error: any) {
    console.error('Fatal: Failed to initialize MongoDB:', error.message);
    throw new Error(
      `MongoDB connection failed. In Vercel, please set MONGODB_URI in Environment Variables and whitelist 0.0.0.0/0 in MongoDB Atlas Network Access. (${error.message})`
    );
  }
}

/**
 * Ensures administrators exist with clean state.
 */
async function ensureAdminExists() {
  try {
    const { User } = await import('../models/User.ts');
    const { AuditLog } = await import('../models/AuditLog.ts');

    // 1. Ensure primary admin
    let defaultAdmin = await User.findOne({ email: 'admin@example.com' });
    if (!defaultAdmin) {
      const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
      defaultAdmin = await User.create({
        name: 'दुकानदार एडमिन',
        email: 'admin@example.com',
        phone: '9876543210',
        password: adminPasswordHash,
        role: 'admin',
        status: 'active',
      });
    } else if (defaultAdmin.phone !== '9876543210') {
      defaultAdmin.phone = '9876543210';
      await defaultAdmin.save();
    }

    // 2. Ensure owner account for vraj56630@gmail.com
    const ownerEmail = 'vraj56630@gmail.com';
    let ownerAdmin = await User.findOne({ email: ownerEmail });
    if (!ownerAdmin) {
      const ownerPasswordHash = await bcrypt.hash('genralstore123', 10);
      await User.create({
        name: 'Vraj (Store Owner)',
        email: ownerEmail,
        phone: '9876500000',
        password: ownerPasswordHash,
        role: 'admin',
        status: 'active',
      });
    } else if (ownerAdmin.phone !== '9876500000') {
      ownerAdmin.phone = '9876500000';
      await ownerAdmin.save();
    }

    console.log('Administrators configured: admin@example.com & vraj56630@gmail.com');
  } catch (err) {
    console.error('Error ensuring admin user exists:', err);
  }
}
