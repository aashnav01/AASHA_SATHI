import { Router, Request, Response } from 'express';
import { IncentiveLog } from '../models/IncentiveLog';
import incentiveRates from '../data/incentive-rates.json';

const router = Router();

/**
 * POST /api/incentive/log
 * Log a completed task for an ASHA worker
 * Supports offline-first: clientId used for sync deduplication
 */
router.post('/log', async (req: Request, res: Response) => {
  try {
    const {
      asha_id,
      task_id,
      task_name,
      category,
      date_completed,
      clientId,
      clientTimestamp,
    } = req.body;

    // Validate required fields
    if (!asha_id || !task_id || !task_name || !category || !date_completed) {
      return res.status(400).json({
        error: 'Missing required fields: asha_id, task_id, task_name, category, date_completed'
      });
    }

    // Look up incentive amount from rates table
    const taskRate = incentiveRates.tasks.find(t => t.id === task_id);
    const amount_earned = taskRate?.amount ?? 0;

    // Create incentive log entry
    const incentiveLog = new IncentiveLog({
      asha_id,
      task_id,
      task_name,
      category,
      amount_earned,
      status: 'pending',
      date_completed: new Date(date_completed),
      clientId,
      clientTimestamp,
    });

    const saved = await incentiveLog.save();

    return res.status(201).json({
      success: true,
      message: 'Incentive logged successfully',
      data: {
        id: saved._id,
        amount_earned: saved.amount_earned,
        status: saved.status,
        task_id: saved.task_id,
      }
    });
  } catch (error: any) {
    console.error('Error logging incentive:', error);

    if (error.code === 11000 && error.keyPattern?.clientId) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate entry (already synced)',
        isDuplicate: true
      });
    }

    return res.status(500).json({
      error: 'Failed to log incentive',
      details: error.message
    });
  }
});

/**
 * GET /api/incentive/earnings
 * Get earnings summary for an ASHA worker
 */
router.get('/earnings', async (req: Request, res: Response) => {
  try {
    const { asha_id } = req.query;

    if (!asha_id) {
      return res.status(400).json({ error: 'Missing required parameter: asha_id' });
    }

    // Fetch all incentive logs for this ASHA
    const logs = await IncentiveLog.find({ asha_id }).sort({ date_completed: -1 });

    // Calculate totals by status
    const summary: Record<string, number | { count: number; amount: number }> = {
      total_earned: 0,
      pending: { count: 0, amount: 0 },
      submitted: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
    };

    logs.forEach(log => {
      (summary.total_earned as number) += log.amount_earned;
      const bucket = summary[log.status] as { count: number; amount: number };
      if (bucket) {
        bucket.count += 1;
        bucket.amount += log.amount_earned;
      }
    });

    // Breakdown by task_id
    const byTask: Record<string, { count: number; amount: number }> = {};
    logs.forEach(log => {
      if (!byTask[log.task_id]) {
        byTask[log.task_id] = { count: 0, amount: 0 };
      }
      byTask[log.task_id].count += 1;
      byTask[log.task_id].amount += log.amount_earned;
    });

    return res.json({
      success: true,
      asha_id,
      summary,
      by_task: byTask,
      recent_logs: logs.slice(0, 10).map(log => ({
        id: log._id,
        task_id: log.task_id,
        task_name: log.task_name,
        category: log.category,
        amount: log.amount_earned,
        status: log.status,
        date: log.date_completed,
      }))
    });
  } catch (error: any) {
    console.error('Error fetching earnings:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch earnings',
      details: error.message 
    });
  }
});

/**
 * GET /api/incentive/rates
 * Get rate lookup table for all task types
 * Can be cached on client side (rarely changes)
 */
router.get('/rates', async (req: Request, res: Response) => {
  try {
    // Return rate lookup table
    const rates: Record<string, number> = {};
    incentiveRates.tasks.forEach(task => {
      rates[task.id] = task.amount;
    });

    return res.json({
      success: true,
      version: incentiveRates.version,
      rates,
      allTasks: incentiveRates.tasks.map(t => ({
        id: t.id,
        description: t.description,
        hindi_description: t.hindi_description,
        category: t.category,
        amount: t.amount,
      }))
    });
  } catch (error: any) {
    return res.status(500).json({ 
      error: 'Failed to fetch rates',
      details: error.message 
    });
  }
});

/**
 * POST /api/incentive/dispute
 * Flag a delayed or missing payment
 */
router.post('/dispute', async (req: Request, res: Response) => {
  try {
    const { incentive_log_id, dispute_reason } = req.body;

    if (!incentive_log_id || !dispute_reason) {
      return res.status(400).json({ 
        error: 'Missing fields: incentive_log_id, dispute_reason' 
      });
    }

    // Find and update the incentive log with dispute
    const updated = await IncentiveLog.findByIdAndUpdate(
      incentive_log_id,
      { dispute_reason },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Incentive log not found' });
    }

    return res.json({
      success: true,
      message: 'Dispute flagged successfully',
      dispute_reason,
      status: updated.status
    });
  } catch (error: any) {
    console.error('Error flagging dispute:', error);
    return res.status(500).json({ 
      error: 'Failed to flag dispute',
      details: error.message 
    });
  }
});

/**
 * GET /api/incentive/rates/:taskType
 * Get rate for a specific task type
 */
router.get('/rates/:taskType', async (req: Request, res: Response) => {
  try {
    const { taskType } = req.params;
    const taskRate = incentiveRates.tasks.find(t => t.id === taskType);

    if (!taskRate) {
      return res.status(404).json({ 
        error: `No rate found for task type: ${taskType}` 
      });
    }

    return res.json({
      success: true,
      task_type: taskType,
      amount: taskRate.amount,
      description: taskRate.description,
      hindi_description: taskRate.hindi_description,
      category: taskRate.category,
    });
  } catch (error: any) {
    return res.status(500).json({ 
      error: 'Failed to fetch rate',
      details: error.message 
    });
  }
});

export default router;
