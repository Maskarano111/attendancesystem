# BEFORE YOU DEPLOY TO NETLIFY

## ✅ Pre-Deployment Checklist

### 1. Supabase Setup
- [ ] Create free account at https://supabase.com
- [ ] Create new project
- [ ] Get Project URL from Settings → API
- [ ] Get Anon Public Key from Settings → API
- [ ] Get Service Role Secret from Settings → API
- [ ] Create database tables (use SQL script in NETLIFY_SUPABASE_SETUP.md)

### 2. Environment Variables
- [ ] Update `.env` with your SUPABASE_URL
- [ ] Update `.env` with your SUPABASE_ANON_KEY
- [ ] Update `.env` with your SUPABASE_SERVICE_KEY
- [ ] Change JWT_SECRET to a secure random string
- [ ] Change REFRESH_SECRET to a secure random string

### 3. Code & Dependencies
- [ ] Run `npm run lint` - should pass with zero errors
- [ ] Run `npm run build` - should create dist/ folder
- [ ] Test locally with `npm run dev`

### 4. Git & GitHub
- [ ] Commit all changes: `git add . && git commit -m "Setup Netlify with Supabase"`
- [ ] Push to GitHub: `git push origin main`

### 5. Netlify Setup
- [ ] Create account at https://netlify.com
- [ ] Connect GitHub repository
- [ ] Set build command: `npm run build`
- [ ] Set publish directory: `dist`
- [ ] Add environment variables in Netlify UI:
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_KEY
  - JWT_SECRET
  - REFRESH_SECRET

### 6. After Deployment
- [ ] Visit your Netlify URL (https://your-app.netlify.app)
- [ ] Test API health: `https://your-app.netlify.app/api/health`
- [ ] Test login with demo account
- [ ] Check Netlify function logs if errors occur

---

## 🚀 Deployment Steps

```bash
# 1. Make sure all changes are committed
git status

# 2. Push to GitHub
git push origin main

# 3. Go to Netlify and authorize deployment
# (It will deploy automatically from GitHub)
```

---

## 📝 Environment Variables Cheat Sheet

### Local Development (.env file)
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
JWT_SECRET=super-secret-random-string
REFRESH_SECRET=another-secret-random-string
```

### Netlify (Site Settings → Build & Deploy → Environment)
```
Same as above - paste the values into Netlify UI
```

---

## ⚠️ Common Issues

### Issue: "Missing Supabase environment variables"
```
REASON: .env variables not provided to Netlify functions
FIX: Add them in Netlify Site Settings → Environment
```

### Issue: Database tables don't exist
```
REASON: Haven't run the SQL script in Supabase
FIX: Go to Supabase → SQL Editor → Paste and run the setup script
```

### Issue: CORS errors
```
REASON: Your app domain not in ALLOWED_ORIGINS
FIX: Update ALLOWED_ORIGINS in .env to include your Netlify domain
```

### Issue: Login returns 500 error
```
REASON: Netlify function failing
FIX: Check Netlify logging: Site → Functions → scroll to bottom for logs
```

---

## 🔐 Security Notes for Production

1. **Never commit secrets** - Use environment variables only
2. **Change default JWT secrets** - Generate strong random strings
3. **Use HTTPS** - Netlify provides free HTTPS
4. **Row Level Security (RLS)** - Consider enabling in Supabase
5. **API Keys** - Use Anon key in frontend, Service key only on backend

---

## 📚 Useful Links

- Supabase Docs: https://supabase.com/docs
- Netlify Functions: https://docs.netlify.com/functions/overview/
- Environment Variables: https://docs.netlify.com/configure-builds/environment-variables/

---

Once you've completed all steps, your app will be live at:
🚀 `https://your-project-name.netlify.app`
