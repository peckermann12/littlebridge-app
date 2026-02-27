import { Router, Response } from "express";
import { pool } from "../db/pool";
import { AuthRequest, authRequired } from "../middleware/auth";

export const familyRoutes = Router();

// GET /api/families/profile — get family profile for current user
familyRoutes.get("/profile", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM family_profiles WHERE user_id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Family profile not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Get family profile error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/families/profile — update (or create) family profile
familyRoutes.put("/profile", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const {
      family_name,
      suburb,
      postcode,
      state,
      mobile_phone,
      wechat_id,
      preferred_contact,
      priorities,
    } = req.body;

    // Upsert: insert if not exists, update if exists
    const result = await pool.query(
      `INSERT INTO family_profiles (user_id, family_name, suburb, postcode, state, mobile_phone, wechat_id, preferred_contact, priorities)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id) DO UPDATE SET
         family_name = COALESCE(EXCLUDED.family_name, family_profiles.family_name),
         suburb = COALESCE(EXCLUDED.suburb, family_profiles.suburb),
         postcode = COALESCE(EXCLUDED.postcode, family_profiles.postcode),
         state = COALESCE(EXCLUDED.state, family_profiles.state),
         mobile_phone = COALESCE(EXCLUDED.mobile_phone, family_profiles.mobile_phone),
         wechat_id = COALESCE(EXCLUDED.wechat_id, family_profiles.wechat_id),
         preferred_contact = COALESCE(EXCLUDED.preferred_contact, family_profiles.preferred_contact),
         priorities = COALESCE(EXCLUDED.priorities, family_profiles.priorities),
         updated_at = NOW()
       RETURNING *`,
      [
        req.userId,
        family_name || null,
        suburb || null,
        postcode || null,
        state || null,
        mobile_phone || null,
        wechat_id || null,
        preferred_contact || "email",
        priorities || [],
      ]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Update family profile error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/families/children — get children for current family
familyRoutes.get("/children", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    // First get family profile id
    const family = await pool.query(
      `SELECT id FROM family_profiles WHERE user_id = $1`,
      [req.userId]
    );

    if (family.rows.length === 0) {
      return res.json([]);
    }

    const result = await pool.query(
      `SELECT * FROM family_children WHERE family_id = $1 ORDER BY date_of_birth ASC`,
      [family.rows[0].id]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("Get children error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/families/children — add child
familyRoutes.post("/children", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const { child_name, date_of_birth, days_needed, notes } = req.body;

    // Get or create family profile
    let familyResult = await pool.query(
      `SELECT id FROM family_profiles WHERE user_id = $1`,
      [req.userId]
    );

    if (familyResult.rows.length === 0) {
      // Auto-create a family profile
      familyResult = await pool.query(
        `INSERT INTO family_profiles (user_id) VALUES ($1) RETURNING id`,
        [req.userId]
      );
    }

    const familyId = familyResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO family_children (family_id, child_name, date_of_birth, days_needed, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        familyId,
        child_name || null,
        date_of_birth || null,
        days_needed || [],
        notes || null,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Add child error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/families/children/:id — update child
familyRoutes.put("/children/:id", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { child_name, date_of_birth, days_needed, notes } = req.body;

    // Verify ownership through family profile
    const ownership = await pool.query(
      `SELECT fc.id FROM family_children fc
       INNER JOIN family_profiles fp ON fp.id = fc.family_id
       WHERE fc.id = $1 AND fp.user_id = $2`,
      [id, req.userId]
    );

    if (ownership.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized to update this child" });
    }

    const result = await pool.query(
      `UPDATE family_children SET
        child_name = COALESCE($1, child_name),
        date_of_birth = COALESCE($2, date_of_birth),
        days_needed = COALESCE($3, days_needed),
        notes = COALESCE($4, notes)
       WHERE id = $5
       RETURNING *`,
      [
        child_name || null,
        date_of_birth || null,
        days_needed || null,
        notes || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Child not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Update child error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
