import { Router, Request, Response } from 'express';
import { AnemiaRecord } from '../models/AnemiaRecord';
import { PPDRecord } from '../models/PPDRecord';
import { Alert } from '../models/Alert';
import { User } from '../models/User';

const router = Router();

// ─── GET /api/supervisor/ashas ─────────────────────────────────────────────────
router.get('/ashas', async (_req: Request, res: Response) => {
  try {
    const ashas = await User.find({ role: 'asha' }).select('-__v');
    return res.json(ashas);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// ─── GET /api/supervisor/alerts ────────────────────────────────────────────────
router.get('/alerts', async (_req: Request, res: Response) => {
  try {
    const alerts = await Alert.find({ status: 'active' }).sort({ timestamp: -1 }).limit(50);
    return res.json(alerts);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// ─── GET /api/supervisor/reports ───────────────────────────────────────────────
router.get('/reports', async (_req: Request, res: Response) => {
  try {
    const [anemiaCount, ppdCount, alertCount] = await Promise.all([
      AnemiaRecord.countDocuments(),
      PPDRecord.countDocuments(),
      Alert.countDocuments(),
    ]);
    return res.json({ anemia_records: anemiaCount, ppd_records: ppdCount, alerts: alertCount });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// ─── GET /api/supervisor/charts-data ──────────────────────────────────────────
// Returns daily counts over last 30 days for anemia and PPD screenings.
router.get('/charts-data', async (_req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyCountPipeline = (collection: 'anemia_records' | 'ppd_records') => [
      { $match: { timestamp: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 as const } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ];

    const [anemiaData, ppdData] = await Promise.all([
      AnemiaRecord.aggregate(dailyCountPipeline('anemia_records')),
      PPDRecord.aggregate(dailyCountPipeline('ppd_records')),
    ]);

    // Calculate PPD risk distribution
    const ppdRiskDist = await PPDRecord.aggregate([
      { $group: { _id: '$risk_level', count: { $sum: 1 } } },
      { $project: { _id: 0, risk_level: '$_id', count: 1 } },
    ]);

    return res.json({ anemia: anemiaData, ppd: ppdData, ppd_risk_distribution: ppdRiskDist });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

export default router;
