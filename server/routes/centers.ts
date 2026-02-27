import { Router, Request, Response } from "express";
import { pool } from "../db/pool";

export const centerRoutes = Router();

// GET /api/centers — list all centers (with photos, filterable)
centerRoutes.get("/", async (req: Request, res: Response) => {
  try {
    const { search, language, ccs } = req.query;

    let query = `
      SELECT
        cp.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ph.id,
              'photo_url', ph.photo_url,
              'display_order', ph.display_order
            ) ORDER BY ph.display_order
          ) FILTER (WHERE ph.id IS NOT NULL),
          '[]'
        ) AS center_photos
      FROM center_profiles cp
      LEFT JOIN center_photos ph ON ph.center_id = cp.id
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (search && typeof search === "string" && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(
        `(LOWER(cp.center_name) LIKE $${params.length} OR LOWER(cp.suburb) LIKE $${params.length} OR LOWER(cp.postcode) LIKE $${params.length})`
      );
    }

    if (language && typeof language === "string" && language.trim()) {
      params.push(`%${language.trim()}%`);
      conditions.push(`cp.staff_languages::text ILIKE $${params.length}`);
    }

    if (ccs === "true") {
      conditions.push(`cp.is_ccs_approved = true`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " GROUP BY cp.id ORDER BY cp.is_founding_partner DESC, cp.center_name ASC";

    const result = await pool.query(query, params);

    return res.json(result.rows);
  } catch (err) {
    console.error("Centers list error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/centers/:slug — get single center by slug
centerRoutes.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT
        cp.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ph.id,
              'photo_url', ph.photo_url,
              'display_order', ph.display_order
            ) ORDER BY ph.display_order
          ) FILTER (WHERE ph.id IS NOT NULL),
          '[]'
        ) AS center_photos
      FROM center_profiles cp
      LEFT JOIN center_photos ph ON ph.center_id = cp.id
      WHERE cp.slug = $1
      GROUP BY cp.id`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Center not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Center detail error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
