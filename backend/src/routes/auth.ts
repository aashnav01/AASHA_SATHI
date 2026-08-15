import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { requireAuth, signToken } from '../middleware/auth';

const router = Router();

const MOBILE_RE = /^[6-9]\d{9}$/;
const PIN_RE = /^\d{4,6}$/;

function publicUser(u: { _id: unknown; name: string; mobile: string; role: string }) {
  return { id: u._id, name: u.name, mobile: u.mobile, role: u.role };
}

// ─── POST /api/auth/register ───────────────────────────────────────────────────
// Self-service signup for an ASHA worker: mobile number + PIN, no email/password.
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, mobile, pin } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!MOBILE_RE.test(mobile ?? '')) {
      return res.status(400).json({ error: 'Enter a valid 10-digit mobile number' });
    }
    if (!PIN_RE.test(pin ?? '')) {
      return res.status(400).json({ error: 'PIN must be 4-6 digits' });
    }

    const existing = await User.findOne({ mobile });
    if (existing) {
      return res.status(409).json({ error: 'An account with this mobile number already exists' });
    }

    const pin_hash = await bcrypt.hash(pin, 10);
    const user = await User.create({
      name: name.trim(),
      mobile,
      pin_hash,
      role: 'asha',
      emergency_contacts: [],
      supervisor_id: null,
    });

    const token = signToken({ ashaId: user._id.toString(), role: user.role });
    return res.status(201).json({ token, user: publicUser(user) });
  } catch (error: any) {
    console.error('[auth/register]', error);
    return res.status(500).json({ error: 'Failed to register' });
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { mobile, pin } = req.body;

    if (!MOBILE_RE.test(mobile ?? '') || !PIN_RE.test(pin ?? '')) {
      return res.status(400).json({ error: 'Invalid mobile number or PIN' });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(401).json({ error: 'Invalid mobile number or PIN' });
    }

    const valid = await bcrypt.compare(pin, user.pin_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid mobile number or PIN' });
    }

    const token = signToken({ ashaId: user._id.toString(), role: user.role });
    return res.json({ token, user: publicUser(user) });
  } catch (error: any) {
    console.error('[auth/login]', error);
    return res.status(500).json({ error: 'Failed to log in' });
  }
});

// ─── GET /api/auth/me ───────────────────────────────────────────────────────────
// Lets the app validate a stored token on startup and refresh the displayed profile.
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.ashaId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: publicUser(user) });
  } catch (error: any) {
    console.error('[auth/me]', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
