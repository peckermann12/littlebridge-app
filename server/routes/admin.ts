import { Router, Response } from "express";
import { pool } from "../db/pool";
import { AuthRequest, authRequired } from "../middleware/auth";

export const adminRoutes = Router();

// Middleware: admin only
function adminOnly(req: AuthRequest, res: Response, next: Function) {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// GET /api/admin/stats — overview stats
adminRoutes.get("/stats", authRequired, adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const [centersResult, enquiriesResult, familiesResult, educatorsResult, waitlistResult] =
      await Promise.all([
        pool.query("SELECT COUNT(*) as count FROM center_profiles"),
        pool.query("SELECT COUNT(*) as count FROM enquiries"),
        pool.query("SELECT COUNT(*) as count FROM family_profiles"),
        pool.query("SELECT COUNT(*) as count FROM educator_leads"),
        pool.query("SELECT COUNT(*) as count FROM waitlist"),
      ]);

    // Enquiry breakdown by status
    const statusBreakdown = await pool.query(
      `SELECT status, COUNT(*) as count FROM enquiries GROUP BY status`
    );

    return res.json({
      total_centers: parseInt(centersResult.rows[0].count),
      total_enquiries: parseInt(enquiriesResult.rows[0].count),
      total_families: parseInt(familiesResult.rows[0].count),
      total_educators: parseInt(educatorsResult.rows[0].count),
      total_waitlist: parseInt(waitlistResult.rows[0].count),
      enquiry_status_breakdown: statusBreakdown.rows,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/enquiries — all enquiries
adminRoutes.get("/enquiries", authRequired, adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
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
  } catch (err) {
    console.error("Admin enquiries error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/centers — all centers
adminRoutes.get("/centers", authRequired, adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
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
      GROUP BY cp.id
      ORDER BY cp.created_at DESC`
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("Admin centers error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/educators — all educator leads
adminRoutes.get("/educators", authRequired, adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM educator_leads ORDER BY created_at DESC`
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("Admin educators error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
