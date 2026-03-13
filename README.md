# OI Analytics — Open Interest Dashboard

NIFTY · BANKNIFTY · SENSEX option chain with Zerodha Kite Connect.

## Stack
- **React + TypeScript** (Vite) — frontend
- **Node.js + TypeScript** (Express) — JWT auth + proxy
- **Python** (FastAPI) — Kite Connect data

---

## File Map

```
oi-analytics/
├── backend-node/
│   ├── src/
│   │   ├── types/index.ts          ← all TS interfaces
│   │   ├── middleware/
│   │   │   └── verifyToken.ts      ← JWT guard
│   │   ├── routes/
│   │   │   └── auth.ts             ← login / register / verify
│   │   └── server.ts               ← entry point, proxy to Python
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── backend-python/
│   ├── kite_service.py             ← all Kite API logic
│   ├── main.py                     ← FastAPI endpoints
│   ├── get_token.py                ← run once per day
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── types/oi.ts             ← all TS interfaces (mirrors Python)
    │   ├── api/index.ts            ← all fetch() calls
    │   ├── context/AuthContext.tsx ← global auth state
    │   ├── hooks/useOIData.ts      ← data fetching hook
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   └── Dashboard.tsx
    │   └── App.tsx
    ├── .env.example
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

---

## Run Locally

```bash
# Terminal 1 — Python (Kite data)
cd backend-python
pip install -r requirements.txt
cp .env.example .env          # fill in KITE_API_KEY + KITE_API_SECRET
python get_token.py           # run ONCE each morning
uvicorn main:app --reload --port 4000

# Terminal 2 — Node.js (Auth)
cd backend-node
npm install
cp .env.example .env          # fill in JWT_SECRET
npm run dev                   # runs on :4000

# Terminal 3 — React (Frontend)
cd frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:4000
npm run dev                   # opens http://localhost:5173
```

---

## Deploy Free

| Service  | What            | URL                        |
|----------|-----------------|----------------------------|
| Render   | backend-python  | oi-python.onrender.com     |
| Render   | backend-node    | oi-node.onrender.com       |
| Vercel   | frontend        | oi-app.vercel.app          |

### Render (Python)
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Env vars: `KITE_API_KEY`, `KITE_ACCESS_TOKEN`

### Render (Node.js)
- Build: `npm install && npm run build`
- Start: `npm start`
- Env vars: `JWT_SECRET`, `PYTHON_URL=https://oi-python.onrender.com`

### Vercel (React)
- Root directory: `frontend`
- Env vars: `VITE_API_URL=https://oi-node.onrender.com`

---

## Resume

```
Open Interest Analytics Dashboard           github.com/you/oi-analytics
React (TSX) · Node.js (TypeScript) · Python FastAPI · Zerodha Kite Connect
• Real-time option chain for NIFTY, BANKNIFTY, SENSEX
• JWT authentication with bcrypt + Express rate limiting
• PCR calculation, 4-signal OI interpretation engine
• Auto-refresh, expiry selector, interpretation filter
• Deployed on Vercel + Render (zero cost)
Live → https://oi-app.vercel.app
```
