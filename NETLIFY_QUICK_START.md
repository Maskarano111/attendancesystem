# Quick Start: Netlify + Supabase Setup

## In 3 Minutes

### Step 1: Create Supabase Account (FREE)
1. Go to https://supabase.com and sign up with GitHub
2. Create a new project (pick a region)
3. Wait for it to initialize

### Step 2: Get Your Credentials
From Supabase Dashboard → Settings → API:
- Copy **Project URL** 
- Copy **Anon Public Key**
- Copy **Service Role Secret**

### Step 3: Update .env File
```env
SUPABASE_URL=https://paste-your-project-url-here.supabase.co
SUPABASE_ANON_KEY=paste-your-anon-key-here
SUPABASE_SERVICE_KEY=paste-your-service-key-here
```

### Step 4: Create Database Tables
In Supabase → SQL Editor → paste this:

```sql
-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'student',
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  lecturer_id UUID REFERENCES users(id),
  department TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id),
  date TEXT,
  start_time TEXT,
  qr_code TEXT UNIQUE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id),
  session_id UUID REFERENCES sessions(id),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'present'
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Then click **Execute** ✓

---

## Deploy to Netlify

### Option A: Automatic (Easiest)
1. Push code to GitHub: `git push origin main`
2. Go to https://app.netlify.com
3. Click **Add new site** → Connect GitHub
4. Select your repo
5. In **Environment variables** section, add:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_KEY
   - JWT_SECRET
   - REFRESH_SECRET
6. Click **Deploy site**

### Option B: Netlify CLI (Advanced)
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

---

## ✅ After Deployment

Test your live app:
```bash
# Your app URL: https://your-project.netlify.app

# Test health endpoint
curl https://your-project.netlify.app/api/health

# Test login
curl -X POST https://your-project.netlify.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"password"}'
```

---

## 🎉 You're Live!

Your Smart Student Attendance System is now:
- ✅ Hosted on Netlify (CDN edge locations)
- ✅ Database on Supabase (PostgreSQL)
- ✅ Serverless functions (auto-scales)
- ✅ Free HTTPS
- ✅ 100% scalable

---

## Support

Having issues? Check:
1. DEPLOYMENT_CHECKLIST.md - Full step-by-step guide
2. NETLIFY_SUPABASE_SETUP.md - Detailed setup guide
3. Netlify dashboard → Functions → Logs for debugging
4. Supabase dashboard → Database → Tables to verify structure

---

**You got this! 🚀**
