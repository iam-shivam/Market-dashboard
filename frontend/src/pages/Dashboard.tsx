// src/pages/Dashboard.tsx
// Main dashboard page. Reads data from useOIData hook and renders the table.
// Instrument selector, expiry dropdown, PCR stats, filter bar, OI table.

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOIData } from "../hooks/useOIData";
import type { InstrumentSymbol, Interpretation, OIRow } from "../types/oi";
import { INSTRUMENTS, INTERP_COLORS } from "../types/oi";

// ── Utility: format numbers with Indian comma system ──────────────
const fmt = (n: number) => n.toLocaleString("en-IN");
const fmtPct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;

// ── OI bar — shows relative open interest visually ────────────────
function OIBar({ val, max, color }: { val: number; max: number; color: string }) {
  const w = max > 0 ? Math.max(3, (val / max) * 72) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: w, height: 6, background: color, borderRadius: 3, flexShrink: 0, opacity: 0.85 }} />
      <span style={{ fontSize: 10, color: "#94a3b8" }}>{fmt(val)}</span>
    </div>
  );
}

// ── Instrument selector tabs ──────────────────────────────────────
function InstrumentTabs({
  selected,
  onChange,
}: {
  selected: InstrumentSymbol;
  onChange: (v: InstrumentSymbol) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {(Object.keys(INSTRUMENTS) as InstrumentSymbol[]).map((key) => {
        const active = key === selected;
        const { color } = INSTRUMENTS[key];
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              padding: "7px 16px",
              borderRadius: 7,
              border: `1px solid ${active ? color : "#1e3a5f"}`,
              background: active ? color + "22" : "transparent",
              color: active ? color : "#475569",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: 1,
              transition: "all 0.15s",
            }}
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}

// ── Expiry dropdown ───────────────────────────────────────────────
function ExpirySelect({
  expiries,
  value,
  onChange,
  color,
}: {
  expiries: string[];
  value: string;
  onChange: (v: string) => void;
  color: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: "#051020",
        border: `1px solid ${color}44`,
        borderRadius: 7,
        padding: "7px 12px",
        color,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        outline: "none",
      }}
    >
      {expiries.map((exp, i) => {
      const today = new Date().toISOString().slice(0,10)

     return (
    <option key={exp} value={exp}>
        {exp === today ? `🔥 ${exp} (Today Expiry)` : i === 0 ? `🔥 ${exp} (Weekly)` : exp}
    </option>
  )
})}
    </select>
  );
}

// ── Main Dashboard component ──────────────────────────────────────

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [instrument, setInstrument] = useState<InstrumentSymbol>("NIFTY");

  // All data + state comes from the custom hook
  const {
    rows, expiries, expiry, isLoading, error, lastUpdated,
    autoRefresh, filter,
    setExpiry, setFilter, setAutoRefresh, refresh,
    totalCEOI, totalPEOI, pcrOI, pcrVol, maxCEOI, maxPEOI,
  } = useOIData(instrument);

  const cfg   = INSTRUMENTS[instrument];
  const color = cfg.color;

  // Colour helpers
  const chgColor = (v: number) => (v > 0 ? "#22c55e" : v < 0 ? "#ef4444" : "#64748b");

  // ── Table cell helpers ─────────────────────────────────────────
  const TD = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <td style={{ padding: "4px 6px", borderBottom: "1px solid #060f1e", fontSize: 11, color: "#94a3b8", textAlign: "center", ...style }}>
      {children}
    </td>
  );

  const TH = ({ children }: { children: React.ReactNode }) => (
    <th style={{ padding: "6px", fontSize: 9.5, color: "#475569", fontWeight: 600, borderBottom: "1px solid #0f2744", whiteSpace: "nowrap" as const, textAlign: "center" as const, background: "#040e1e" }}>
      {children}
    </th>
  );

  const Badge = ({ val, color: c }: { val: string; color: string }) => (
    <span style={{ background: c + "20", color: c, border: `1px solid ${c}40`, borderRadius: 3, padding: "1px 5px", fontSize: 9, fontWeight: 700 }}>
      {val}
    </span>
  );

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#020b18", fontFamily: "'JetBrains Mono', monospace", color: "#cbd5e1" }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ background: "#04111f", borderBottom: `1px solid ${color}22`, padding: "10px 20px" }}>

        {/* Row 1: logo + user + logout */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid #0a1f35", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg,${color},#6366f1)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📊</div>
            <div>
              <div style={{ fontSize: 10, color, letterSpacing: 3 }}>ZERODHA · KITE CONNECT</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9" }}>Open Interest Analytics</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: "#475569" }}>👤 {user?.name}</span>
            <span style={{ fontSize: 10, color: "#334155" }}>{lastUpdated?.toLocaleTimeString()}</span>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: autoRefresh ? "#22c55e" : "#334155", boxShadow: autoRefresh ? "0 0 8px #22c55e" : "none" }} />
            <button onClick={logout} style={{ background: "#ef444415", border: "1px solid #ef444430", color: "#ef4444", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>
              LOGOUT
            </button>
          </div>
        </div>

        {/* Row 2: controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <InstrumentTabs selected={instrument} onChange={(k) => { setInstrument(k); }} />
          <div style={{ width: 1, height: 28, background: "#1e3a5f" }} />
          <ExpirySelect expiries={expiries} value={expiry} onChange={setExpiry} color={color} />
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${autoRefresh ? "#22c55e44" : "#1e3a5f"}`, background: autoRefresh ? "#22c55e15" : "transparent", color: autoRefresh ? "#22c55e" : "#475569", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}
            >
              {autoRefresh ? "⏸ AUTO" : "▶ AUTO"}
            </button>
            <button
              onClick={refresh}
              style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${color}44`, background: color + "15", color, fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}
            >
              ↻ REFRESH
            </button>
          </div>
        </div>
      </div>

      {/* ── PCR Stats Bar ──────────────────────────────────────── */}
      <div style={{ background: "#030d1a", borderBottom: "1px solid #0a1f35", padding: "8px 20px", display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
        {[
          ["TOTAL CE OI", fmt(totalCEOI), "#3b82f6"],
          ["TOTAL PE OI", fmt(totalPEOI), "#a78bfa"],
          ["PCR (OI)",  pcrOI.toFixed(2),  pcrOI  > 1 ? "#22c55e" : "#ef4444"],
          ["PCR (VOL)", pcrVol.toFixed(2), pcrVol > 1 ? "#22c55e" : "#ef4444"],
          ["LOT SIZE",  cfg.lotSize,       "#94a3b8"],
        ].map(([label, val, col]) => (
          <div key={String(label)} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
            <span style={{ fontSize: 9, color: "#334155", letterSpacing: 1.5 }}>{label}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: String(col) }}>{val}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 5, background: pcrOI > 1.2 ? "#22c55e20" : pcrOI < 0.8 ? "#ef444420" : "#f59e0b20", color: pcrOI > 1.2 ? "#22c55e" : pcrOI < 0.8 ? "#ef4444" : "#f59e0b", fontSize: 10, fontWeight: 700, border: `1px solid ${pcrOI > 1.2 ? "#22c55e" : pcrOI < 0.8 ? "#ef4444" : "#f59e0b"}40` }}>
          {pcrOI > 1.2 ? "● BULLISH" : pcrOI < 0.8 ? "● BEARISH" : "● NEUTRAL"}
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────── */}
      <div style={{ padding: "7px 20px", background: "#020b18", borderBottom: "1px solid #060f1e", display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 9, color: "#334155", letterSpacing: 1.5, marginRight: 4 }}>FILTER:</span>
        {(["ALL", "LONG BUILDUP", "SHORT BUILDUP", "LONG UNWINDING", "SHORT COVERING"] as const).map((f) => {
          const active = filter === f;
          const fc = INTERP_COLORS[f as Interpretation] ?? color;
          return (
            <button key={f} onClick={() => setFilter(f as Interpretation | "ALL")}
              style={{ padding: "3px 9px", borderRadius: 4, fontSize: 9, cursor: "pointer", fontWeight: 700, fontFamily: "inherit", border: `1px solid ${active ? fc : "#0f2744"}`, background: active ? fc + "20" : "transparent", color: active ? fc : "#334155", transition: "all 0.15s" }}>
              {f}
            </button>
          );
        })}
        <span style={{ marginLeft: "auto", fontSize: 9, color: "#1e3a5f" }}>{rows.length} STRIKES</span>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div style={{ overflowX: "auto", padding: "0 20px 20px" }}>
        {error && (
          <div style={{ textAlign: "center", padding: 40, color: "#ef4444" }}>⚠ {error}</div>
        )}
        {isLoading && !rows.length && (
          <div style={{ textAlign: "center", padding: 80, color }}>Loading {instrument}...</div>
        )}
        {!isLoading && !error && (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1600 }}>
            <thead>
              <tr>
                <td colSpan={12} style={{ background: "#0a2a1a", color: "#22c55e", textAlign: "center", padding: 5, fontSize: 10, fontWeight: 700, letterSpacing: 3 }}>◄ CALLS (CE)</td>
                <td style={{ background: "#0f2744", textAlign: "center", padding: 5, fontSize: 10, fontWeight: 700, color }}>STRIKE</td>
                <td colSpan={12} style={{ background: "#2a0a1a", color: "#f87171", textAlign: "center", padding: 5, fontSize: 10, fontWeight: 700, letterSpacing: 3 }}>PUTS (PE) ►</td>
              </tr>
              <tr>
                {["CE TREND","CE INTERPRETATION","CE SPREAD","CE ASK QTY","CE ASK","CE BID","CE BID QTY","CE OI","CE CHG OI","CE CHG %","CE VOL","CE LTP","STRIKE","PE LTP","PE VOL","PE CHG %","PE CHG OI","PE OI","PE BID QTY","PE BID","PE ASK","PE ASK QTY","PE SPREAD","PE INTERPRETATION","PE TREND"].map((h) => <TH key={h}>{h}</TH>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: OIRow) => {
                // const atm = row.isATM as unknown as boolean;
                const atm = (row as { isATM?: boolean })?.isATM as unknown as boolean;
                return (
                  <tr key={row.strike} style={{ background: atm ? "#0a2010" : "transparent" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#051422")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = atm ? "#0a2010" : "transparent")}>

                    {/* CE side */}
                    <TD><Badge val={row.CE_TREND} color={row.CE_TREND === "UP" ? "#22c55e" : "#ef4444"} /></TD>
                    <TD><span style={{ color: INTERP_COLORS[row.CE_INTERPRETATION], fontSize: 9.5, fontWeight: 700 }}>{row.CE_INTERPRETATION}</span></TD>
                    <TD style={{ color: "#64748b" }}>{row.CE_SPREAD}</TD>
                    <TD style={{ color: "#ef444488" }}>{fmt(row.CE_ASK_QTY)}</TD>
                    <TD style={{ color: "#ef4444", fontWeight: 600 }}>{row.CE_ASK}</TD>
                    <TD style={{ color: "#22c55e", fontWeight: 600 }}>{row.CE_BID}</TD>
                    <TD style={{ color: "#22c55e88" }}>{fmt(row.CE_BID_QTY)}</TD>
                    <TD style={{ textAlign: "left" }}><OIBar val={row.CE_OI} max={maxCEOI} color="#3b82f6" /></TD>
                    <TD style={{ color: chgColor(row.CE_CHG_OI) }}>{fmt(row.CE_CHG_OI)}</TD>
                    <TD style={{ color: chgColor(row.CE_CHG_PCT) }}>{fmtPct(row.CE_CHG_PCT)}</TD>
                    <TD style={{ color: "#64748b" }}>{fmt(row.CE_VOL)}</TD>
                    <TD style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 12 }}>{row.CE_LTP}</TD>

                    {/* Strike */}
                    <td style={{ padding: "4px 10px", textAlign: "center", fontWeight: 700, fontSize: 12, background: atm ? "#22c55e" : "#0f2744", color: atm ? "#020b18" : color, borderLeft: `1px solid ${color}33`, borderRight: `1px solid ${color}33`, borderBottom: "1px solid #060f1e", whiteSpace: "nowrap" }}>
                      {atm ? "★ " : ""}{fmt(row.strike)}
                    </td>

                    {/* PE side */}
                    <TD style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 12 }}>{row.PE_LTP}</TD>
                    <TD style={{ color: "#64748b" }}>{fmt(row.PE_VOL)}</TD>
                    <TD style={{ color: chgColor(row.PE_CHG_PCT) }}>{fmtPct(row.PE_CHG_PCT)}</TD>
                    <TD style={{ color: chgColor(row.PE_CHG_OI) }}>{fmt(row.PE_CHG_OI)}</TD>
                    <TD style={{ textAlign: "right" }}><OIBar val={row.PE_OI} max={maxPEOI} color="#a78bfa" /></TD>
                    <TD style={{ color: "#22c55e88" }}>{fmt(row.PE_BID_QTY)}</TD>
                    <TD style={{ color: "#22c55e", fontWeight: 600 }}>{row.PE_BID}</TD>
                    <TD style={{ color: "#ef4444", fontWeight: 600 }}>{row.PE_ASK}</TD>
                    <TD style={{ color: "#ef444488" }}>{fmt(row.PE_ASK_QTY)}</TD>
                    <TD style={{ color: "#64748b" }}>{row.PE_SPREAD}</TD>
                    <TD><span style={{ color: INTERP_COLORS[row.PE_INTERPRETATION], fontSize: 9.5, fontWeight: 700 }}>{row.PE_INTERPRETATION}</span></TD>
                    <TD><Badge val={row.PE_TREND} color={row.PE_TREND === "UP" ? "#22c55e" : "#ef4444"} /></TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Legend ─────────────────────────────────────────────── */}
      <div style={{ padding: "10px 20px", background: "#030d1a", borderTop: "1px solid #060f1e", display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
        {Object.entries(INTERP_COLORS).filter(([k]) => k !== "").map(([label, col]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: col }} />
            <span style={{ fontSize: 9, color: col, fontWeight: 600 }}>{label}</span>
          </div>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 9, color: "#1e3a5f" }}>★ = ATM STRIKE</span>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
      `}</style>
    </div>
  );
}
