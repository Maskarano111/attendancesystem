import path from "path";
import fs from "fs";

const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const errorLogPath = path.join(logsDir, "error.log");
const combinedLogPath = path.join(logsDir, "combined.log");

const formatLog = (level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data }),
    service: "smart-attendance",
  };
  return JSON.stringify(logEntry);
};

const logger = {
  info: (message: string, data?: any) => {
    const log = formatLog("info", message, data);
    console.log(`[INFO] ${message}`, data || "");
    fs.appendFileSync(combinedLogPath, log + "\n");
  },
  
  warn: (message: string, data?: any) => {
    const log = formatLog("warn", message, data);
    console.warn(`[WARN] ${message}`, data || "");
    fs.appendFileSync(combinedLogPath, log + "\n");
  },
  
  error: (message: string, data?: any) => {
    const log = formatLog("error", message, data);
    console.error(`[ERROR] ${message}`, data || "");
    fs.appendFileSync(errorLogPath, log + "\n");
    fs.appendFileSync(combinedLogPath, log + "\n");
  },
  
  log: (data: any) => {
    const log = JSON.stringify(data);
    console.log(log);
    fs.appendFileSync(combinedLogPath, log + "\n");
  },
};

export default logger;
