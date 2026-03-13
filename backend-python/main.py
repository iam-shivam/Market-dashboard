from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from pydantic import BaseModel
from kite_service import get_oi_data, get_expiries
from auth import login_user

app = FastAPI()

class LoginRequest(BaseModel):
    email: str
    password: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- LOGIN ---------------- #

@app.post("/login")
def login(req: LoginRequest):

    if req.email == "demo@oi.com" and req.password == "demo123":

        return {
            "token": "demo-token",
            "user": {
                "name": "Demo User",
                "email": req.email
            }
        }

    raise HTTPException(status_code=401, detail="Invalid credentials")

# ---------------- API ---------------- #

@app.get("/api/oi")
async def oi(symbol: str, expiry: str):

    data = get_oi_data(symbol, expiry)

    return {
        "symbol": symbol,
        "expiry": expiry,
        "data": data,
    }

@app.get("/api/expiries")
async def expiries(symbol: str):
    return get_expiries(symbol)

# ---------------- WEBSOCKET ---------------- #

@app.websocket("/ws/oi")
async def websocket_endpoint(ws: WebSocket):

    await ws.accept()
    msg = await ws.receive_json()

    symbol = msg["symbol"]
    expiry = msg["expiry"]
    # try:

    while True:
        try:
            data = get_oi_data(symbol, expiry)
            await ws.send_json(data)
            await asyncio.sleep(1)

        except Exception as e:
            print(f"Error fetching/sending OI data: {e}")
            await ws.close()