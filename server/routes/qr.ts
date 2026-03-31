import express from "express";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { getDb } from "../db/index.js";
import { AppError } from "../middleware/error.js";
import { authenticate, restrictTo, AuthRequest } from "../middleware/auth.js";
import { z } from "zod";

const router = express.Router();

router.use(authenticate);

const generateSchema = z.object({
  class_id: z.string(),
  date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
});

router.post("/generate", restrictTo("lecturer", "admin"), async (req: AuthRequest, res, next) => {
  try {
    const data = generateSchema.parse(req.body);
    const db = await getDb();

    // Verify class belongs to lecturer
    if (req.user?.role === "lecturer") {
      const classData = await db.get("SELECT id FROM Classes WHERE id = ? AND lecturer_id = ?", [data.class_id, req.user.id]);
      if (!classData) {
        return next(new AppError("You do not have permission to generate QR for this class", 403));
      }
    }

    const sessionId = uuidv4();
    const qrCodeData = JSON.stringify({
      session_id: sessionId,
      class_id: data.class_id,
      timestamp: new Date().toISOString()
    });

    const qrCodeImage = await QRCode.toDataURL(qrCodeData);

    await db.run(
      "INSERT INTO Sessions (id, class_id, date, start_time, end_time, qr_code, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [sessionId, data.class_id, data.date, data.start_time, data.end_time, qrCodeData, "active"]
    );

    res.status(201).json({
      status: "success",
      data: {
        session_id: sessionId,
        qr_code_image: qrCodeImage,
        qr_code_data: qrCodeData
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.issues.map((e: any) => e.message).join(", "), 400));
    }
    next(error);
  }
});

export default router;
