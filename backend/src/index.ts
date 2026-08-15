import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import fs from 'fs';
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

// The built frontend, served from this same process so the browser talks to a
// single origin. Compiled layout is backend/dist/index.js, so the sibling
// frontend build sits two levels up.
const FRONTEND_DIST = path.resolve(__dirname, '../../frontend/dist');
const hasFrontendBuild = fs.existsSync(path.join(FRONTEND_DIST, 'index.html'));

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(
  helmet({
    // Defaults assume a JSON-only API. Now that this process also serves the
    // app's HTML, the policy has to permit what the UI actually loads:
    // YouTube lesson embeds and their thumbnails, and the inline styles React
    // and Recharts emit via style attributes.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://img.youtube.com', 'https://i.ytimg.com'],
        mediaSrc: ["'self'", 'data:', 'blob:'],
        frameSrc: ['https://www.youtube.com', 'https://www.youtube-nocookie.com'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    // Lets the YouTube iframe load rather than being blocked as cross-origin.
    crossOriginEmbedderPolicy: false,
  }),
);

// Same-origin deployments need no CORS at all. This stays only for the optional
// split setup, where the frontend is hosted separately and sets ALLOWED_ORIGIN
// (comma-separated for multiple origins).
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

if (ALLOWED_ORIGINS.length > 0) {
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
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API routes ───────────────────────────────────────────────────────────────
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

// Unmatched API paths get JSON, never the SPA shell — otherwise a typo'd
// endpoint would return index.html with a 200 and fail confusingly in the client.
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Frontend ─────────────────────────────────────────────────────────────────
if (hasFrontendBuild) {
  // Hashed asset filenames are safe to cache hard; index.html must not be, or
  // clients keep booting an old bundle after a deploy.
  app.use(express.static(FRONTEND_DIST, { index: false, maxAge: '1y' }));

  app.get('*', (_req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json({ message: 'ASHA Sathi API (Node.js)', status: 'healthy', version: '2.0.0' });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  if (!process.env.JWT_SECRET) {
    console.error('[server] JWT_SECRET is not set. Copy backend/.env.example to backend/.env and set it before starting.');
    process.exit(1);
  }
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[server] ASHA Sathi API running on port ${PORT}`);
    console.log(
      hasFrontendBuild
        ? `[server] Serving frontend from ${FRONTEND_DIST}`
        : '[server] No frontend build found - running in API-only mode',
    );
  });
}

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});

export default app;
