// src/types/oi.ts
// Single source of truth for all TypeScript types in the frontend.
// The OIRow interface MUST match the OIRow TypedDict in kite_service.py.

// ── Auth ──────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "viewer";
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ── Instruments ───────────────────────────────────────────────────

export type InstrumentSymbol = "NIFTY" | "BANKNIFTY" | "SENSEX";

export interface InstrumentConfig {
  label: string;
  color: string;
  exchange: "NFO" | "BFO";
  lotSize: number;
  step: number; // strike price gap
}

export const INSTRUMENTS: Record<InstrumentSymbol, InstrumentConfig> = {
  NIFTY: {
    label: "NIFTY 50",
    color: "#0ea5e9",
    exchange: "NFO",
    lotSize: 25,
    step: 50,
  },
  BANKNIFTY: {
    label: "BANK NIFTY",
    color: "#f59e0b",
    exchange: "NFO",
    lotSize: 15,
    step: 100,
  },
  SENSEX: {
    label: "SENSEX",
    color: "#a78bfa",
    exchange: "BFO",
    lotSize: 10,
    step: 100,
  },
};

// ── Option Chain ──────────────────────────────────────────────────

export type Interpretation =
  | "LONG BUILDUP"
  | "SHORT BUILDUP"
  | "LONG UNWINDING"
  | "SHORT COVERING"
  | "NO CHANGE"
  | "";

export type Trend = "UP" | "DOWN" | "";

// One row = one strike price with CE on left, PE on right
export interface OIRow {
  strike: number;
  // CALLS
  CE_TREND:           Trend;
  CE_INTERPRETATION:  Interpretation;
  CE_SPREAD:          number;
  CE_ASK_QTY:         number;
  CE_ASK:             number;
  CE_BID:             number;
  CE_BID_QTY:         number;
  CE_OI:              number;
  CE_CHG_OI:          number;
  CE_CHG_PCT:         number;
  CE_VOL:             number;
  CE_LTP:             number;
  // PUTS
  PE_LTP:             number;
  PE_VOL:             number;
  PE_CHG_PCT:         number;
  PE_CHG_OI:          number;
  PE_OI:              number;
  PE_BID_QTY:         number;
  PE_BID:             number;
  PE_ASK:             number;
  PE_ASK_QTY:         number;
  PE_SPREAD:          number;
  PE_INTERPRETATION:  Interpretation;
  PE_TREND:           Trend;
}

// API response wrapper
export interface OIApiResponse {
  symbol: string;
  expiry: string;
  data: OIRow[];
  count: number;
}

// Colour map for interpretations
export const INTERP_COLORS: Record<Interpretation, string> = {
  "LONG BUILDUP":   "#22c55e",
  "SHORT BUILDUP":  "#ef4444",
  "LONG UNWINDING": "#f97316",
  "SHORT COVERING": "#a78bfa",
  "NO CHANGE":      "#64748b",
  "":               "#64748b",
};

// Colour map for trends
export const TREND_COLORS: Record<Trend, string> = { UP: "#22c55e", DOWN: "#ef4444", "": "#64748b" };