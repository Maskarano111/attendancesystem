import express from "express";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/index.js";
import { AppError } from "../middleware/error.js";
import { authenticate, restrictTo, AuthRequest } from "../middleware/auth.js";
import { z } from "zod";

const router = express.Router();

router.use(authenticate);

const markSchema = z.object({
  qr_data: z.string(),
  student_name: z.string().min(2, "Name must be at least 2 characters"),
  student_index_number: z.string().min(1, "Index number is required"),
  student_email: z.string().email("Invalid email format")
});

router.post("/mark", restrictTo("student"), async (req: AuthRequest, res, next) => {
  try {
    const data = markSchema.parse(req.body);
    const db = await getDb();

    let qrPayload;
    try {
      qrPayload = JSON.parse(data.qr_data);
    } catch (e) {
      return next(new AppError("Invalid QR Code format", 400));
    }

    const { session_id, class_id } = qrPayload;

    const session = await db.get("SELECT * FROM Sessions WHERE id = ?", [session_id]);
    if (!session) {
      return next(new AppError("Invalid session", 404));
    }

    if (session.status !== "active") {
      return next(new AppError("This attendance session is closed", 400));
    }

    const existingAttendance = await db.get(
      "SELECT id FROM Attendance WHERE student_id = ? AND session_id = ?",
      [req.user?.id, session_id]
    );

    if (existingAttendance) {
      return next(new AppError("Attendance already marked for this session", 400));
    }

    const id = uuidv4();
    await db.run(
      "INSERT INTO Attendance (id, student_id, class_id, session_id, status, marked_by, student_name, student_index_number, student_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, req.user?.id, class_id, session_id, "present", req.user?.id, data.student_name, data.student_index_number, data.student_email]
    );

    const auditId = uuidv4();
    await db.run(
      "INSERT INTO Audit_Log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)",
      [auditId, req.user?.id, "MARK_ATTENDANCE", "Attendance", id]
    );

    res.status(201).json({ status: "success", message: "Attendance marked successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.issues.map((e: any) => e.message).join(", "), 400));
    }
    next(error);
  }
});

router.get("/records", async (req: AuthRequest, res, next) => {
  try {
    const db = await getDb();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*, c.name as class_name, s.date as session_date, u.username as student_name
      FROM Attendance a
      JOIN Classes c ON a.class_id = c.id
      JOIN Sessions s ON a.session_id = s.id
      JOIN Users u ON a.student_id = u.id
    `;
    const params: any[] = [];

    if (req.user?.role === "student") {
      query += " WHERE a.student_id = ?";
      params.push(req.user.id);
    } else if (req.user?.role === "lecturer") {
      query += " WHERE c.lecturer_id = ?";
      params.push(req.user.id);
    }

    query += " ORDER BY a.timestamp DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const records = await db.all(query, params);
    
    // Get total count
    let countQuery = "SELECT COUNT(*) as count FROM Attendance a JOIN Classes c ON a.class_id = c.id";
    if (req.user?.role === "student") {
      countQuery += " WHERE a.student_id = ?";
    } else if (req.user?.role === "lecturer") {
      countQuery += " WHERE c.lecturer_id = ?";
    }
    
    const countCountParams = req.user?.role === "student" || req.user?.role === "lecturer" ? [req.user.id] : [];
    const { count } = await db.get(countQuery, countCountParams);

    res.status(200).json({ 
      status: "success", 
      data: { 
        records,
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

router.get("/sessions", async (req: AuthRequest, res, next) => {
  try {
    const db = await getDb();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*, c.name as class_name, c.code as class_code, c.department as class_department
      FROM Sessions s
      JOIN Classes c ON s.class_id = c.id
    `;
    const params: any[] = [];

    if (req.user?.role === "lecturer") {
      query += " WHERE c.lecturer_id = ?";
      params.push(req.user.id);
    } else if (req.user?.role === "department_head") {
      query += " WHERE c.department = ?";
      params.push(req.user.department);
    } else if (req.user?.role === "student") {
      query += " WHERE 1 = 0";
    }

    query += " ORDER BY s.date DESC, s.start_time DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const sessions = await db.all(query, params);
    
    // Get total count
    let countQuery = "SELECT COUNT(*) as count FROM Sessions s JOIN Classes c ON s.class_id = c.id";
    const countParams: any[] = [];
    if (req.user?.role === "lecturer") {
      countQuery += " WHERE c.lecturer_id = ?";
      countParams.push(req.user.id);
    } else if (req.user?.role === "department_head") {
      countQuery += " WHERE c.department = ?";
      countParams.push(req.user.department);
    }
    
    const { count } = await db.get(countQuery, countParams);

    res.status(200).json({ 
      status: "success", 
      data: { 
        sessions,
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

export default router;
