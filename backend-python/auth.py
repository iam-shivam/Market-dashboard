from fastapi import HTTPException

USERS = {
    "demo@oi.com": {
        "password": "demo123",
        "name": "Admin"
    }
}

def login_user(email: str, password: str):

    user = USERS.get(email)

    if not user or user["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "token": "demo-token",
        "user": {
            "email": email,
            "name": user["name"]
        }
    }