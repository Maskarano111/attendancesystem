import express from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "../db/index";
import { AppError } from "../middleware/error";
import { authenticate, restrictTo, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticate);
router.use(restrictTo("admin", "department_head"));

const createUserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  role: z.enum(["student", "lecturer", "admin", "department_head"]),
  department: z.string().optional(),
  password: z.string().min(6).optional()
});

const updateUserSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  role: z.enum(["student", "lecturer", "admin", "department_head"]).optional(),
  department: z.string().optional(),
  is_active: z.number().int().optional()
});

const createClassSchema = z.object({
  code: z.string().min(3),
  name: z.string().min(3),
  lecturer_id: z.string(),
  schedule: z.string().optional(),
  department: z.string(),
  capacity: z.number().int().positive()
});

const updateClassSchema = z.object({
  code: z.string().min(3).optional(),
  name: z.string().min(3).optional(),
  lecturer_id: z.string().optional(),
  schedule: z.string().optional(),
  department: z.string().optional(),
  capacity: z.number().int().positive().optional()
});

const createSessionSchema = z.object({
  class_id: z.string(),
  date: z.string(),
  start_time: z.string(),
  end_time: z.string()
});

const settingsSchema = z.object({
  term_start: z.string().optional(),
  term_end: z.string().optional(),
  qr_expiry_minutes: z.number().int().positive().optional(),
  attendance_rules: z.string().optional()
});

const logAudit = async (db: any, userId: string, action: string, entityType: string, entityId: string) => {
  const auditId = uuidv4();
  await db.run(
    "INSERT INTO Audit_Log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)",
    [auditId, userId, action, entityType, entityId]
  );
};

router.get("/users", async (req: AuthRequest, res, next) => {
  try {
    const db = await getDb();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    let query = "SELECT id, username, email, role, department, is_active, created_at FROM Users";
    const params: any[] = [];

    if (req.user?.role === "department_head") {
      query += " WHERE department = ?";
      params.push(req.user.department);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const users = await db.all(query, params);
    
    // Get total count
    let countQuery = "SELECT COUNT(*) as count FROM Users";
    const countParams: any[] = [];
    if (req.user?.role === "department_head") {
      countQuery += " WHERE department = ?";
      countParams.push(req.user.department);
    }
    
    const { count } = await db.get(countQuery, countParams);

    res.status(200).json({ 
      status: "success", 
      data: { 
        users,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      } 
    });
  } catch (error) {
    next(error);
  }
});

router.post("/users", async (req: AuthRequest, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);
    const db = await getDb();

    if (req.user?.role === "department_head" && data.department && data.department !== req.user.department) {
      return next(new AppError("You can only manage users in your department", 403));
    }

    const id = uuidv4();
    const password = data.password || "password";
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.run(
      "INSERT INTO Users (id, username, email, password_hash, role, department, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)",
      [id, data.username, data.email, hashedPassword, data.role, data.department || null]
    );

    await logAudit(db, req.user!.id, "CREATE_USER", "Users", id);

    res.status(201).json({ status: "success", data: { user: { id, ...data, is_active: 1 } } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.issues.map((e: any) => e.message).join(", "), 400));
    }
    next(error);
  }
});

router.put("/users/:id", async (req: AuthRequest, res, next) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const db = await getDb();

    let userToUpdate = await db.get(
      "SELECT id, department FROM Users WHERE id = ? OR email = ? OR username = ?",
      [req.params.id, req.params.id, req.params.id]
    );
    if (!userToUpdate && data.email) {
      userToUpdate = await db.get("SELECT id, department FROM Users WHERE email = ?", [data.email]);
    }
    if (!userToUpdate && data.username) {
      userToUpdate = await db.get("SELECT id, department FROM Users WHERE username = ?", [data.username]);
    }
    if (!userToUpdate) return next(new AppError("User not found", 404));

    if (req.user?.role === "department_head" && userToUpdate.department !== req.user.department) {
      return next(new AppError("You can only manage users in your department", 403));
    }

    const fields = Object.keys(data);
    if (fields.length === 0) return next(new AppError("No fields to update", 400));

    const setClause = fields.map((f) => `${f} = ?`).join(", ");
    const values = fields.map((f) => (data as any)[f]);
    values.push(userToUpdate.id);

    await db.run(`UPDATE Users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
    await logAudit(db, req.user!.id, "UPDATE_USER", "Users", userToUpdate.id);

    res.status(200).json({ status: "success", data: { id: userToUpdate.id, ...data } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.issues.map((e: any) => e.message).join(", "), 400));
    }
    next(error);
  }
});

router.patch("/users/:id/status", async (req: AuthRequest, res, next) => {
  try {
    const { is_active } = req.body;
    const db = await getDb();

    await db.run("UPDATE Users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [is_active ? 1 : 0, req.params.id]);
    await logAudit(db, req.user!.id, is_active ? "ENABLE_USER" : "DISABLE_USER", "Users", req.params.id);

    res.status(200).json({ status: "success" });
  } catch (error) {
    next(error);
  }
});

router.post("/users/:id/reset-password", async (req: AuthRequest, res, next) => {
  try {
    const db = await getDb();
    const newPassword = "password";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.run("UPDATE Users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [hashedPassword, req.params.id]);
    await logAudit(db, req.user!.id, "RESET_PASSWORD", "Users", req.params.id);

    res.status(200).json({ status: "success", data: { tempPassword: newPassword } });
  } catch (error) {
    next(error);
  }
});

router.get("/reports", async (req: AuthRequest, res, next) => {
  try {
    const db = await getDb();
    const totalUsers = await db.get("SELECT COUNT(*) as count FROM Users");
    const totalClasses = await attendanceStats(db);
    
    res.status(200).json({
      status: "success",
      data: {
        totalUsers: totalUsers.count,
        attendanceStats: totalClasses
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/classes", async (req: AuthRequest, res, next) => {
  try {
    const db = await getDb();
    let query = "SELECT c.*, u.username as lecturer_name FROM Classes c JOIN Users u ON c.lecturer_id = u.id";
    const params: any[] = [];

    if (req.user?.role === "department_head") {
      query += " WHERE c.department = ?";
      params.push(req.user.department);
    }

    const classes = await db.all(query, params);
    res.status(200).json({ status: "success", data: { classes } });
  } catch (error) {
    next(error);
  }
});

router.post("/classes", async (req: AuthRequest, res, next) => {
  try {
    const data = createClassSchema.parse(req.body);
    const db = await getDb();
    const id = uuidv4();

    if (req.user?.role === "department_head" && data.department !== req.user.department) {
      return next(new AppError("You can only manage classes in your department", 403));
    }

    await db.run(
      "INSERT INTO Classes (id, code, name, lecturer_id, schedule, department, capacity) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, data.code, data.name, data.lecturer_id, data.schedule || null, data.department, data.capacity]
    );

    await logAudit(db, req.user!.id, "CREATE_CLASS", "Classes", id);
    res.status(201).json({ status: "success", data: { class: { id, ...data } } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.issues.map((e: any) => e.message).join(", "), 400));
    }
    next(error);
  }
});

router.put("/classes/:id", async (req: AuthRequest, res, next) => {
  try {
    const data = updateClassSchema.parse(req.body);
    const db = await getDb();

    const classToUpdate = await db.get("SELECT id, department FROM Classes WHERE id = ?", [req.params.id]);
    if (!classToUpdate) return next(new AppError("Class not found", 404));

    if (req.user?.role === "department_head" && classToUpdate.department !== req.user.department) {
      return next(new AppError("You can only manage classes in your department", 403));
    }

    const fields = Object.keys(data);
    if (fields.length === 0) return next(new AppError("No fields to update", 400));

    const setClause = fields.map((f) => `${f} = ?`).join(", ");
    const values = fields.map((f) => (data as any)[f]);
    values.push(req.params.id);

    await db.run(`UPDATE Classes SET ${setClause} WHERE id = ?`, values);
    await logAudit(db, req.user!.id, "UPDATE_CLASS", "Classes", req.params.id);

    res.status(200).json({ status: "success", data: { id: req.params.id, ...data } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.issues.map((e: any) => e.message).join(", "), 400));
    }
    next(error);
  }
});

router.delete("/classes/:id", async (req: AuthRequest, res, next) => {
  try {
    const db = await getDb();
    await db.run("DELETE FROM Classes WHERE id = ?", [req.params.id]);
    await logAudit(db, req.user!.id, "DELETE_CLASS", "Classes", req.params.id);
    res.status(200).json({ status: "success" });
  } catch (error) {
    next(error);
  }
});

router.get("/sessions", async (req: AuthRequest, res, next) => {
  try {
    const db = await getDb();
    const sessions = await db.all(`
      SELECT s.*, c.name as class_name
      FROM Sessions s
      JOIN Classes c ON s.class_id = c.id
      ORDER BY s.date DESC, s.start_time DESC
    `);
    res.status(200).json({ status: "success", data: { sessions } });
  } catch (error) {
    next(error);
  }
});

router.post("/sessions", async (req: AuthRequest, res, next) => {
  try {
    const data = createSessionSchema.parse(req.body);
    const db = await getDb();
    const id = uuidv4();

    await db.run(
      "INSERT INTO Sessions (id, class_id, date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, 'active')",
      [id, data.class_id, data.date, data.start_time, data.end_time]
    );

    await logAudit(db, req.user!.id, "CREATE_SESSION", "Sessions", id);
    res.status(201).json({ status: "success", data: { session: { id, ...data, status: "active" } } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.issues.map((e: any) => e.message).join(", "), 400));
    }
    next(error);
  }
});

router.patch("/sessions/:id/close", async (req: AuthRequest, res, next) => {
  try {
    const db = await getDb();
    await db.run("UPDATE Sessions SET status = 'closed' WHERE id = ?", [req.params.id]);
    await logAudit(db, req.user!.id, "CLOSE_SESSION", "Sessions", req.params.id);
    res.status(200).json({ status: "success" });
  } catch (error) {
    next(error);
  }
});

router.get("/audit", async (req: AuthRequest, res, next) => {
  try {
    const db = await getDb();
    const logs = await db.all(`
      SELECT a.*, u.username
      FROM Audit_Log a
      JOIN Users u ON a.user_id = u.id
      ORDER BY a.timestamp DESC
      LIMIT 200
    `);
    res.status(200).json({ status: "success", data: { logs } });
  } catch (error) {
    next(error);
  }
});

router.get("/settings", async (req: AuthRequest, res, next) => {
  try {
    const db = await getDb();
    const rows = await db.all("SELECT key, value FROM Settings");
    const settings: any = {};
    rows.forEach((r: any) => {
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch {
        settings[r.key] = r.value;
      }
    });
    res.status(200).json({ status: "success", data: { settings } });
  } catch (error) {
    next(error);
  }
});

router.put("/settings", async (req: AuthRequest, res, next) => {
  try {
    const data = settingsSchema.parse(req.body);
    const db = await getDb();
    const entries = Object.entries(data).filter(([, v]) => v !== undefined);

    for (const [key, value] of entries) {
      await db.run(
        "INSERT INTO Settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
        [key, JSON.stringify(value)]
      );
    }

    await logAudit(db, req.user!.id, "UPDATE_SETTINGS", "Settings", "global");
    res.status(200).json({ status: "success" });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.issues.map((e: any) => e.message).join(", "), 400));
    }
    next(error);
  }
});

async function attendanceStats(db: any) {
  const stats = await db.all(`
    SELECT c.id as class_id, c.name as class_name, COUNT(a.id) as attendance_count
    FROM Classes c
    LEFT JOIN Attendance a ON c.id = a.class_id
    GROUP BY c.id
  `);
  return stats;
}

export default router;
