import { Router, Request, Response } from 'express';
import { MongoServerError } from 'mongodb';
import { AnemiaRecord } from '../models/AnemiaRecord';
import { PPDRecord } from '../models/PPDRecord';
import { Alert } from '../models/Alert';
import { Referral } from '../models/Referral';
import { IncentiveLog } from '../models/IncentiveLog';
import { WellnessCheckin } from '../models/WellnessCheckin';
import { TaskCompletion } from '../models/TaskCompletion';
import { TEST_ASHA_ID } from './asha';

const router = Router();

// ─── POST /api/sync ────────────────────────────────────────────────────────────
// Accepts batches of anemia, ppd, alerts, referrals, incentives, wellness, taskCompletions.
// Gracefully handles duplicates via clientId sparse unique index (ordered:false ignores dup-key errors).
// CRITICAL: Verifies inserted counts before clearing Dexie tables.
router.post('/', async (req: Request, res: Response) => {
  const { anemia = [], ppd = [], alerts = [], referrals = [], incentives = [], wellness = [], taskCompletions = [] } = req.body;
  const inserted: Record<string, number> = { anemia: 0, ppd: 0, alerts: 0, referrals: 0, incentives: 0, wellness: 0, taskCompletions: 0 };
  const errors: string[] = [];
  const warnings: string[] = [];

  // ── Anemia ──
  if (anemia.length > 0) {
    try {
      const docs = anemia.map((r: Record<string, unknown>) => ({
        ...r,
        asha_id: TEST_ASHA_ID,
        timestamp: r.clientTimestamp ? new Date(r.clientTimestamp as string) : new Date(),
      }));
      const result = await AnemiaRecord.insertMany(docs, { ordered: false });
      inserted.anemia = result.length;
      
      // Verify inserted count matches batch size (some may have been rejected as duplicates)
      if (inserted.anemia < anemia.length) {
        warnings.push(`Anemia: ${anemia.length} records sent, ${inserted.anemia} inserted (${anemia.length - inserted.anemia} duplicates skipped)`);
      }
    } catch (err) {
      if (err instanceof MongoServerError && err.code === 11000) {
        // Some duplicates skipped – count successful ones
        const writeResult = (err as unknown as { result?: { insertedCount?: number } }).result;
        inserted.anemia = writeResult?.insertedCount ?? 0;
        if (inserted.anemia === 0 && anemia.length > 0) {
          warnings.push(`Anemia: All ${anemia.length} records were duplicates`);
        }
      } else {
        errors.push(`Anemia insertion failed: ${String(err)}`);
      }
    }
  }

  // ── PPD ──
  if (ppd.length > 0) {
    try {
      const docs = ppd.map((r: Record<string, unknown>) => ({
        ...r,
        asha_id: TEST_ASHA_ID,
        timestamp: r.clientTimestamp ? new Date(r.clientTimestamp as string) : new Date(),
      }));
      const result = await PPDRecord.insertMany(docs, { ordered: false });
      inserted.ppd = result.length;
      
      if (inserted.ppd < ppd.length) {
        warnings.push(`PPD: ${ppd.length} records sent, ${inserted.ppd} inserted (${ppd.length - inserted.ppd} duplicates skipped)`);
      }
    } catch (err) {
      if (err instanceof MongoServerError && err.code === 11000) {
        const writeResult = (err as unknown as { result?: { insertedCount?: number } }).result;
        inserted.ppd = writeResult?.insertedCount ?? 0;
        if (inserted.ppd === 0 && ppd.length > 0) {
          warnings.push(`PPD: All ${ppd.length} records were duplicates`);
        }
      } else {
        errors.push(`PPD insertion failed: ${String(err)}`);
      }
    }
  }

  // ── Alerts ──
  if (alerts.length > 0) {
    try {
      const docs = alerts.map((r: Record<string, unknown>) => ({
        ...r,
        asha_id: TEST_ASHA_ID,
        timestamp: r.clientTimestamp ? new Date(r.clientTimestamp as string) : new Date(),
      }));
      const result = await Alert.insertMany(docs, { ordered: false });
      inserted.alerts = result.length;
      
      if (inserted.alerts < alerts.length) {
        warnings.push(`Alerts: ${alerts.length} records sent, ${inserted.alerts} inserted (${alerts.length - inserted.alerts} duplicates skipped)`);
      }
    } catch (err) {
      if (err instanceof MongoServerError && err.code === 11000) {
        const writeResult = (err as unknown as { result?: { insertedCount?: number } }).result;
        inserted.alerts = writeResult?.insertedCount ?? 0;
        if (inserted.alerts === 0 && alerts.length > 0) {
          warnings.push(`Alerts: All ${alerts.length} records were duplicates`);
        }
      } else {
        errors.push(`Alerts insertion failed: ${String(err)}`);
      }
    }
  }

  // ── Referrals ──
  if (referrals.length > 0) {
    try {
      const docs = referrals.map((r: Record<string, unknown>) => ({
        ...r,
        asha_id: TEST_ASHA_ID,
        timestamp: r.clientTimestamp ? new Date(r.clientTimestamp as string) : new Date(),
      }));
      const result = await Referral.insertMany(docs, { ordered: false });
      inserted.referrals = result.length;
      
      if (inserted.referrals < referrals.length) {
        warnings.push(`Referrals: ${referrals.length} records sent, ${inserted.referrals} inserted (${referrals.length - inserted.referrals} duplicates skipped)`);
      }
    } catch (err) {
      if (err instanceof MongoServerError && err.code === 11000) {
        const writeResult = (err as unknown as { result?: { insertedCount?: number } }).result;
        inserted.referrals = writeResult?.insertedCount ?? 0;
        if (inserted.referrals === 0 && referrals.length > 0) {
          warnings.push(`Referrals: All ${referrals.length} records were duplicates`);
        }
      } else {
        errors.push(`Referrals insertion failed: ${String(err)}`);
      }
    }
  }

  // ── Incentives ──
  if (incentives.length > 0) {
    try {
      const docs = incentives.map((r: Record<string, unknown>) => ({
        ...r,
        asha_id: TEST_ASHA_ID,
        timestamp: r.clientTimestamp ? new Date(r.clientTimestamp as string) : new Date(),
      }));
      const result = await IncentiveLog.insertMany(docs, { ordered: false });
      inserted.incentives = result.length;
      
      if (inserted.incentives < incentives.length) {
        warnings.push(`Incentives: ${incentives.length} records sent, ${inserted.incentives} inserted (${incentives.length - inserted.incentives} duplicates skipped)`);
      }
    } catch (err) {
      if (err instanceof MongoServerError && err.code === 11000) {
        const writeResult = (err as unknown as { result?: { insertedCount?: number } }).result;
        inserted.incentives = writeResult?.insertedCount ?? 0;
        if (inserted.incentives === 0 && incentives.length > 0) {
          warnings.push(`Incentives: All ${incentives.length} records were duplicates`);
        }
      } else {
        errors.push(`Incentives insertion failed: ${String(err)}`);
      }
    }
  }

  // ── Wellness Check-ins ──
  if (wellness.length > 0) {
    try {
      const docs = wellness.map((r: Record<string, unknown>) => ({
        ...r,
        asha_id: TEST_ASHA_ID,
        timestamp: r.clientTimestamp ? new Date(r.clientTimestamp as string) : new Date(),
      }));
      const result = await WellnessCheckin.insertMany(docs, { ordered: false });
      inserted.wellness = result.length;
      
      if (inserted.wellness < wellness.length) {
        warnings.push(`Wellness: ${wellness.length} records sent, ${inserted.wellness} inserted (${wellness.length - inserted.wellness} duplicates skipped)`);
      }
    } catch (err) {
      if (err instanceof MongoServerError && err.code === 11000) {
        const writeResult = (err as unknown as { result?: { insertedCount?: number } }).result;
        inserted.wellness = writeResult?.insertedCount ?? 0;
        if (inserted.wellness === 0 && wellness.length > 0) {
          warnings.push(`Wellness: All ${wellness.length} records were duplicates`);
        }
      } else {
        errors.push(`Wellness insertion failed: ${String(err)}`);
      }
    }
  }

  // ── Task Completions ──
  if (taskCompletions.length > 0) {
    try {
      const docs = taskCompletions.map((r: Record<string, unknown>) => ({
        ...r,
        asha_id: TEST_ASHA_ID,
        timestamp: r.clientTimestamp ? new Date(r.clientTimestamp as string) : new Date(),
      }));
      const result = await TaskCompletion.insertMany(docs, { ordered: false });
      inserted.taskCompletions = result.length;
      
      if (inserted.taskCompletions < taskCompletions.length) {
        warnings.push(`TaskCompletions: ${taskCompletions.length} records sent, ${inserted.taskCompletions} inserted (${taskCompletions.length - inserted.taskCompletions} duplicates skipped)`);
      }
    } catch (err) {
      if (err instanceof MongoServerError && err.code === 11000) {
        const writeResult = (err as unknown as { result?: { insertedCount?: number } }).result;
        inserted.taskCompletions = writeResult?.insertedCount ?? 0;
        if (inserted.taskCompletions === 0 && taskCompletions.length > 0) {
          warnings.push(`TaskCompletions: All ${taskCompletions.length} records were duplicates`);
        }
      } else {
        errors.push(`TaskCompletions insertion failed: ${String(err)}`);
      }
    }
  }

  // Log warnings to console for monitoring
  if (warnings.length > 0) {
    console.warn('[SYNC] Warnings during batch insertion:', warnings);
  }

  return res.json({ inserted, errors, warnings, timestamp: new Date().toISOString() });
});

export default router;
