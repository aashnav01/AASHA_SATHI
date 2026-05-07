import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'asha_sathi';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`);
    console.log('[DB] Connected to MongoDB:', DB_NAME);
  } catch (error) {
    console.error('[DB] Connection failed:', error);
    process.exit(1);
  }
}

export default mongoose;
