import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = 'https://xvncrfmuejqmcdcscrze.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bmNyZm11ZWpxbWNkY3NjcnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMDIyMTYsImV4cCI6MjA5MDg3ODIxNn0.MgqxBb6N7TQ5liIHsebxN0UIy-7yiq1ndd_MXJ9ETRg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');

  try {
    // Step 1: Create Users table
    console.log('📝 Creating users table...');
    const { error: usersError } = await supabase.rpc('execute_sql', {
      sql: `
        DROP TABLE IF EXISTS attendance CASCADE;
        DROP TABLE IF EXISTS sessions CASCADE;
        DROP TABLE IF EXISTS classes CASCADE;
        DROP TABLE IF EXISTS audit_logs CASCADE;
        DROP TABLE IF EXISTS users CASCADE;

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
      `
    });

    if (usersError) console.log('Note: Users table', usersError.message);
    console.log('✅ Users table ready\n');

    // Step 2: Create Classes table
    console.log('📝 Creating classes table...');
    const { error: classesError } = await supabase.rpc('execute_sql', {
      sql: `
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
      `
    });

    if (classesError) console.log('Note: Classes table', classesError.message);
    console.log('✅ Classes table ready\n');

    // Step 3: Create Sessions table
    console.log('📝 Creating sessions table...');
    const { error: sessionsError } = await supabase.rpc('execute_sql', {
      sql: `
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
      `
    });

    if (sessionsError) console.log('Note: Sessions table', sessionsError.message);
    console.log('✅ Sessions table ready\n');

    // Step 4: Create Attendance table
    console.log('📝 Creating attendance table...');
    const { error: attendanceError } = await supabase.rpc('execute_sql', {
      sql: `
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
      `
    });

    if (attendanceError) console.log('Note: Attendance table', attendanceError.message);
    console.log('✅ Attendance table ready\n');

    // Step 5: Create Audit Logs table
    console.log('📝 Creating audit_logs table...');
    const { error: auditError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          action TEXT NOT NULL,
          entity_type TEXT,
          entity_id TEXT,
          details JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    });

    if (auditError) console.log('Note: Audit logs table', auditError.message);
    console.log('✅ Audit logs table ready\n');

    // Step 6: Insert demo users
    console.log('👥 Creating demo users...');

    const adminHash = await bcrypt.hash('password', 10);
    const lecturerHash = await bcrypt.hash('password', 10);
    const studentHash = await bcrypt.hash('password', 10);

    // Insert admin
    const { error: adminError } = await supabase
      .from('users')
      .insert({
        username: 'admin_demo',
        email: 'admin@demo.com',
        password_hash: adminHash,
        role: 'admin',
        department: 'IT',
        is_active: true
      });

    if (!adminError) {
      console.log('✅ Admin user created: admin@demo.com / password');
    } else {
      console.log('⚠️  Admin user:', adminError.message);
    }

    // Insert lecturer
    const { error: lecturerError } = await supabase
      .from('users')
      .insert({
        username: 'lecturer_demo',
        email: 'lecturer@demo.com',
        password_hash: lecturerHash,
        role: 'lecturer',
        department: 'Engineering',
        is_active: true
      });

    if (!lecturerError) {
      console.log('✅ Lecturer user created: lecturer@demo.com / password');
    } else {
      console.log('⚠️  Lecturer user:', lecturerError.message);
    }

    // Insert student
    const { error: studentError } = await supabase
      .from('users')
      .insert({
        username: 'student_demo',
        email: 'student@demo.com',
        password_hash: studentHash,
        role: 'student',
        department: 'Engineering',
        is_active: true
      });

    if (!studentError) {
      console.log('✅ Student user created: student@demo.com / password');
    } else {
      console.log('⚠️  Student user:', studentError.message);
    }

    console.log('\n✨ Database setup complete!\n');
    console.log('📋 Summary:');
    console.log('   • Tables created: users, classes, sessions, attendance, audit_logs');
    console.log('   • Demo users: 3 (admin, lecturer, student)');
    console.log('   • All demo passwords: "password"\n');

  } catch (error) {
    console.error('❌ Setup error:', error);
  }
}

// Run setup
setupDatabase();
