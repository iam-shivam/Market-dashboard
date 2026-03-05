// src/middleware/verifyToken.ts
// Middleware = a function that runs BETWEEN the request arriving and the route handler.
// This one checks the JWT token on every protected route.
//
// Flow:
//   React sends request with header: Authorization: "Bearer eyJhbG..."
//   → verifyToken runs
//   → if token valid: calls next() → route handler runs
//   → if token invalid: sends 401 back to React, route never runs

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types";

export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  // 1. Read the Authorization header
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    res.status(401).json({ error: "No authorization header" });
    return;
  }

  // 2. Header format is "Bearer TOKEN" — we only want the TOKEN part
  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  // 3. Verify token with our secret key
  //    Throws if: token is fake, expired, or tampered with
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // 4. Attach decoded user data to req so route handlers can use it
    //    e.g. in a route: console.log(req.user.email)
    req.user = decoded;

    next(); // ✅ all good — proceed to the route handler
  } catch {
    res.status(401).json({ error: "Token invalid or expired. Please login again." });
  }
}
