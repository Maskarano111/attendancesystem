import express from "express";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/index.js";
import { AppError } from "../middleware/error.js";
import { authenticate, restrictTo, AuthRequest } from "../middleware/auth.js";
import { z } from "zod";

const router = express.Router();

const classSchema = z.object({
  code: z.string().min(3),
  name: z.string().min(3),
  schedule: z.string(),
  department: z.string(),
  capacity: z.number().int().positive(),
});

router.use(authenticate);

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const db = await getDb();
    let query = "SELECT c.*, u.username as lecturer_name FROM Classes c JOIN Users u ON c.lecturer_id = u.id";
    const params: any[] = [];

    if (req.user?.role === "lecturer") {
      query += " WHERE c.lecturer_id = ?";
      params.push(req.user.id);
    } else if (req.user?.role === "department_head") {
      query += " WHERE c.department = ?";
      params.push(req.user.department);
    }

    const classes = await db.all(query, params);
    res.status(200).json({ status: "success", data: { classes } });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const role = typeof (req.user as any)?.role === "string"
      ? (req.user as any).role.trim().toLowerCase()
      : (req.user as any)?.token_role;

    if (role === "student") {
      return next(new AppError(`Only lecturers or admins can create classes. Current role: ${role}`, 403));
    }

    const data = classSchema.parse(req.body);
    const db = await getDb();
    const id = uuidv4();

    // Lecturer creates own class; admins pass lecturer_id
    const lecturer_id = role === "lecturer" ? req.user?.id : req.body.lecturer_id;
    if (!lecturer_id) return next(new AppError("Lecturer ID is required", 400));

    await db.run(
      "INSERT INTO Classes (id, code, name, lecturer_id, schedule, department, capacity) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, data.code, data.name, lecturer_id, data.schedule, data.department, data.capacity]
    );

    res.status(201).json({ status: "success", data: { class: { id, ...data, lecturer_id } } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.issues.map((e: any) => e.message).join(", "), 400));
    }
    next(error);
  }
});

export default router;
