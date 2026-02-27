import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db/pool";
import { AuthRequest, authRequired, signToken } from "../middleware/auth";

export const authRoutes = Router();

// POST /api/auth/signup
authRoutes.post("/signup", async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "Email, password, and role are required" });
    }

    if (!["family", "educator", "center", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check if email already exists
    const existing = await pool.query("SELECT id FROM profiles WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO profiles (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role, preferred_language, is_active, onboarding_completed, created_at`,
      [email, passwordHash, role]
    );

    const user = result.rows[0];
    const token = signToken(user.id, user.role);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(201).json({ user });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/signin
authRoutes.post("/signin", async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await pool.query(
      `SELECT id, email, password_hash, role, preferred_language, is_active, onboarding_completed, created_at
       FROM profiles WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user.id, user.role);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password_hash: _, ...safeUser } = user;
    return res.json({ user: safeUser });
  } catch (err) {
    console.error("Signin error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/signout
authRoutes.post("/signout", (_req: AuthRequest, res: Response) => {
  res.clearCookie("token");
  return res.json({ message: "Signed out" });
});

// GET /api/auth/me
authRoutes.get("/me", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, email, role, preferred_language, is_active, onboarding_completed, created_at
       FROM profiles WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("Auth me error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
