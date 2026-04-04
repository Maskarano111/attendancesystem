import { Request, Response, NextFunction } from "express";
import logger from "./logger";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? "warn" : "info";

    logger.log({
      level,
      message: `${req.method} ${req.url}`,
      statusCode: res.statusCode,
      method: req.method,
      url: req.url,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
};
