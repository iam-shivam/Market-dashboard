// src/types/index.ts
// All TypeScript interfaces live here.
// Think of interfaces as "blueprints" — they define what shape data must have.

// ── User stored in our database ──────────────────────────────
export interface User {
  id: number;
  email: string;
  passwordHash: string; // NEVER store plain text passwords
  name: string;
  role: "admin" | "viewer"; // only these two values allowed
}

// ── What gets encoded inside the JWT token ───────────────────
export interface JwtPayload {
  id: number;
  email: string;
  name: string;
  role: "admin" | "viewer";
  iat?: number; // "issued at"  — added automatically by jwt.sign()
  exp?: number; // "expires at" — added automatically by jwt.sign()
}

// ── Shape of POST /auth/login request body ───────────────────
export interface LoginBody {
  email: string;
  password: string;
}

// ── Shape of POST /auth/register request body ────────────────
export interface RegisterBody {
  email: string;
  password: string;
  name: string;
}

// ── Shape of successful login response sent to React ─────────
export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

// ── Extend Express so req.user works without TS errors ───────
// By default Express Request has no .user property.
// This tells TypeScript "yes, req.user exists, and it's JwtPayload".
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
