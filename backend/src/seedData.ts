import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User';
import { Task } from './models/Task';

// Shared by the `npm run seed` script and the optional boot-time seeding, so
// the two cannot drift apart.

export const DEMO_ASHA_ID = new Types.ObjectId('65f1a2b3c4d5e6f7a8b9c0d1');

export const MOBILE_RE = /^[6-9]\d{9}$/;
export const PIN_RE = /^\d{4,6}$/;

export interface DemoAshaInput {
  id?: Types.ObjectId;
  name: string;
  mobile: string;
  pin: string;
}

/** Creates the demo ASHA account. Returns false if it already existed. */
export async function createDemoAsha(input: DemoAshaInput): Promise<boolean> {
  const id = input.id ?? DEMO_ASHA_ID;

  // Match on either the id or the mobile: the account is unique by mobile, so
  // seeding a different id with a taken number would fail on the index.
  const existing = await User.findOne({ $or: [{ _id: id }, { mobile: input.mobile }] });
  if (existing) return false;

  const pin_hash = await bcrypt.hash(input.pin, 10);
  await User.collection.insertOne({
    _id: id,
    name: input.name,
    mobile: input.mobile,
    pin_hash,
    role: 'asha',
    emergency_contacts: [{ name: 'Family Member', phone: '9999999999' }],
    supervisor_id: null,
  });
  return true;
}

/** Adds the sample workload. Returns false if the account already has tasks. */
export async function createSampleTasks(ashaId: Types.ObjectId): Promise<boolean> {
  const count = await Task.countDocuments({ asha_id: ashaId });
  if (count > 0) return false;

  const now = new Date();
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

  const sampleTasks = [
    { title: 'Follow-up visit for Mrs. Sharma (anemia)', priority: 'high', due_date: addDays(now, 1) },
    { title: 'Immunization camp at PHC', priority: 'medium', due_date: addDays(now, 3) },
    { title: 'Submit monthly report', priority: 'medium', due_date: addDays(now, 5) },
    { title: 'Attend training on maternal health', priority: 'low', due_date: addDays(now, 10) },
  ];

  for (const t of sampleTasks) {
    await Task.create({ ...t, asha_id: ashaId, completed: false, is_recurring: false, created_at: now });
  }
  return true;
}
