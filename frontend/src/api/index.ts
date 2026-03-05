// src/api/index.ts
// All network calls live here. Components never call fetch() directly.
// Centralising means: if the URL changes, you update ONE file, not 20 components.

import type { LoginResponse, OIApiResponse } from "../types/oi";

// import type { LoginResponse, OIApiResponse } from "@/types/oi";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// ── Helpers ───────────────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem("oi_token");
}

// Every protected request needs Authorization header
function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Centralised error handler — also handles expired sessions
async function handle<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    // Token expired — clear storage and reload to show login page
    localStorage.removeItem("oi_token");
    window.location.href = "/";
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Auth endpoints ────────────────────────────────────────────────

// POST /auth/login
export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handle<LoginResponse>(res);
}

// GET /auth/verify — called on page load to check if stored token still works
export async function apiVerify(): Promise<{ valid: boolean; user: any }> {
  const res = await fetch(`${BASE}/auth/verify`, { headers: authHeaders() });
  return handle(res);
}

// ── OI data endpoints ─────────────────────────────────────────────

// GET /api/oi?symbol=NIFTY&expiry=2025-03-27
export async function apiFetchOI(symbol: string, expiry: string): Promise<OIApiResponse> {
  const params = new URLSearchParams({ symbol, expiry });
  const res = await fetch(`${BASE}/api/oi?${params}`, { headers: authHeaders() });
  return handle<OIApiResponse>(res);
}

// GET /api/expiries?symbol=NIFTY
export async function apiFetchExpiries(symbol: string): Promise<string[]> {
  const res = await fetch(`${BASE}/api/expiries?symbol=${symbol}`, { headers: authHeaders() });
  return handle<string[]>(res);
}
