import { Types } from 'mongoose';
import { User } from './models/User';
import { createDemoAsha, createSampleTasks, MOBILE_RE, PIN_RE } from './seedData';

/**
 * Optional one-shot seeding at startup, for hosts with no shell access (a free
 * Render instance cannot run `npm run seed`).
 *
 * Deliberately constrained:
 *  - off unless SEED_ON_START=true
 *  - only runs when the database has no users, so it cannot touch real data
 *  - credentials come from the environment; there is no default, so a working
 *    login is never published in the repository
 *  - failures are logged but do not stop the server, since seeding is
 *    auxiliary to serving the app
 */
export async function maybeSeedOnStart(): Promise<void> {
  if (process.env.SEED_ON_START !== 'true') return;

  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`[seed] SEED_ON_START set but the database already has ${userCount} user(s) - skipping.`);
      return;
    }

    const name = process.env.SEED_NAME?.trim() || 'Demo ASHA';
    const mobile = process.env.SEED_MOBILE?.trim();
    const pin = process.env.SEED_PIN?.trim();

    if (!mobile || !pin) {
      console.error('[seed] SEED_ON_START=true but SEED_MOBILE and SEED_PIN are not set. Skipping.');
      return;
    }
    if (!MOBILE_RE.test(mobile)) {
      console.error('[seed] SEED_MOBILE must be a 10-digit number starting 6-9. Skipping.');
      return;
    }
    if (!PIN_RE.test(pin)) {
      console.error('[seed] SEED_PIN must be 4-6 digits. Skipping.');
      return;
    }

    const ashaId = new Types.ObjectId();
    const created = await createDemoAsha({ id: ashaId, name, mobile, pin });
    if (!created) {
      console.log('[seed] Account already present - skipping.');
      return;
    }
    await createSampleTasks(ashaId);

    // The PIN is intentionally not logged.
    console.log(`[seed] Created the demo account for mobile ${mobile} with sample tasks.`);
    console.log('[seed] Unset SEED_ON_START now that the database is seeded.');
  } catch (error) {
    console.error('[seed] Boot-time seeding failed (continuing to serve):', (error as Error).message);
  }
}
