// src/hooks/useOIData.ts
// Custom hook — manages all state and fetching for the option chain.
// Dashboard.tsx calls this hook and just renders the data it gets back.
// Separation: hook = data logic, component = display logic.

import { useState, useEffect, useCallback, useRef } from "react";
import type { OIRow, InstrumentSymbol, Interpretation } from "../types/oi";
import { apiFetchOI, apiFetchExpiries } from "../api";

// ── Return type — everything Dashboard needs ───────────────────────

export interface UseOIDataReturn {
  rows:           OIRow[];          // filtered rows for the table
  allRows:        OIRow[];          // unfiltered (used for stats)
  expiries:       string[];
  expiry:         string;
  isLoading:      boolean;
  error:          string | null;
  lastUpdated:    Date | null;
  autoRefresh:    boolean;
  filter:         Interpretation | "ALL";
  setExpiry:      (v: string) => void;
  setFilter:      (v: Interpretation | "ALL") => void;
  setAutoRefresh: (v: boolean) => void;
  refresh:        () => void;
  // pre-computed stats
  totalCEOI:  number;
  totalPEOI:  number;
  totalCEVol: number;
  totalPEVol: number;
  pcrOI:      number;
  pcrVol:     number;
  maxCEOI:    number;
  maxPEOI:    number;
}

export function useOIData(instrument: InstrumentSymbol): UseOIDataReturn {
  const [allRows, setAllRows]     = useState<OIRow[]>([]);
  const [expiries, setExpiries]   = useState<string[]>([]);
  const [expiry, setExpiry]       = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [filter, setFilter]       = useState<Interpretation | "ALL">("ALL");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // When instrument changes: reset and load new expiry list
  useEffect(() => {
    setAllRows([]);
    setExpiry("");
    setError(null);
    setFilter("ALL");

    apiFetchExpiries(instrument)
      .then((list) => {
        setExpiries(list);
        if (list.length) setExpiry(list[0]); // default: nearest expiry
      })
      .catch((e) => setError(e.message));
  }, [instrument]);

  // When instrument or expiry changes: fetch chain data
  const fetchData = useCallback(async () => {
    if (!expiry) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetchOI(instrument, expiry);
      setAllRows(res.data);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message ?? "Fetch failed");
    } finally {
      setIsLoading(false);
    }
  }, [instrument, expiry]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 10 seconds when enabled
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoRefresh) timerRef.current = setInterval(fetchData, 10_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoRefresh, fetchData]);

  // Apply interpretation filter
  const rows =
    filter === "ALL"
      ? allRows
      : allRows.filter(
          (r) => r.CE_INTERPRETATION === filter || r.PE_INTERPRETATION === filter
        );

  // Stats used in header bar
  const totalCEOI  = allRows.reduce((s, r) => s + r.CE_OI,  0);
  const totalPEOI  = allRows.reduce((s, r) => s + r.PE_OI,  0);
  const totalCEVol = allRows.reduce((s, r) => s + r.CE_VOL, 0);
  const totalPEVol = allRows.reduce((s, r) => s + r.PE_VOL, 0);
  const pcrOI      = totalCEOI  > 0 ? totalPEOI  / totalCEOI  : 0;
  const pcrVol     = totalCEVol > 0 ? totalPEVol / totalCEVol : 0;
  const maxCEOI    = allRows.length ? Math.max(...allRows.map((r) => r.CE_OI)) : 0;
  const maxPEOI    = allRows.length ? Math.max(...allRows.map((r) => r.PE_OI)) : 0;

  return {
    rows, allRows, expiries, expiry, isLoading, error, lastUpdated,
    autoRefresh, filter,
    setExpiry, setFilter, setAutoRefresh, refresh: fetchData,
    totalCEOI, totalPEOI, totalCEVol, totalPEVol,
    pcrOI, pcrVol, maxCEOI, maxPEOI,
  };
}
