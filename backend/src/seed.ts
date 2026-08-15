import dotenv from 'dotenv';
dotenv.config();

import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './db';
import { User } from './models/User';
import { Task } from './models/Task';

const TEST_ASHA_ID = new Types.ObjectId('65f1a2b3c4d5e6f7a8b9c0d1');
const DEMO_MOBILE = '9876543210';
const DEMO_PIN = '1234';

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

async function seedTestAsha() {
  const existing = await User.findById(TEST_ASHA_ID);
  if (!existing) {
    const pin_hash = await bcrypt.hash(DEMO_PIN, 10);
    await User.collection.insertOne({
      _id: TEST_ASHA_ID,
      name: 'Test ASHA',
      mobile: DEMO_MOBILE,
      pin_hash,
      role: 'asha',
      emergency_contacts: [{ name: 'Family Member', phone: '9999999999' }],
      supervisor_id: null,
    });
    console.log(`[seed] Test ASHA user created — log in with mobile ${DEMO_MOBILE} / PIN ${DEMO_PIN}`);
  } else {
    console.log('[seed] Test ASHA user already exists');
  }
}

async function seedSampleTasks() {
  const count = await Task.countDocuments({ asha_id: TEST_ASHA_ID });
  if (count > 0) {
    console.log('[seed] Sample tasks already exist, skipping');
    return;
  }

  const now = new Date();
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

  const sampleTasks = [
    { title: 'Follow-up visit for Mrs. Sharma (anemia)', priority: 'high', due_date: addDays(now, 1) },
    { title: 'Immunization camp at PHC', priority: 'medium', due_date: addDays(now, 3) },
    { title: 'Submit monthly report', priority: 'medium', due_date: addDays(now, 5) },
    { title: 'Attend training on maternal health', priority: 'low', due_date: addDays(now, 10) },
  ];

  for (const t of sampleTasks) {
    await Task.create({
      ...t,
      asha_id: TEST_ASHA_ID,
      completed: false,
      is_recurring: false,
      created_at: now,
    });
  }
  console.log('[seed] Sample tasks seeded');
}

async function main() {
  await connectDB();
  await ensureSupervisorIdObjectId();
  await seedTestAsha();
  await seedSampleTasks();
  console.log('[seed] Done');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[seed] Error:', err);
  process.exit(1);
});
