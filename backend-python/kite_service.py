# kite_service.py
# All Kite Connect logic lives here.
# main.py calls functions from this file — it never calls Kite directly.

from kiteconnect import KiteConnect
from dotenv import load_dotenv
from typing import TypedDict
import os
from datetime import datetime, time
import pytz

IST = pytz.timezone("Asia/Kolkata")

def market_is_open():
    now = datetime.now(IST).time()
    return time(9, 15) <= now <= time(15, 30)

load_dotenv()

# ── Kite client (one instance reused for all requests) ────────────
kite = KiteConnect(api_key=os.getenv("API_KEY"))
kite.set_access_token(os.getenv("ACCESS_TOKEN"))

# ── TypedDict = Python equivalent of TypeScript interface ─────────
# Defines the exact shape of one option chain row.
# Must match the OIRow interface in frontend/src/types/oi.ts
# cache last option chain
_last_oi_cache = {}
class OIRow(TypedDict):
    strike:             float
    isATM:              bool
    CE_TREND:           str
    CE_INTERPRETATION:  str
    CE_SPREAD:          float
    CE_ASK_QTY:         int
    CE_ASK:             float
    CE_BID:             float
    CE_BID_QTY:         int
    CE_OI:              int
    CE_CHG_OI:          int
    CE_CHG_PCT:         float
    CE_VOL:             int
    CE_LTP:             float
    PE_LTP:             float
    PE_VOL:             int
    PE_CHG_PCT:         float
    PE_CHG_OI:          int
    PE_OI:              int
    PE_BID_QTY:         int
    PE_BID:             float
    PE_ASK:             float
    PE_ASK_QTY:         int
    PE_SPREAD:          float
    PE_INTERPRETATION:  str
    PE_TREND:           str


# ── OI Interpretation logic ───────────────────────────────────────
# Classic 4-signal system used by all option traders:
#
#   OI ↑ + Price ↑  →  LONG BUILDUP   (fresh buyers entering)   Bullish
#   OI ↑ + Price ↓  →  SHORT BUILDUP  (fresh sellers entering)  Bearish
#   OI ↓ + Price ↓  →  LONG UNWINDING (longs exiting)           Bearish
#   OI ↓ + Price ↑  →  SHORT COVERING (shorts covering)         Bullish

def interpret(chg_oi: int, ltp_change: float) -> str:
    if chg_oi > 0 and ltp_change > 0:  return "LONG BUILDUP"
    if chg_oi > 0 and ltp_change <= 0: return "SHORT BUILDUP"
    if chg_oi < 0 and ltp_change <= 0: return "LONG UNWINDING"
    if chg_oi < 0 and ltp_change > 0:  return "SHORT COVERING"
    return "NO CHANGE"


# ── Instruments cache ─────────────────────────────────────────────
# kite.instruments() downloads a large CSV — slow (~2s).
# We cache it in memory so it only runs once per server session.
# In production: refresh this cache at 8AM using a cron job.

_cache: dict[str, list] = {}

def get_instruments(exchange: str):
    if exchange not in _cache:
        print("Loading instruments from Kite...")
        _cache[exchange] = kite.instruments(exchange)
    return _cache[exchange]

INDEX_MAP = {
    "NIFTY": "NSE:NIFTY 50",
    "BANKNIFTY": "NSE:NIFTY BANK",
    "SENSEX": "BSE:SENSEX"
}

# ── Main function ─────────────────────────────────────────────────

def get_oi_data(symbol: str, expiry: str) -> dict:
    exchange = "BFO" if symbol == "SENSEX" else "NFO"
    key = f"{symbol}_{expiry}"

    # If market closed → return cached data
    if not market_is_open() and key in _last_oi_cache:
        print("Market closed → returning cached option chain")
        return _last_oi_cache[key]

    try:
        # ── 1️⃣ Get underlying index price (for ATM)
        underlying_symbol = INDEX_MAP.get(symbol, f"NSE:{symbol}")
        underlying_quote = kite.quote([underlying_symbol])

        if underlying_symbol not in underlying_quote:
         raise Exception(f"No quote returned for {underlying_symbol}")

        underlying_price = underlying_quote[underlying_symbol]["last_price"]

        # Strike step
        step = 50 if symbol == "NIFTY" else 100

        # ATM strike
        atm = round(underlying_price / step) * step

        print("Underlying price:", underlying_price)
        print("ATM strike:", atm)

        # ── 2️⃣ Filter instruments
        all_instruments = get_instruments(exchange)
        # total_ce_oi = 0
        # total_pe_oi = 0

        # for strike in strikes.values():

        #     ce = strike.get("CE", {})
        #     pe = strike.get("PE", {})

        #     total_ce_oi += ce.get("oi", 0)
        #     total_pe_oi += pe.get("oi", 0)

        chain = [
            i for i in all_instruments
            if i["name"] == symbol
            and str(i["expiry"]) == expiry
            and i["instrument_type"] in ("CE", "PE")
            # and abs(i["strike"] - atm) <= step * 20   # ±20 strikes
        ]
        
        if not chain:
            print("No instruments found")
            return []

        # ── 3️⃣ Build quote symbols
        symbols = [f"{exchange}:{i['tradingsymbol']}" for i in chain]

        print("Total symbols:", len(symbols))

        # ── 4️⃣ Fetch quotes safely
        try:
            quotes = kite.quote(symbols)
        except Exception as e:
            print("Quote error:", e)
            return []

        # ── 5️⃣ Process quotes
        strikes: dict[float, dict] = {}

        for inst in chain:
            key = f"{exchange}:{inst['tradingsymbol']}"

            if key not in quotes:
                continue

            q = quotes[key]

            strike = float(inst["strike"])
            opt_type = inst["instrument_type"]

            if strike not in strikes:
                strikes[strike] = {}

            depth = q.get("depth") or {}
            buy = depth.get("buy") or [{}]
            sell = depth.get("sell") or [{}]

            best_bid = buy[0]
            best_ask = sell[0]

            last_price = q.get("last_price", 0)

            ohlc = q.get("ohlc") or {}
            prev_close = ohlc.get("close") or last_price

            ltp_change = round(last_price - prev_close, 2)

            oi = q.get("oi") or 0
            chg_oi = q.get("oi_change") or 0

            bid = float(best_bid.get("price") or 0)
            ask = float(best_ask.get("price") or 0)

            strikes[strike][opt_type] = {
                "ltp": last_price,
                "volume": q.get("volume") or 0,
                "oi": oi,
                "chg_oi": chg_oi,
                "chg_pct": round((chg_oi / max(1, oi)) * 100, 2),
                "ltp_change": ltp_change,
                "bid": bid,
                "bid_qty": int(best_bid.get("quantity") or 0),
                "ask": ask,
                "ask_qty": int(best_ask.get("quantity") or 0),
                "spread": round(ask - bid, 2),
                "interpretation": interpret(chg_oi, ltp_change),
                "trend": "UP" if ltp_change > 0 else "DOWN",
            }


        # ── 6️⃣ Build final response
        result: list[OIRow] = []

        for strike in sorted(strikes):
            ce = strikes[strike].get("CE", {})
            pe = strikes[strike].get("PE", {})

            def cg(k, d=0): return ce.get(k, d)
            def pg(k, d=0): return pe.get(k, d)

            result.append({
                "strike": strike,
                "isATM": strike == atm,
                "CE_TREND": cg("trend", ""),
                "CE_INTERPRETATION": cg("interpretation", ""),
                "CE_SPREAD": cg("spread"),
                "CE_ASK_QTY": cg("ask_qty"),
                "CE_ASK": cg("ask"),
                "CE_BID": cg("bid"),
                "CE_BID_QTY": cg("bid_qty"),
                "CE_OI": cg("oi"),
                "CE_CHG_OI": cg("chg_oi"),
                "CE_CHG_PCT": cg("chg_pct"),
                "CE_VOL": cg("volume"),
                "CE_LTP": cg("ltp"),
                "PE_LTP": pg("ltp"),
                "PE_VOL": pg("volume"),
                "PE_CHG_PCT": pg("chg_pct"),
                "PE_CHG_OI": pg("chg_oi"),
                "PE_OI": pg("oi"),
                "PE_BID_QTY": pg("bid_qty"),
                "PE_BID": pg("bid"),
                "PE_ASK": pg("ask"),
                "PE_ASK_QTY": pg("ask_qty"),
                "PE_SPREAD": pg("spread"),
                "PE_INTERPRETATION": pg("interpretation", ""),
                "PE_TREND": pg("trend", ""),
            })
        key = f"{symbol}_{expiry}"

        # ── 7️⃣ Calculate TOTAL MARKET OI ─────────────────

        total_ce_oi = 0
        total_pe_oi = 0

        for strike_data in strikes.values():

            ce = strike_data.get("CE", {})
            pe = strike_data.get("PE", {})

            total_ce_oi += ce.get("oi", 0)
            total_pe_oi += pe.get("oi", 0)

        market_pcr = round(total_pe_oi / max(1, total_ce_oi), 2)
        filtered_rows = [
            r for r in result
            if abs(r["strike"] - atm) <= step * 20
        ]
        max_ce_oi = 0
        max_pe_oi = 0
        resistance = None
        support = None

        for row in result:  # pylint: disable=invalid-name

            if row["CE_OI"] > max_ce_oi:
                max_ce_oi = row["CE_OI"]
                resistance = row["strike"]

            if row["PE_OI"] > max_pe_oi:
                max_pe_oi = row["PE_OI"]
                support = row["strike"]

        # save latest successful result (store full response dict)
                resp = {
            "data": filtered_rows,
            "support": support,
            "resistance": resistance,

            "market_totals": {
                "ce_oi": total_ce_oi,
                "pe_oi": total_pe_oi,
                "pcr": market_pcr
            }
        }
        if result:
            _last_oi_cache[key] = resp

        # if empty result and cache exists → return cached response
        if not result and key in _last_oi_cache:
            print("Returning cached option chain")
            return _last_oi_cache[key]
        # print("Saving to cache:", key)
        # print("++++++++", resp)
        return resp

    except Exception as e:
        print("OI DATA ERROR:", e)
        return {"data": [], "support": None, "resistance": None}

def get_expiries(symbol: str) -> list[str]:
    """Return the next 6 expiry dates for a symbol."""
    exchange = "BFO" if symbol == "SENSEX" else "NFO"
    instruments = get_instruments(exchange)
    expiries = sorted(set(
        str(i["expiry"])
        for i in instruments
        if i["name"] == symbol and i["instrument_type"] == "CE"
    ))
    return expiries[:6]


