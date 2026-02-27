import { Router, Response } from "express";
import { pool } from "../db/pool";
import { AuthRequest, authRequired, authOptional } from "../middleware/auth";

export const enquiryRoutes = Router();

// POST /api/enquiries — create enquiry (guest or authenticated)
enquiryRoutes.post("/", authOptional, async (req: AuthRequest, res: Response) => {
  try {
    const {
      center_id,
      guest_name,
      guest_email,
      guest_phone,
      guest_wechat_id,
      guest_child_age,
      guest_child_days_needed,
      guest_suburb,
      guest_message,
      guest_message_translated,
    } = req.body;

    if (!center_id) {
      return res.status(400).json({ error: "center_id is required" });
    }

    // Verify center exists
    const centerCheck = await pool.query("SELECT id FROM center_profiles WHERE id = $1", [center_id]);
    if (centerCheck.rows.length === 0) {
      return res.status(404).json({ error: "Center not found" });
    }

    const isGuest = !req.userId;

    if (isGuest && !guest_name && !guest_email) {
      return res.status(400).json({ error: "Guest name or email is required for guest enquiries" });
    }

    const result = await pool.query(
      `INSERT INTO enquiries (
        center_id, family_profile_id, guest_name, guest_email, guest_phone,
        guest_wechat_id, guest_child_age, guest_child_days_needed, guest_suburb,
        guest_message, guest_message_translated, is_guest, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'new')
      RETURNING *`,
      [
        center_id,
        req.userId || null,
        guest_name || null,
        guest_email || null,
        guest_phone || null,
        guest_wechat_id || null,
        guest_child_age || null,
        guest_child_days_needed || null,
        guest_suburb || null,
        guest_message || null,
        guest_message_translated || null,
        isGuest,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create enquiry error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/enquiries — get enquiries for current user
enquiryRoutes.get("/", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole === "family") {
      // Family sees their enquiries with center info
      const result = await pool.query(
        `SELECT
          e.*,
          json_build_object(
            'center_name', cp.center_name,
            'slug', cp.slug,
            'suburb', cp.suburb
          ) AS center_profiles
        FROM enquiries e
        LEFT JOIN center_profiles cp ON cp.id = e.center_id
        WHERE e.family_profile_id = $1
        ORDER BY e.created_at DESC`,
        [req.userId]
      );
      return res.json(result.rows);
    }

    if (req.userRole === "center") {
      // Center sees enquiries sent to their centers
      const result = await pool.query(
        `SELECT e.*
        FROM enquiries e
        INNER JOIN center_profiles cp ON cp.id = e.center_id
        WHERE cp.user_id = $1
        ORDER BY e.created_at DESC`,
        [req.userId]
      );
      return res.json(result.rows);
    }

    if (req.userRole === "admin") {
      // Admin sees all enquiries
      const result = await pool.query(
        `SELECT
          e.*,
          json_build_object(
            'center_name', cp.center_name,
            'slug', cp.slug,
            'suburb', cp.suburb
          ) AS center_profiles
        FROM enquiries e
        LEFT JOIN center_profiles cp ON cp.id = e.center_id
        ORDER BY e.created_at DESC`
      );
      return res.json(result.rows);
    }

    return res.status(403).json({ error: "Forbidden" });
  } catch (err) {
    console.error("List enquiries error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/enquiries/:id — update status/notes (center only)
enquiryRoutes.patch("/:id", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, center_notes } = req.body;

    // Verify ownership: center user must own the center this enquiry was sent to
    if (req.userRole === "center") {
      const ownership = await pool.query(
        `SELECT e.id FROM enquiries e
         INNER JOIN center_profiles cp ON cp.id = e.center_id
         WHERE e.id = $1 AND cp.user_id = $2`,
        [id, req.userId]
      );
      if (ownership.rows.length === 0) {
        return res.status(403).json({ error: "Not authorized to update this enquiry" });
      }
    } else if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Only centers and admins can update enquiries" });
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (status !== undefined) {
      params.push(status);
      updates.push(`status = $${paramIdx++}`);
    }
    if (center_notes !== undefined) {
      params.push(center_notes);
      updates.push(`center_notes = $${paramIdx++}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await pool.query(
      `UPDATE enquiries SET ${updates.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enquiry not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Update enquiry error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
