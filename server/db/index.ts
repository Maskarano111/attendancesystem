import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import bcrypt from "bcryptjs";

let dbInstance: SqlJsDatabase | null = null;
let SQL: any = null;

// Initialize sql.js - this happens once on first use
async function initSql() {
  if (SQL) return SQL;
  SQL = await initSqlJs();
  return SQL;
}

// Simple in-memory database wrapper for sql.js
class DatabaseWrapper {
  private db: SqlJsDatabase;

  constructor(db: SqlJsDatabase) {
    this.db = db;
  }

  prepare(sql: string) {
    const db = this.db;
    return {
      get: (...params: any[]) => {
        try {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          if (stmt.step()) {
            const result = stmt.getAsObject();
            stmt.free();
            return result;
          }
          stmt.free();
          return undefined;
        } catch (err) {
          console.error("SQL error in get():", err, sql);
          return undefined;
        }
      },
      all: (...params: any[]) => {
        try {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          const results: any[] = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return results;
        } catch (err) {
          console.error("SQL error in all():", err, sql);
          return [];
        }
      },
      run: (...params: any[]) => {
        try {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          stmt.step();
          stmt.free();
          return { changes: 1 };
        } catch (err) {
          console.error("SQL error in run():", err, sql);
          return { changes: 0 };
        }
      }
    };
  }

  exec(sql: string) {
    try {
      const statements = sql.split(';').filter(s => s.trim());
      for (const stmt of statements) {
        if (stmt.trim()) {
          this.db.run(stmt);
        }
      }
    } catch (err) {
      console.error("SQL exec error:", err, sql);
    }
  }
}

// Initialize database once
export async function getDb(): Promise<any> {
  if (dbInstance) return new DatabaseWrapper(dbInstance);
  
  const SQL = await initSql();
  dbInstance = new SQL.Database();
  return new DatabaseWrapper(dbInstance);
}

export async function initializeDatabase() {
  const db = await getDb();

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
      student_name TEXT,
      student_index_number TEXT,
      student_email TEXT,
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
