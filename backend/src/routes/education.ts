import { Router, Request, Response } from 'express';

const router = Router();

// ─── STATIC EDUCATION MODULES ─────────────────────────────────────────────────────
// No LLM calls — fixed content for rural ASHA workers in low/offline connectivity areas
const EDUCATION_MODULES = [
  {
    id: 1,
    title: "Nutrition during Pregnancy",
    category: "Nutrition",
    youtube_id: "5_w9aM2VfU0",
    type: "video",
    duration: "3:45",
    color: "from-orange-400 to-pink-500"
  },
  {
    id: 2,
    title: "Understanding Postpartum Depression",
    category: "Mental Health",
    youtube_id: "wW_nLksL1w4",
    type: "video",
    duration: "5:20",
    color: "from-blue-400 to-indigo-500"
  },
  {
    id: 3,
    title: "Iron Supplement Guidelines",
    category: "Anemia",
    youtube_id: "fGBz6-z6fR0",
    type: "video",
    duration: "2:15",
    color: "from-emerald-400 to-teal-500"
  },
  {
    id: 4,
    title: "High-Risk Pregnancy Warning Signs",
    category: "Pregnancy",
    youtube_id: "V6h7Z0N4J04",
    type: "video",
    duration: "4:00",
    color: "from-red-400 to-rose-500"
  }
];

// ─── GET /api/education ──────────────────────────────────────────────────
// Returns fixed static modules — no LLM, works 100% offline
router.get('/', (req: Request, res: Response) => {
  return res.json(EDUCATION_MODULES);
});

export default router;
