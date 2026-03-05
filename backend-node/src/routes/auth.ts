// src/routes/auth.ts
// Handles all authentication endpoints:
//   POST /auth/login    → validate email+password → return JWT
//   POST /auth/register → create new user
//   GET  /auth/verify   → check if a token is still valid (called on page load)
//   GET  /auth/me       → return current user's profile

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, LoginBody, RegisterBody, LoginResponse, JwtPayload } from "../types";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

// ── In-memory user store ──────────────────────────────────────────
// Replace with MongoDB/PostgreSQL for production.
// Password below is bcrypt hash of "demo123"
const USERS: User[] = [
  {
    id: 1,
    email: "demo@oi.com",
    passwordHash: "$2b$10$b460gZiw4Lq9CUVqyT9czebMX2X73iKqr7zG0oHAwwEGxU.74F89S",
    name: "Demo Trader",
    role: "admin",
  },
];
let nextId = 2;

// ── POST /auth/login ──────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as LoginBody;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  // Find user — case-insensitive email
  const user = USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());

  // Use the same error message whether user is missing OR password is wrong.
  // This prevents attackers from knowing which emails exist.
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  // bcrypt.compare(plainText, hash) — returns true if they match
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  // Build payload — this data gets encoded inside the JWT token
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  // Sign the token with our secret. Token expires in 1 day.
  const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1d" });

  const response: LoginResponse = {
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };

  res.json(response);
});

// ── POST /auth/register ───────────────────────────────────────────
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { email, password, name } = req.body as RegisterBody;

  if (!email || !password || !name) {
    res.status(400).json({ error: "All fields required" });
    return;
  }

  const exists = USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  // Hash password before storing. bcrypt rounds=10 means 1024 hash iterations.
  // Slower = harder to crack if DB is ever leaked.
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser: User = { id: nextId++, email, passwordHash, name, role: "viewer" };
  USERS.push(newUser);

  res.status(201).json({ message: "Account created. Please login." });
});

// ── GET /auth/verify ──────────────────────────────────────────────
// React calls this on page load to check if the stored token is still valid.
// verifyToken middleware runs first — if token invalid, it returns 401 before
// the route handler even runs.
router.get("/verify", verifyToken, (req: Request, res: Response): void => {
  res.json({ valid: true, user: req.user });
});

// ── GET /auth/me ──────────────────────────────────────────────────
router.get("/me", verifyToken, (req: Request, res: Response): void => {
  const user = USERS.find((u) => u.id === req.user!.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  // Never send passwordHash to the client
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

export default router;
