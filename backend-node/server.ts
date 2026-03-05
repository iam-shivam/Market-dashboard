// src/server.ts
// Main entry point. Wires everything together and starts listening.
//
// Every request travels through this stack in order:
//   cors()                → allow React (port 5173) to call this server
//   express.json()        → parse JSON body from React
//   loginLimiter          → block brute force on /auth/login
//   /auth routes          → login, register, verify  (no token needed)
//   verifyToken           → check JWT on all /api/* routes
//   createProxyMiddleware → forward /api/* to Python FastAPI on port 8000

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { createProxyMiddleware } from "http-proxy-middleware";
import authRoutes from "./src/routes/auth";
import { verifyToken } from "./src/middleware/verifyToken";

// Load .env file FIRST — must be before any process.env.* usage
dotenv.config();

const app = express();


// ── 1. CORS ───────────────────────────────────────────────────────
// Without this the browser will block React from calling Node.js
// (browsers enforce "same-origin policy" by default)
app.use(
  cors({
    origin: [
      "http://localhost:5173",          // Vite dev server
      "https://your-app.vercel.app",    // ← replace with your Vercel URL after deploy
    ],
    credentials: true,
  })
);

// ── 2. JSON body parser ───────────────────────────────────────────
// Without this: req.body = undefined
app.use(express.json());

// ── 3. Rate limiter ───────────────────────────────────────────────
// Allows max 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many attempts. Try again in 15 minutes." },
});

// ── 4. Health check ───────────────────────────────────────────────
// Render uses this to know if the server is alive
app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ── 5. Auth routes (PUBLIC — no token required) ───────────────────
app.use("/auth", 
  // loginLimiter,
 authRoutes);
// POST /auth/login
// POST /auth/register
// GET  /auth/verify
// GET  /auth/me

// ── 6. Proxy /api/* → Python FastAPI ─────────────────────────────
// Why proxy through Node instead of React calling Python directly?
//   - Keeps Python URL hidden from the browser
//   - verifyToken runs HERE before any data leaves Node.js
//   - React only needs to know one URL (Node.js)
const PYTHON_URL = process.env.PYTHON_URL ?? "http://localhost:8000";

app.use("/api", (req, res, next) => {
  console.log("Proxying:", req.originalUrl);
  next();
});

app.use(
  "/api",
  verifyToken, // ← JWT check happens before forwarding
  createProxyMiddleware({
    target: PYTHON_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/api": "/api"
    },
    on: {
      proxyReq: (proxyReq, req) => {
        // Tell Python which user is making the request
        const user = (req as any).user;
        if (user) proxyReq.setHeader("X-User-Email", user.email);
      },
    },
  })
);

// ── 7. Start server ───────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? "4000");
app.listen(PORT, () => {
  console.log(`✅ Auth server on http://localhost:${PORT}`);
  console.log(`   Python target: ${PYTHON_URL}`);
});
