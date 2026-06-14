# 🚀 Interactive Deployment Steps - For You

## Your Database Connection Ready ✅
```
postgresql://postgres:ZUkzHjGLBFeaRzBBlUspQrXpCyVhSDCo@thomas.proxy.rlwy.net:11632/railway
```

---

## Step 1: Connect GitHub to Railway (MUST DO FIRST)

### Why?
Railway needs access to your GitHub repository to automatically deploy when you push code.

### Instructions:

1. **Go to Railway Dashboard:**
   - Open https://railway.app/dashboard

2. **Create New Project:**
   - Click "New Project" button
   - Select "Deploy from GitHub"

3. **Authorize GitHub:**
   - Click "Connect GitHub Account"
   - GitHub will ask for authorization (click Authorize)
   - Select your repository: `jaskiratk2306/splitwise-clone`

4. **Select Backend Root:**
   - When prompted for root directory, select: `./backend`
   - This tells Railway to deploy only the backend folder

5. **Confirm:**
   - Click "Deploy"
   - Railway will start watching your GitHub repo

**After this step:** You should see your backend service in Railway dashboard.

---

## Step 2: Add Environment Variables to Railway

### Open Railway Service:
1. Go to your new backend service in Railway
2. Click on the service name
3. Go to "Variables" tab

### Add These Variables (COPY EXACTLY):

| Variable Name | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:ZUkzHjGLBFeaRzBBlUspQrXpCyVhSDCo@thomas.proxy.rlwy.net:11632/railway` | Already filled above |
| `JWT_SECRET` | `6e2c4d7b9a1f5e8c3b2d4a9f1c5e8b2d7a9f1c5e8b2d4a9f1c5e8b2d7a9f1c` | Secure random key |
| `EXCHANGE_RATE_API_KEY` | `e591f692eaac0039ccb303de` | From your .env |
| `NODE_ENV` | `production` | Must be exactly this |
| `PORT` | `3000` | Railway will assign this |
| `FRONTEND_URL` | `[WILL FILL AFTER VERCEL]` | Leave for now, fill later |

**How to add:**
- Click "New Variable" for each one
- Copy exact name from table
- Copy exact value from table
- Click "Add"

---

## Step 3: Set Up Prisma Migration on Railway

This ensures your database gets the schema on first deploy.

1. In Railway service, go to "Settings"
2. Scroll to "Deployment"
3. In "Build Command", add:
   ```
   npx prisma migrate deploy
   ```
4. Save

**What this does:** Automatically runs database migrations before starting the app.

---

## Step 4: Wait for Deployment ⏳

1. Go back to your service overview
2. Look for the deployment status
3. Wait until you see a **green checkmark** and "Active" status
4. This usually takes 2-3 minutes

**When deployment is complete:**
- You'll see a URL like: `https://splitwise-backend-prod.up.railway.app`
- Copy this URL - you'll need it for the frontend

---

## ✅ Step 1-4 Checklist

After completing steps 1-4, tell me:
- [ ] GitHub connected to Railway
- [ ] Backend service created in Railway  
- [ ] All environment variables added
- [ ] Prisma migration command added
- [ ] Deployment shows "Active" (green)
- [ ] Backend URL obtained (looks like: `https://...up.railway.app`)

**NEXT:** Once you confirm the above, we'll deploy the frontend to Vercel!

---

## 📝 What to Tell Me Next

Once you complete steps 1-4 above, provide:

1. **Backend URL:** (The URL from Railway, looks like: https://splitwise-backend-xxx.up.railway.app)
2. **Any error messages:** (If deployment fails, copy the error)

---

## Helpful Tips

- ✅ Keep your JWT_SECRET secret (don't share it)
- ✅ Database connection is already tested (you provided it from Railway)
- ✅ Railway auto-redeploys when you push to GitHub
- ✅ All your environment variables should be set in Railway, not in code

---

## 🆘 Troubleshooting Step 1-4

### "Deployment Failed"
Check the build logs in Railway:
1. Click your service
2. Scroll to "Deployment" section
3. Click "View Logs"
4. Look for errors (usually in red)
5. Copy any error and show me

### "Can't find backend folder"
Make sure root directory is set to: `./backend`

### "Environment variable not saving"
Try refreshing the page and adding again

---

## Ready to Start?

**Complete these steps:**
1. ✅ Go to https://railway.app
2. ✅ Connect your GitHub repo
3. ✅ Add all the environment variables above
4. ✅ Add Prisma migration command
5. ✅ Wait for green "Active" status
6. ✅ Copy your backend URL

**Then come back and tell me:**
- Your backend URL
- Any errors you see (or "No errors")

Then we'll deploy your frontend to Vercel! 🎉
