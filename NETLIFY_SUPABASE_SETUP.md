# 🚀 Netlify + Supabase Setup Guide

## Step 1: Create Supabase Account (You Do This)

1. Go to https://supabase.com
2. Click **"Sign Up"** with GitHub or Email
3. Create a new project:
   - **Project Name:** smart-attendance
   - **Database Password:** Create strong password (save this!)
   - **Region:** Choose closest to you
   - Click **"Create new project"**
4. Wait for project to initialize (~2 minutes)

---

## Step 2: Get Your Credentials

Once your project is created:

### From Supabase Dashboard:

1. Click **"Settings"** (bottom left)
2. Click **"API"**
3. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **Anon Public Key** → `SUPABASE_ANON_KEY`
   - **Service Role Secret** → `SUPABASE_SERVICE_KEY`

Example credentials (REPLACE WITH YOUR OWN):
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 3: Update Your .env File

Add these lines to your `.env` file:

```env
# Supabase Configuration (for Netlify deployment)
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here
```

---

## Step 4: Verify Tables in Supabase

Supabase needs the tables created. Do this in Supabase Dashboard:

Go to **"SQL Editor"** and run this script:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
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

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  lecturer_id UUID REFERENCES users(id),
  department TEXT,
  schedule TEXT,
  capacity INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
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

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
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

-- Audit Log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Step 5: Deploy to Netlify

### Option A: Using Netlify UI (Easy)

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repository
4. Set build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **"Advanced"** → **"New variable"**
   - Add your Supabase credentials there
6. Click **"Deploy"**

### Option B: Using Netlify CLI (Advanced)

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

---

## Step 6: Set Environment Variables in Netlify

In your Netlify site settings:

1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Click **"Edit variables"**
3. Add these variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET`
   - `REFRESH_SECRET`

---

## Current Setup Status

### ✅ Already Configured
- `netlify.toml` - Properly configured
- `netlify/functions/` - All functions ready
- Routes redirecting correctly
- CORS headers set up

### ⚠️ Missing (You Need to Add)
- Supabase account
- Supabase credentials in `.env`
- Database tables in Supabase

---

## Testing Before Deployment

Test locally first:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run with Netlify functions locally
netlify dev
```

Then test login:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"password"}'
```

---

## After Deployment

Your app will be available at:
- `https://your-project-name.netlify.app`

### First time setup:
1. Create admin user
2. Create classes
3. Generate QR codes
4. Start taking attendance

---

## Troubleshooting

### Issue: "Missing Supabase environment variables"
**Fix:** Add SUPABASE_URL and SUPABASE_ANON_KEY to your .env and Netlify

### Issue: "Cannot find table"
**Fix:** Run the SQL script in Supabase SQL Editor to create tables

### Issue: 500 errors on API calls
**Fix:** Check Netlify Function logs: Site → Functions → View logs

---

## Next Steps

1. ✅ Create Supabase account (free tier is fine)
2. ✅ Get credentials from Supabase API settings
3. ✅ Update your .env file
4. ✅ Create database tables with SQL script
5. ✅ Push code to GitHub
6. ✅ Deploy to Netlify
7. ✅ Test your live app

Need help? Let me know which step you're on!
