import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './db';

// Routes
import ashaRouter from './routes/asha';
import syncRouter from './routes/sync';
import supervisorRouter from './routes/supervisor';
import symptomCheckRouter from './routes/symptomCheck';
import pregnancyRiskRouter from './routes/pregnancyRisk';
import healthRouter from './routes/health';
import educationRouter from './routes/education';
import ppdAnalysisRouter from './routes/ppdAnalysis';
import incentiveRouter from './routes/incentive';
import referralRouter from './routes/referral';

const app = express();
const PORT = process.env.PORT ?? 8000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173';

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/asha', ashaRouter);
app.use('/api/sync', syncRouter);
app.use('/api/supervisor', supervisorRouter);
app.use('/api/symptom-check', symptomCheckRouter);
app.use('/api/pregnancy-risk', pregnancyRiskRouter);
app.use('/api/education', educationRouter);
app.use('/api/ppd-analysis', ppdAnalysisRouter);
app.use('/api/incentive', incentiveRouter);
app.use('/api/referral', referralRouter);

// Root / legacy compatibility
app.get('/', (_req, res) => {
  res.json({ message: 'ASHA Sathi API (Node.js)', status: 'healthy', version: '2.0.0' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[server] ASHA Sathi API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});

export default app;
