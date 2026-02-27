import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET =
  process.env.JWT_SECRET || "littlebridge-dev-secret-change-in-production";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function authRequired(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      role: string;
    };
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function authOptional(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  const token = req.cookies?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        role: string;
      };
      req.userId = decoded.id;
      req.userRole = decoded.role;
    } catch {
      // Ignore invalid tokens for optional auth
    }
  }
  next();
}

export function signToken(id: string, role: string): string {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: "7d" });
}
