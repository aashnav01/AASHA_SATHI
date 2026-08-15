import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './db';

// Routes
import authRouter from './routes/auth';
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
// Comma-separated so a deployment can serve both its hosted frontend and a
// local dev frontend without a rebuild.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header means a non-browser client (curl, health check).
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
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
  if (!process.env.JWT_SECRET) {
    console.error('[server] JWT_SECRET is not set. Copy backend/.env.example to backend/.env and set it before starting.');
    process.exit(1);
  }
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
