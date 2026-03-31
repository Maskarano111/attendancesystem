import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  
  const dbDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = await open({
    filename: path.join(dbDir, "database.sqlite"),
    driver: sqlite3.Database
  });

  return dbInstance;
}

export async function initializeDatabase() {
  const db = await getDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'lecturer', 'admin', 'department_head')),
      department TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Classes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      lecturer_id TEXT NOT NULL,
      schedule TEXT,
      department TEXT,
      capacity INTEGER,
      FOREIGN KEY (lecturer_id) REFERENCES Users(id)
    );

    CREATE TABLE IF NOT EXISTS Sessions (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      qr_code TEXT UNIQUE,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'closed')),
      FOREIGN KEY (class_id) REFERENCES Classes(id)
    );

    CREATE TABLE IF NOT EXISTS Attendance (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'present' CHECK(status IN ('present', 'late', 'absent', 'excused')),
      marked_by TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES Users(id),
      FOREIGN KEY (class_id) REFERENCES Classes(id),
      FOREIGN KEY (session_id) REFERENCES Sessions(id),
      UNIQUE(student_id, session_id)
    );

    CREATE TABLE IF NOT EXISTS Audit_Log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES Users(id)
    );

    CREATE TABLE IF NOT EXISTS Settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Lightweight migrations
  const userColumns = await db.all("PRAGMA table_info(Users)");
  const userColumnNames = userColumns.map((c: any) => c.name);
  if (!userColumnNames.includes("is_active")) {
    await db.exec("ALTER TABLE Users ADD COLUMN is_active INTEGER DEFAULT 1");
  }
  await db.exec("UPDATE Users SET is_active = 1 WHERE is_active IS NULL");

  // Add student verification columns to Attendance table
  const attendanceColumns = await db.all("PRAGMA table_info(Attendance)");
  const attendanceColumnNames = attendanceColumns.map((c: any) => c.name);
  if (!attendanceColumnNames.includes("student_name")) {
    await db.exec("ALTER TABLE Attendance ADD COLUMN student_name TEXT");
  }
  if (!attendanceColumnNames.includes("student_index_number")) {
    await db.exec("ALTER TABLE Attendance ADD COLUMN student_index_number TEXT");
  }
  if (!attendanceColumnNames.includes("student_email")) {
    await db.exec("ALTER TABLE Attendance ADD COLUMN student_email TEXT");
  }

  // Enable WAL mode for better concurrency
  await db.exec("PRAGMA journal_mode = WAL");

  // Create indexes for performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_attendance_student ON Attendance(student_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_session ON Attendance(session_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_class ON Attendance(class_id);
    CREATE INDEX IF NOT EXISTS idx_classes_lecturer ON Classes(lecturer_id);
    CREATE INDEX IF NOT EXISTS idx_classes_department ON Classes(department);
    CREATE INDEX IF NOT EXISTS idx_sessions_class ON Sessions(class_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON Sessions(date);
    CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON Users(role);
    CREATE INDEX IF NOT EXISTS idx_audit_user ON Audit_Log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON Audit_Log(timestamp);
  `);

  // Create demo users if not exists
  const demoPassword = await bcrypt.hash("password", 10);
  
  const adminExists = await db.get("SELECT id FROM Users WHERE email = 'admin@demo.com'");
  if (!adminExists) {
    await db.run(
      "INSERT INTO Users (id, username, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?, ?)",
      ["admin-demo-1", "admin_demo", "admin@demo.com", demoPassword, "admin", "IT"]
    );
    console.log("Demo admin created: admin@demo.com / password");
  }

  const lecturerExists = await db.get("SELECT id FROM Users WHERE email = 'lecturer@demo.com'");
  if (!lecturerExists) {
    await db.run(
      "INSERT INTO Users (id, username, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?, ?)",
      ["lecturer-demo-1", "lecturer_demo", "lecturer@demo.com", demoPassword, "lecturer", "Computer Science"]
    );
    console.log("Demo lecturer created: lecturer@demo.com / password");
  }

  const studentExists = await db.get("SELECT id FROM Users WHERE email = 'student@demo.com'");
  if (!studentExists) {
    await db.run(
      "INSERT INTO Users (id, username, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?, ?)",
      ["student-demo-1", "student_demo", "student@demo.com", demoPassword, "student", "Computer Science"]
    );
    console.log("Demo student created: student@demo.com / password");
  }
}
