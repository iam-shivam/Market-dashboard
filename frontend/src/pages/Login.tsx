// src/pages/LoginPage.tsx
// Login form. Calls useAuth().login() on submit.
// On success, App.tsx detects user is set and renders Dashboard.

import type { FormEvent } from 'react';
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
// import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();

  const [email,       setEmail]       = useState("demo@oi.com");
  const [password,    setPassword]    = useState("demo123");
  const [error,       setError]       = useState("");
  const [isSubmitting,setIsSubmitting]= useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // prevent browser from reloading the page
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password); // AuthContext stores token, sets user
      // App.tsx will now render <Dashboard /> automatically
    } catch (err: any) {
      setError(err.message ?? "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* Logo / branding */}
        <div style={S.brand}>
          <div style={S.icon}>📊</div>
          <h1 style={S.title}>OI Analytics</h1>
          <p style={S.sub}>NIFTY · BANKNIFTY · SENSEX</p>
          <p style={S.sub2}>Powered by Zerodha Kite Connect</p>
        </div>

        {/* Live ticker strip */}
        <div style={S.ticker}>
          {[
            ["NIFTY",     "22,450", "#22c55e"],
            ["BANKNIFTY", "48,320", "#ef4444"],
            ["SENSEX",    "73,910", "#22c55e"],
          ].map(([name, price, col]) => (
            <div key={name} style={S.tickerItem}>
              <span style={{ color: "#475569", fontSize: 9 }}>{name}</span>
              <span style={{ color: col, fontWeight: 700, fontSize: 11 }}>{price}</span>
            </div>
          ))}
        </div>

        {/* Form — use onSubmit so Enter key also works */}
        <form onSubmit={handleSubmit}>
          <label style={S.label}>EMAIL</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={S.input}
            required
            autoComplete="email"
          />

          <label style={{ ...S.label, marginTop: 14 }}>PASSWORD</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={S.input}
            required
            autoComplete="current-password"
          />

          {error && <p style={S.error}>{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ ...S.btn, opacity: isSubmitting ? 0.6 : 1 }}
          >
            {isSubmitting ? "Logging in..." : "→  LOGIN"}
          </button>
        </form>

        <p style={S.hint}>React · Node.js · Python · Kite API</p>
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────
// Kept inline so this file is self-contained. Move to CSS modules in prod.
const S: Record<string, React.CSSProperties> = {
  page:       { minHeight: "100vh", background: "#020b18", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace" },
  card:       { background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 16, padding: "44px 40px", width: 400, boxShadow: "0 0 60px #0ea5e910" },
  brand:      { textAlign: "center", marginBottom: 24 },
  icon:       { fontSize: 32, marginBottom: 8 },
  title:      { color: "#f1f5f9", fontSize: 22, fontWeight: 700, margin: "0 0 4px" },
  sub:        { color: "#0ea5e9", fontSize: 10, letterSpacing: 3, margin: 0 },
  sub2:       { color: "#334155", fontSize: 9, marginTop: 4 },
  ticker:     { display: "flex", justifyContent: "space-around", background: "#051020", border: "1px solid #0f2744", borderRadius: 8, padding: "8px 12px", marginBottom: 24 },
  tickerItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  label:      { display: "block", fontSize: 10, color: "#475569", letterSpacing: 2, marginBottom: 6 },
  input:      { width: "100%", background: "#051020", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  error:      { color: "#ef4444", fontSize: 11, textAlign: "center", margin: "12px 0" },
  btn:        { marginTop: 20, width: "100%", padding: 13, borderRadius: 10, border: "none", background: "linear-gradient(135deg,#0ea5e9,#6366f1)", color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: 2, cursor: "pointer", fontFamily: "inherit" },
  hint:       { textAlign: "center", marginTop: 20, fontSize: 9, color: "#1e3a5f" },
};
