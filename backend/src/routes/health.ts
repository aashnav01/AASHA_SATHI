import { Router, Request, Response } from 'express';

const router = Router();

// ─── GET /api/health ───────────────────────────────────────────────────────────
router.get('/', (_req: Request, res: Response) => {
  return res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'asha-sathi-api' });
});

export default router;
