# get_token.py
# Run this script ONCE each morning before starting the server.
# Kite access tokens expire at 6:00 AM daily.
#
# Usage:
#   python get_token.py
#   → opens Kite login URL in browser
#   → you login with Zerodha credentials
#   → browser redirects to your redirect URL with ?request_token=XXXX
#   → paste that token here
#   → script writes KITE_ACCESS_TOKEN to your .env file

from kiteconnect import KiteConnect
from dotenv import load_dotenv, set_key
import os, webbrowser

load_dotenv()

api_key    = os.getenv("API_KEY", "")
api_secret = os.getenv("API_SECRET", "")

kite = KiteConnect(api_key=api_key)

# Step 1 — open login URL in browser
login_url = kite.login_url()
print(f"\nOpening: {login_url}\n")
webbrowser.open(login_url)

# Step 2 — user pastes the request_token from the redirect URL
request_token = input("Paste the request_token from redirect URL: ").strip()

# Step 3 — exchange for access_token
session = kite.generate_session(request_token, api_secret=api_secret)
access_token = session["access_token"]

# Step 4 — save to .env file automatically
set_key(".env", "ACCESS_TOKEN", access_token, quote_mode="never")

print(f"\n✅ Access token saved to .env")
print(f"   Token: {access_token[:20]}...")
print(f"\nNow run: uvicorn main:app --reload --port 4000\n")
