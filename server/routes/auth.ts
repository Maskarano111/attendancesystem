import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import rateLimit from "express-rate-limit";
import { getDb } from "../db/index.js";
import { AppError } from "../middleware/error.js";
import { z } from "zod";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-prod";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "your-super-secret-refresh-key-change-in-prod";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: "Too many login attempts from this IP, please try again after 15 minutes",
});

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  role: z.enum(["student", "lecturer", "admin", "department_head"]),
  department: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const db = await getDb();

    const existingUser = await db.get("SELECT id FROM Users WHERE email = ? OR username = ?", [data.email, data.username]);
    if (existingUser) {
      return next(new AppError("Email or username already exists", 400));
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const id = uuidv4();

    await db.run(
      "INSERT INTO Users (id, username, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?, ?)",
      [id, data.username, data.email, hashedPassword, data.role, data.department || null]
    );

    const accessToken = jwt.sign({ id, role: data.role }, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id }, REFRESH_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      status: "success",
      token: accessToken,
      refreshToken,
      data: {
        user: { id, username: data.username, email: data.email, role: data.role, department: data.department }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.issues.map((e: any) => e.message).join(", "), 400));
    }
    next(error);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const db = await getDb();

    const user = await db.get("SELECT * FROM Users WHERE email = ?", [data.email]);
    
    if (!user || !(await bcrypt.compare(data.password, user.password_hash))) {
      // Log failed login attempt
      const auditId = uuidv4();
      await db.run(
        "INSERT INTO Audit_Log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)",
        [auditId, "unknown", "FAILED_LOGIN", "Auth", data.email]
      );
      return next(new AppError("Incorrect email or password", 401));
    }

    if (user.is_active === 0) {
      return next(new AppError("Your account is disabled. Please contact an administrator.", 403));
    }

    const accessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: "7d" });

    // Log successful login
    const auditId = uuidv4();
    await db.run(
      "INSERT INTO Audit_Log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)",
      [auditId, user.id, "LOGIN", "Auth", user.id]
    );

    res.status(200).json({
      status: "success",
      token: accessToken,
      refreshToken,
      data: {
        user: { id: user.id, username: user.username, email: user.email, role: user.role, department: user.department }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.issues.map((e: any) => e.message).join(", "), 400));
    }
    next(error);
  }
});

router.post("/refresh-token", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return next(new AppError("Refresh token is required", 400));
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as any;
    const db = await getDb();
    const user = await db.get("SELECT id, role, department FROM Users WHERE id = ?", [decoded.id]);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.is_active === 0) {
      return next(new AppError("Your account is disabled", 403));
    }

    const newAccessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "15m" });

    res.status(200).json({
      status: "success",
      token: newAccessToken,
      data: { message: "Token refreshed successfully" }
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError("Invalid or expired refresh token", 401));
    }
    next(error);
  }
});

export default router;
