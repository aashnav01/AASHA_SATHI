<div align="center">

<img src="https://img.shields.io/badge/ASHA%20Sathi-आशा%20साथी-7C4D9F?style=for-the-badge&logo=heart&logoColor=white" alt="ASHA Sathi" />

# ASHA Sathi — आशा साथी

**A comprehensive digital health companion for India's frontline ASHA workers**

*Offline-first · Multilingual · AI-powered · Built for rural India*

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)](https://mongodb.com)

</div>

---

## 🌟 What is ASHA Sathi?

**ASHA Sathi** (आशा साथी — *ASHA Companion*) is a purpose-built progressive web application for **Accredited Social Health Activists (ASHAs)** — the 1 million+ frontline community health workers who are India's last mile of maternal and child healthcare.

ASHA workers operate in rural villages with poor internet connectivity, high workloads, and limited institutional support. They track pregnancies, screen for postpartum depression, administer nutrition programmes, conduct home visits, and earn performance-linked incentives — all with pen and paper or basic smartphones.

**ASHA Sathi replaces paper with a dignified, intelligent, and offline-capable digital tool.**

---

## ✨ Core Features

### 🩸 Anemia Tracker
Clinical anemia screening and dietary counselling tool aligned with **ICMR-NIN guidelines**.
- Symptom logging (fatigue, pallor, breathlessness, dizziness)
- Iron-rich food tracking with mg/serving data
- AI-generated dietary advice via **Groq LLM**
- WHO reference ranges for Hb thresholds
- Offline storage with background sync

### 🧠 PPD Screening (EPDS)
Validated **Edinburgh Postnatal Depression Scale** implementation.
- All 10 EPDS questions with culturally adapted Hindi/Telugu phrasing
- Automatic scoring: Low (0–9), Moderate (10–12), High (≥13)
- AI-powered counselling guidance for each risk tier
- Immediate referral prompts for score ≥13
- Persistent offline records, synced when online

### 🤰 Pregnancy Risk Assessment
**WHO/ICMR-aligned** danger sign triage tool.
- 20+ risk factors: age, parity, BP, Hb, previous complications
- Weighted scoring engine producing Low / Medium / High risk
- Actionable ANC red-flag checklist (bleeding, severe headache, reduced fetal movement)
- AI clinical narrative for each assessment

### 📋 NRHM Workload Manager
Tracks all **74 standard ASHA tasks** across 8 NRHM categories.
- Category-wise progress rings with completion percentages
- Incentive amount per task (₹) displayed inline
- Spring-pop checkbox animation + green ripple on completion
- Weekly count-up stats dashboard
- Overdue task alerts for daily/weekly frequency tasks

### 💰 Incentive Tracker
Full performance-linked payment tracking system.
- Log completed tasks against the **NHM task rate card**
- Status workflow: Pending → Submitted → Paid
- Weekly earnings bar chart
- One-tap "Submit to ANM" batch submission
- Dispute flagging for delayed payments
- Count-up animation on total earned amount

### 🚨 Emergency SOS (Panic Button)
Instant distress alert system for field safety.
- GPS location capture (falls back to district centroid)
- SMS alert dispatch to supervisor + emergency contacts
- Slow pulsing "alive" animation at rest — always visible
- Deep rose colour (#A63D57) for maximum urgency recognition
- Referral mode quick-link alongside the FAB

### 🚑 Referral Mode
Structured emergency transport protocol.
- Pre-departure safety checklist (10 items)
- One-tap 108 ambulance call
- Patient name + vehicle number logging
- Persistent referral record stored offline and synced

### 🏥 Wellness Check-in
ASHA worker mental health monitoring.
- Daily mood emoji (5-level scale)
- Tiredness, supervisor support, visit completion scores
- 7-day mood trend line chart
- Research-backed burnout early-warning scoring
- Privacy-respecting: syncs aggregate data only

### 🔬 Symptom Checker
WHO-protocol-aligned differential guidance for common presentations.
- Symptom multi-select with duration and spread indicators
- AI triage (Groq) with urgency classification: Home Care / Monitor / Refer
- PHC call button for High urgency cases
- Offline symptom tree fallback

### 📚 Education Centre
AI-generated daily health learning modules.
- Categories: Maternal, Child, Nutrition, Disease, Mental Health
- Text-to-speech read-aloud for low-literacy users
- Content generated and cached via Groq API
- Fully accessible offline after first load

### 🏛️ Government Schemes Guide
Comprehensive reference for 10 key national health schemes.
- PMMVY, JSY, JSSK, Ayushman Bharat, Poshan Abhiyan, and more
- Eligibility criteria, ASHA role, and patient communication guide
- Full-text search
- Stored offline — no internet required

### 📊 Analytics Dashboard
Local data visualisation for ASHA's own records.
- 30-day anemia screening trend (bar chart)
- PPD risk distribution (pie chart)
- Referral count summary

### 🔄 Data Sync
Offline-first synchronisation engine.
- **7 data types** synced: Anemia, PPD, Alerts, Referrals, Incentives, Wellness, Task Completions
- Idempotent `clientId` deduplication — safe to retry on reconnect
- Visual status dashboard: pending count per table
- "Verified insert then clear" pattern — no data loss on interrupted sync

---

## 🌍 Multilingual Support

| Language | Code | Coverage |
|----------|------|----------|
| English  | `en` | 100% |
| Hindi    | `hi` | 100% |
| Telugu   | `te` | 100% |

Language cycles **EN → हिं → తె → EN** via the globe icon in the top bar. Preference is persisted across sessions via `localStorage`.

---

## 🎨 Design System

### Colour Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#7C4D9F` | Deep lavender — buttons, active states, links |
| `secondary` | `#B08CC0` | Mid lavender — labels, timestamps, muted text |
| `lavender` | `#F3EEFA` | Tint — header bg, active nav row washes |
| `bgWarm` | `#FAF7F5` | Page background — warm, not clinical cold |
| `rose` | `#E8A0B4` | Dusty rose — maternal health, ANC, pregnancy |
| `danger` | `#A63D57` | Deep rose — SOS, overdue alerts, critical only |
| `amber` | `#D4A017` | Warm amber — incentive ₹, pending, due-today |
| `sage` | `#2A7D52` | Sage green — completed, paid, success states |

### Motion Principles
- **Page transitions**: sheet slides up from below (spatial hierarchy)
- **Checkboxes**: spring-pop overshoot + green ripple wash on completion
- **Dashboard stats**: count-up from zero over 650ms (ease-out cubic)
- **Lists**: staggered entry at 70ms intervals
- **Save feedback**: toast slides up, holds 1.5s, slides back down
- **Offline toast**: lavender gradient + pulsing amber dot
- **SOS button**: slow 3s pulse — alive, never alarming
- **Form inputs**: amber border + shake on out-of-range values

---

## 🏗️ Architecture

```
AASHA_SATHI/
├── frontend/               # React + TypeScript PWA (Vite)
│   ├── src/
│   │   ├── tabs/           # Feature screens (12 tabs)
│   │   ├── components/     # Shared UI (Card, TabBar, TopBar, SaveToast, PanicFAB)
│   │   ├── hooks/          # useTextToSpeech, useVoiceRecognition, useCountUp, useOnlineStatus
│   │   ├── db/             # Dexie.js offline database (offlineDb.ts)
│   │   ├── services/       # API client (api.ts) + sync payload types
│   │   ├── i18n/           # Translations — en.json, hi.json, te.json
│   │   └── data/           # NRHM task list, incentive rates, schemes data
│   └── tailwind.config.js  # Custom design tokens + animation keyframes
│
└── backend/                # Express + TypeScript REST API
    ├── src/
    │   ├── routes/         # /anemia, /ppd, /referral, /sync, /incentive, /symptom, etc.
    │   ├── models/         # Mongoose schemas (AnemiaRecord, PPDRecord, Referral, ...)
    │   └── data/           # symptom-tree.json, incentive-rates.json
    └── .env                # GROQ_API_KEY, MONGODB_URI, JWT_SECRET (not committed)
```

### Offline-First Data Flow

```
User action
    │
    ▼
Dexie.js (IndexedDB)          ← instant, always works
    │ sync_status = 'pending'
    ▼
[Device comes online]
    │
    ▼
POST /api/sync  ──────────────► MongoDB Atlas
    │  { clientId dedup }         (idempotent insert)
    ▼
Clear local pending records
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (`mongodb://localhost:27017`) or a connection string
- A [Groq API key](https://console.groq.com) (free tier available)

### Backend Setup

```bash
cd backend
npm install

# Create .env
cp .env.example .env
# Fill in: MONGODB_URI, GROQ_API_KEY, JWT_SECRET, PORT=8000

npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### Environment Variables

**`backend/.env`**
```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/asha_sathi
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=your_jwt_secret_here
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/anemia/record` | Save anemia screening |
| POST | `/api/ppd/screen` | Save EPDS screening |
| POST | `/api/referral/log` | Log emergency referral |
| POST | `/api/incentive/log` | Log completed task |
| GET  | `/api/incentive/earnings` | Get earnings summary |
| POST | `/api/symptom-check` | AI symptom triage |
| POST | `/api/pregnancy-risk` | Risk assessment |
| GET  | `/api/education/modules` | Fetch learning modules |
| POST | `/api/sync` | Bulk offline sync (7 types) |
| POST | `/api/panic` | Send SOS alert |
| GET  | `/api/health` | Health check |

---

## 🛡️ Production Checklist

- [ ] Replace `mongodb://localhost:27017` with MongoDB Atlas URI
- [ ] Rotate `JWT_SECRET` to a strong random value
- [ ] Store `GROQ_API_KEY` in environment secrets (not `.env` file)
- [ ] Enable HTTPS (required for GPS + service worker)
- [ ] Set up a reverse proxy (nginx/Caddy) in front of the Express server
- [ ] Configure CORS origins to your deployed frontend domain

---

## 📖 Research Context

ASHA Sathi was designed in response to findings from **2024–25 field research** on ASHA worker challenges:

- **High workload burnout**: 74 NRHM tasks with inadequate tracking → Workload Manager
- **Delayed incentive payments**: No digital audit trail → Incentive Tracker + dispute flagging
- **PPD underdetection**: Cultural stigma, no screening tool in Hindi → EPDS with AI guidance
- **Anemia persisting despite IFA distribution**: No dietary counselling tool → Anemia Tracker
- **Field safety gaps**: No SOS mechanism for lone workers → Panic FAB with GPS
- **Offline exclusion**: Apps requiring internet unusable in villages → Full offline-first architecture

---

## 👩‍💻 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS (custom design system) |
| Offline database | Dexie.js (IndexedDB wrapper) |
| Routing | React Router v6 |
| Charts | Recharts |
| Internationalisation | i18next + react-i18next |
| Icons | Lucide React |
| Backend | Express.js + TypeScript |
| Database | MongoDB + Mongoose |
| AI / LLM | Groq API (llama-3.3-70b-versatile) |
| Voice | Web Speech API (SpeechRecognition + SpeechSynthesis) |

---

## 📄 License

MIT — Free to use, modify, and deploy for public health purposes.

---

<div align="center">

**Built with ❤️ for India's 1 million ASHA workers**

*"Every ASHA worker who spends less time on paperwork is an ASHA worker who spends more time with her community."*

</div>
