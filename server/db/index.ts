import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

let dbInstance: Database.Database | null = null;

function getDbSync(): Database.Database {
  if (dbInstance) return dbInstance;
  
  const dbDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const rawDb = new Database(path.join(dbDir, "database.sqlite"));
  
  // Wrap the database object to provide sqlite-compatible API
  const wrappedDb = {
    ...rawDb,
    get: (sql: string, params?: any[]): any => {
      return rawDb.prepare(sql).get(...(params || []));
    },
    all: (sql: string, params?: any[]): any[] => {
      return rawDb.prepare(sql).all(...(params || []));
    },
    run: (sql: string, params?: any[]): any => {
      return rawDb.prepare(sql).run(...(params || []));
    },
    exec: (sql: string): any => {
      return rawDb.exec(sql);
    }
  } as any;
  
  dbInstance = wrappedDb;
  return dbInstance;
}

// Async wrapper for compatibility with existing code
export async function getDb(): Promise<any> {
  return getDbSync();
}

export async function initializeDatabase() {
  const db = getDbSync();

  db.exec(`
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
  const userColumns = db.prepare("PRAGMA table_info(Users)").all();
  const userColumnNames = userColumns.map((c: any) => c.name);
  if (!userColumnNames.includes("is_active")) {
    db.exec("ALTER TABLE Users ADD COLUMN is_active INTEGER DEFAULT 1");
  }
  db.exec("UPDATE Users SET is_active = 1 WHERE is_active IS NULL");

  // Add student verification columns to Attendance table
  const attendanceColumns = db.prepare("PRAGMA table_info(Attendance)").all();
  const attendanceColumnNames = attendanceColumns.map((c: any) => c.name);
  if (!attendanceColumnNames.includes("student_name")) {
    db.exec("ALTER TABLE Attendance ADD COLUMN student_name TEXT");
  }
  if (!attendanceColumnNames.includes("student_index_number")) {
    db.exec("ALTER TABLE Attendance ADD COLUMN student_index_number TEXT");
  }
  if (!attendanceColumnNames.includes("student_email")) {
    db.exec("ALTER TABLE Attendance ADD COLUMN student_email TEXT");
  }

  // Enable WAL mode for better concurrency
  db.exec("PRAGMA journal_mode = WAL");

  // Create indexes for performance
  db.exec(`
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
  const demoPassword = bcrypt.hashSync("password", 10);
  
  const adminExists = db.prepare("SELECT id FROM Users WHERE email = 'admin@demo.com'").get();
  if (!adminExists) {
    db.prepare(
      "INSERT INTO Users (id, username, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?, ?)"
    ).run("admin-demo-1", "admin_demo", "admin@demo.com", demoPassword, "admin", "IT");
    console.log("Demo admin created: admin@demo.com / password");
  }

  const lecturerExists = db.prepare("SELECT id FROM Users WHERE email = 'lecturer@demo.com'").get();
  if (!lecturerExists) {
    db.prepare(
      "INSERT INTO Users (id, username, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?, ?)"
    ).run("lecturer-demo-1", "lecturer_demo", "lecturer@demo.com", demoPassword, "lecturer", "Computer Science");
    console.log("Demo lecturer created: lecturer@demo.com / password");
  }

  const studentExists = db.prepare("SELECT id FROM Users WHERE email = 'student@demo.com'").get();
  if (!studentExists) {
    db.prepare(
      "INSERT INTO Users (id, username, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?, ?)"
    ).run("student-demo-1", "student_demo", "student@demo.com", demoPassword, "student", "Computer Science");
    console.log("Demo student created: student@demo.com / password");
  }
}
