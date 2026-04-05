-- ============================================================
-- Smart Student Attendance System - Database Setup
-- Run this script in Supabase SQL Editor
-- ============================================================

-- Step 1: Drop existing tables (clean slate)
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 2: Create Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student', 'lecturer', 'admin', 'department_head')),
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create Classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  lecturer_id UUID REFERENCES users(id),
  department TEXT,
  schedule TEXT,
  capacity INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Create Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id),
  lecturer_id UUID REFERENCES users(id),
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  qr_code TEXT UNIQUE,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'closed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 5: Create Attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  session_id UUID NOT NULL REFERENCES sessions(id),
  class_id UUID REFERENCES classes(id),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'present' CHECK(status IN ('present', 'late', 'absent', 'excused')),
  student_name TEXT,
  student_email TEXT,
  UNIQUE(student_id, session_id)
);

-- Step 6: Create Audit Logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 7: Insert Demo Users
-- Password for all: "password"
-- Hash: $2b$10$t.XV0ImOc1M5WnkrAo89kusyrm4UEMoBphxx0PRJqbD8ehGfwJHHO

INSERT INTO users (username, email, password_hash, role, department, is_active) VALUES
('admin_demo', 'admin@demo.com', '$2b$10$t.XV0ImOc1M5WnkrAo89kusyrm4UEMoBphxx0PRJqbD8ehGfwJHHO', 'admin', 'IT', true),
('lecturer_demo', 'lecturer@demo.com', '$2b$10$t.XV0ImOc1M5WnkrAo89kusyrm4UEMoBphxx0PRJqbD8ehGfwJHHO', 'lecturer', 'Engineering', true),
('student_demo', 'student@demo.com', '$2b$10$t.XV0ImOc1M5WnkrAo89kusyrm4UEMoBphxx0PRJqbD8ehGfwJHHO', 'student', 'Engineering', true);

-- ============================================================
-- ✅ Database Setup Complete!
-- ============================================================
-- Demo Credentials:
--   Admin:    admin@demo.com / password
--   Lecturer: lecturer@demo.com / password
--   Student:  student@demo.com / password
-- ============================================================
