import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { User } from '../models/User';
import { Alert } from '../models/Alert';
import { Task } from '../models/Task';
import twilio from 'twilio';

const router = Router();

// Fixed test ASHA ID – same as the Python app
export const TEST_ASHA_ID = new Types.ObjectId('65f1a2b3c4d5e6f7a8b9c0d1');

// ─── Real/Mock SMS ─────────────────────────────────────────────────────────────────
async function sendSms(phone: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

  if (accountSid && authToken && twilioNumber) {
    try {
      const client = twilio(accountSid, authToken);
      const result = await client.messages.create({
        body: message,
        from: twilioNumber,
        to: phone
      });
      console.log(`[TWILIO SMS] Sent to ${phone}, SID: ${result.sid}`);
      return { success: true, mock: false, phone, sid: result.sid };
    } catch (err) {
      console.error(`[TWILIO SMS ERROR] Failed to send to ${phone}`, err);
      return { success: false, mock: false, phone, error: (err as Error).message };
    }
  } else {
    console.log(`[MOCK SMS] To: ${phone}, Msg: ${message.slice(0, 100)}...`);
    return { success: true, mock: true, phone };
  }
}

// ─── POST /api/asha/panic ──────────────────────────────────────────────────────
router.post('/panic', async (req: Request, res: Response) => {
  try {
    const location: { lat: number; lng: number } = req.body;
    const asha = await User.findById(TEST_ASHA_ID);
    if (!asha) return res.status(404).json({ error: 'ASHA user not found' });

    const mapsUrl = `https://maps.google.com/?q=${location.lat},${location.lng}`;
    const now = new Date();
    const alertText = `🚨 ASHA SATHI ALERT 🚨 ${asha.name} activated panic button! Location: ${mapsUrl} Time: ${now.toTimeString().slice(0, 5)} ${now.toLocaleDateString('en-IN')}`;

    const results: object[] = [];

    // Emergency contacts
    for (const contact of asha.emergency_contacts ?? []) {
      if (contact.phone) {
        const result = await sendSms(contact.phone, alertText);
        results.push({ type: 'emergency', name: contact.name, result });
      }
    }

    // Supervisor (if any)
    if (asha.supervisor_id) {
      const supervisor = await User.findById(asha.supervisor_id);
      if (supervisor?.mobile) {
        const result = await sendSms(supervisor.mobile, alertText);
        results.push({ type: 'supervisor', name: supervisor.name, result });
      }
    }

    // Log alert to DB
    await Alert.create({
      asha_id: TEST_ASHA_ID,
      location,
      timestamp: now,
      status: 'active',
      notified_recipients: results.length,
    });

    return res.json({ status: 'alert_triggered', alerts_sent: results.length, details: results });
  } catch (err) {
    console.error('[panic]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/asha/tasks ───────────────────────────────────────────────────────
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const showCompleted = req.query.show_completed === 'true';
    const filter: Record<string, unknown> = { asha_id: TEST_ASHA_ID };
    if (!showCompleted) filter.completed = false;

    const tasks = await Task.find(filter).sort({ due_date: 1 }).limit(100);
    const mapped = tasks.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      description: t.description,
      due_date: t.due_date,
      priority: t.priority,
      completed: t.completed,
      location: t.location,
      is_recurring: t.is_recurring,
    }));
    return res.json(mapped);
  } catch (err) {
    console.error('[get-tasks]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/asha/tasks ──────────────────────────────────────────────────────
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const { title, description, due_date, priority, location, is_recurring } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    // Auto-prioritize: if high-risk keyword in title → bump to high
    const autoHighRiskKeywords = ['anemia', 'high risk', 'pregnancy', 'urgent', 'referral'];
    const effectivePriority: string =
      priority ||
      (autoHighRiskKeywords.some((kw) => (title as string).toLowerCase().includes(kw))
        ? 'high'
        : 'medium');

    const task = await Task.create({
      asha_id: TEST_ASHA_ID,
      title,
      description: description || undefined,
      due_date: due_date ? new Date(due_date) : undefined,
      location: location || undefined,
      priority: effectivePriority,
      is_recurring: is_recurring ?? false,
    });

    return res.status(201).json({
      id: task._id.toString(),
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      location: task.location,
      priority: task.priority,
      completed: task.completed,
      is_recurring: task.is_recurring,
    });
  } catch (err) {
    console.error('[create-task]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/asha/tasks/:id ─────────────────────────────────────────────────
router.patch('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await Task.updateOne(
      { _id: new Types.ObjectId(id), asha_id: TEST_ASHA_ID },
      { $set: { completed: true } },
    );
    if (result.modifiedCount === 0) return res.status(404).json({ error: 'Task not found' });
    return res.json({ message: 'Task completed' });
  } catch (err) {
    console.error('[complete-task]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
