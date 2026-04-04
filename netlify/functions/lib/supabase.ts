import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize database schema on first run
export async function initializeDatabase() {
  try {
    // Create Users table
    await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'student',
          department TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    }).catch(() => {
      // Table might already exist, that's ok
    });

    // Create Classes table
    await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS classes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          code TEXT UNIQUE NOT NULL,
          lecturer_id UUID,
          department TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    }).catch(() => {});

    // Create Sessions table
    await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          class_id UUID,
          lecturer_id UUID,
          status TEXT DEFAULT 'active',
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ended_at TIMESTAMP
        )
      `
    }).catch(() => {});

    // Create Attendance table
    await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS attendance (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID,
          session_id UUID,
          marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    }).catch(() => {});

    // Create Audit_Log table
    await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID,
          action TEXT NOT NULL,
          entity_type TEXT,
          entity_id TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    }).catch(() => {});

  } catch (error) {
    console.error('Database initialization error:', error);
  }
}
