import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./error.js";
import { getDb } from "../db/index.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-prod";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    department: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("You are not logged in. Please log in to get access.", 401));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const db = await getDb();
    const currentUser = await db.get("SELECT id, role, department, is_active FROM Users WHERE id = ?", [decoded.id]);

    if (!currentUser) {
      return next(new AppError("The user belonging to this token does no longer exist.", 401));
    }

    if (currentUser.is_active === 0) {
      return next(new AppError("Your account is disabled. Please contact an administrator.", 403));
    }

    const normalizedDbRole = typeof currentUser.role === "string"
      ? currentUser.role.trim().toLowerCase()
      : currentUser.role;
    const normalizedTokenRole = typeof decoded.role === "string"
      ? decoded.role.trim().toLowerCase()
      : decoded.role;

    req.user = {
      ...currentUser,
      role: normalizedDbRole || normalizedTokenRole,
      token_role: normalizedTokenRole
    } as any;
    next();
  } catch (error) {
    next(new AppError("Invalid token or token expired.", 401));
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const rawRole = typeof req.user?.role === "string" ? req.user.role.trim().toLowerCase() : req.user?.role;
    const tokenRole = typeof (req.user as any)?.token_role === "string" ? (req.user as any).token_role.trim().toLowerCase() : undefined;
    const allowedRoles = roles.map((r) => r.toLowerCase());
    const matches = (role?: string) => {
      if (!role) return false;
      if (allowedRoles.includes(role)) return true;
      return allowedRoles.some((allowed) => role.startsWith(allowed));
    };
    if (!req.user || (!matches(rawRole as string) && !matches(tokenRole))) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }
    next();
  };
};
