import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'asha_sathi';

// Explains the failure modes the raw driver error buries under a large
// TopologyDescription dump.
function explain(error: unknown): string | undefined {
  const err = error as { message?: string; reason?: { type?: string } };
  const topologyType = err?.reason?.type;
  const message = err?.message ?? '';

  // 'Unknown' is the single-node equivalent: reached nothing at all.
  if (topologyType === 'ReplicaSetNoPrimary' || topologyType === 'Unknown') {
    return [
      'Resolved the cluster address but could not complete a connection to any node.',
      'Most likely causes, in order:',
      '  1. This host\'s IP is not in the Atlas allow-list. Render\'s outbound IPs are',
      '     not fixed on the free plan, so add 0.0.0.0/0 under Atlas > Network Access.',
      '  2. The cluster is paused. Free M0 clusters auto-pause when idle - resume it',
      '     under Atlas > Database.',
    ].join('\n');
  }
  if (message.includes('ENOTFOUND') || message.includes('querySrv')) {
    return 'The hostname in MONGODB_URI could not be resolved. Check the URI for typos.';
  }
  if (message.includes('Authentication failed') || message.includes('bad auth')) {
    return [
      'The cluster was reached but the credentials were rejected.',
      'Check the username/password in MONGODB_URI. A password containing @ : / or ?',
      'must be percent-encoded.',
    ].join('\n');
  }
  return undefined;
}

export async function connectDB(): Promise<void> {
  try {
    // Pass the database as an option rather than appending it to the URI: a
    // hosted URI (Atlas) ends in a query string, so string concatenation would
    // fold the name into the last option value instead of selecting the db.
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
      // The 30s default makes a misconfigured deploy look like a hang.
      serverSelectionTimeoutMS: 10000,
    });
    console.log('[DB] Connected to MongoDB:', DB_NAME);
  } catch (error) {
    const hint = explain(error);
    if (hint) {
      console.error('\n[DB] Could not connect to MongoDB.\n');
      console.error(hint);
      console.error('\nUnderlying error:', (error as Error).message, '\n');
    } else {
      console.error('[DB] Connection failed:', error);
    }
    process.exit(1);
  }
}

export default mongoose;
