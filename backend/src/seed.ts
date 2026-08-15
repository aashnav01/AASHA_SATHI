import dotenv from 'dotenv';
dotenv.config();

import mongoose, { Types } from 'mongoose';
import { connectDB } from './db';
import { User } from './models/User';
import { DEMO_ASHA_ID, createDemoAsha, createSampleTasks } from './seedData';

// Local development convenience. The deployed equivalent is SEED_ON_START,
// which takes its credentials from the environment instead - see bootstrapSeed.
const DEMO_NAME = process.env.SEED_NAME ?? 'Test ASHA';
const DEMO_MOBILE = process.env.SEED_MOBILE ?? '9876543210';
const DEMO_PIN = process.env.SEED_PIN ?? '1234';

// ─── Supervisor ID compatibility: convert any string supervisor_id to ObjectId ─
async function ensureSupervisorIdObjectId() {
  const usersWithStringSupId = await User.find({
    supervisor_id: { $type: 'string' },
  }).lean();

  if (usersWithStringSupId.length === 0) return;

  console.log(`[seed] Converting ${usersWithStringSupId.length} string supervisor_id(s) to ObjectId...`);
  for (const u of usersWithStringSupId) {
    try {
      const oid = new Types.ObjectId(u.supervisor_id as unknown as string);
      await User.updateOne({ _id: u._id }, { $set: { supervisor_id: oid } });
    } catch {
      // If invalid ObjectId string, just set to null
      await User.updateOne({ _id: u._id }, { $set: { supervisor_id: null } });
    }
  }
  console.log('[seed] supervisor_id migration complete');
}

async function main() {
  await connectDB();
  await ensureSupervisorIdObjectId();

  const created = await createDemoAsha({
    id: DEMO_ASHA_ID,
    name: DEMO_NAME,
    mobile: DEMO_MOBILE,
    pin: DEMO_PIN,
  });
  console.log(
    created
      ? `[seed] Test ASHA user created — log in with mobile ${DEMO_MOBILE}`
      : '[seed] Test ASHA user already exists',
  );

  const tasksCreated = await createSampleTasks(DEMO_ASHA_ID);
  console.log(tasksCreated ? '[seed] Sample tasks seeded' : '[seed] Sample tasks already exist, skipping');

  console.log('[seed] Done');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[seed] Error:', err);
  process.exit(1);
});
