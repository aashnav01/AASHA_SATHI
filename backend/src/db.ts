import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'asha_sathi';

export async function connectDB(): Promise<void> {
  try {
    // Pass the database as an option rather than appending it to the URI: a
    // hosted URI (Atlas) ends in a query string, so string concatenation would
    // fold the name into the last option value instead of selecting the db.
    await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
    console.log('[DB] Connected to MongoDB:', DB_NAME);
  } catch (error) {
    console.error('[DB] Connection failed:', error);
    process.exit(1);
  }
}

export default mongoose;
