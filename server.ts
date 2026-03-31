import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { initializeDatabase } from "./server/db/index.js";
import authRoutes from "./server/routes/auth.js";
import attendanceRoutes from "./server/routes/attendance.js";
import classRoutes from "./server/routes/classes.js";
import qrRoutes from "./server/routes/qr.js";
import adminRoutes from "./server/routes/admin.js";
import { errorHandler } from "./server/middleware/error.js";
import { requestLogger } from "./server/middleware/requestLogger.js";
import { sanitize } from "./server/middleware/sanitize.js";
import logger from "./server/middleware/logger.js";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 8000;

  // Middleware
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:8000", "http://localhost:5173"];
  
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));
  
  app.use(express.json({ limit: "10mb" }));
  app.use(requestLogger);
  app.use(sanitize);

  // Initialize DB
  await initializeDatabase();

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/attendance", attendanceRoutes);
  app.use("/api/classes", classRoutes);
  app.use("/api/qr", qrRoutes);
  app.use("/api/admin", adminRoutes);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Error handling middleware
  app.use(errorHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
