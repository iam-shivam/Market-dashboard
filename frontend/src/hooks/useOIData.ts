// src/hooks/useOIData.ts
// Custom hook — manages all state and fetching for the option chain.
// Dashboard.tsx calls this hook and just renders the data it gets back.
// Separation: hook = data logic, component = display logic.

// import { useState, useEffect, useCallback, useRef } from "react";
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
  support:     number | null;
  resistance:  number | null;
  marketCEOI: number | null
  marketPEOI: number | null
  marketPCR: number | null
}


export function useOIData(instrument: InstrumentSymbol): UseOIDataReturn {
  const [allRows, setAllRows]     = useState<OIRow[]>([]);
  const [expiries, setExpiries]   = useState<string[]>([]);
  const [expiry, setExpiry]       = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [support, setSupport] = useState<number | null>(null);
  const [resistance, setResistance] = useState<number | null>(null)
  const [filter, setFilter]       = useState<Interpretation | "ALL">("ALL");
  const [marketPCR, setMarketPCR] = useState<number | null>(null);
  const [marketCEOI, setMarketCEOI] = useState<number | null>(null);
  const [marketPEOI, setMarketPEOI] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null)
  // const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // When instrument changes: reset and load new expiry list
  useEffect(() => {
    setAllRows([]);
    setExpiry("");
    setError(null);
    setFilter("ALL");
    setMarketCEOI(null);
    setMarketPEOI(null);
    setMarketPCR(null);

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

      const rows = res.data.data as any[];
      // Merge incoming rows into existing rows by strike (preserve previous fields)
      setAllRows((prev) => {
        const map = new Map(prev.map((r) => [r.strike, r]));
        if (Array.isArray(rows)) {
          rows.forEach((r: any) => {
            const existing = map.get(r.strike) ?? {};
            map.set(r.strike, { ...existing, ...r });
          });
        // (res.data.data as any[]).forEach((r: any) => {
        //   map.set(r.strike, { ...(map.get(r.strike) ?? {}), ...r });
        // });
        // return Array.from(map.values()) as OIRow[];
        }
        return Array.from(map.values()) as OIRow[];
      });
      setSupport(res.data.support ?? null);
      setResistance(res.data.resistance ?? null);
      setMarketCEOI(res.data.market_totals?.ce_oi ?? 0);
      setMarketPEOI(res.data.market_totals?.pe_oi ?? 0);
      setMarketPCR(res.data.market_totals?.pcr ?? 0);
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

//   // Auto-refresh every 10 seconds when enabled
//   useEffect(() => {
//   if (!autoRefresh) return

//   const timer = setInterval(() => {
//     fetchData()
//   }, 3000)   // every 3 seconds

//   return () => clearInterval(timer)
// }, [autoRefresh, fetchData])

useEffect(() => {

  // prevent duplicate connections
  if (!expiry) return

  // close previous socket
  if (wsRef.current) {
    wsRef.current.close()
  }

  const ws = new WebSocket("ws://localhost:4000/ws/oi")

  wsRef.current = ws

/**
 * Called when the WebSocket connection is established.
 * Sends the current instrument and expiry to the server.
 * Logs a success message to the console.
 */
  ws.onopen = () => {
    console.log("WebSocket connection opened, sending subscription message...")
    ws.send(JSON.stringify({
      symbol: instrument,
      expiry
    }))
    console.log("WebSocket connected")
  }

    ws.onmessage = (event) => {
    const payload = JSON.parse(event.data)

    // extract rows safely
    let incoming:any[] = []

  if (Array.isArray(payload?.data)) {
    incoming = payload.data
  } 
  else if (Array.isArray(payload?.data?.data)) {
    incoming = payload.data.data
  }

  // safety guard
  if (!Array.isArray(incoming)) return

  setAllRows(prev => {

    const map = new Map(prev.map(r => [r.strike, r]))

    incoming.forEach((r:any) => {
      const existing = map.get(r.strike) ?? {}
      if (!existing) {
        map.set(r.strike, r)
        return
      }
      //update only change values
      map.set(r.strike, {
        ...existing,
        ...r
      })
    })

    return Array.from(map.values()) as OIRow[]

  })

  // support / resistance
  setSupport(payload?.data?.support ?? payload?.support ?? null)
  setResistance(payload?.data?.resistance ?? payload?.resistance ?? null)
  setMarketCEOI(payload?.data?.market_totals?.ce_oi ?? payload?.market_totals?.ce_oi ?? null)
  setMarketPEOI(payload?.data?.market_totals?.pe_oi ?? payload?.market_totals?.pe_oi ?? null)
  setMarketPCR(payload?.data?.market_totals?.pcr ?? payload?.market_totals?.pcr ?? null)

  }
  ws.onerror = (err) => {
    console.warn("WebSocket error", err)
  }

  ws.onclose = () => {
    console.log("WebSocket closed")
    wsRef.current = null
  }

  return () => ws.close()

}, [instrument, expiry])

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
    support, resistance, marketCEOI, marketPEOI, marketPCR
  };
}
