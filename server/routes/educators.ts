import { Router, Request, Response } from "express";
import { pool } from "../db/pool";

export const educatorRoutes = Router();

// POST /api/educators — create educator lead (public, no auth)
educatorRoutes.post("/", async (req: Request, res: Response) => {
  try {
    const { full_name, email, suburb, languages, qualification, wwcc_number } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ error: "Full name and email are required" });
    }

    const result = await pool.query(
      `INSERT INTO educator_leads (full_name, email, suburb, languages, qualification, wwcc_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        full_name,
        email,
        suburb || null,
        languages || [],
        qualification || null,
        wwcc_number || null,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create educator lead error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
