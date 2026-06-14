# Deployment Guide - Splitwise Clone

## Overview
This guide covers deploying the Splitwise Clone application to production using:
- **Backend:** Railway (Node.js + PostgreSQL)
- **Frontend:** Vercel (React + Vite)

---

## Prerequisites
Before starting deployment, ensure you have:
1. GitHub account with the repository pushed
2. Railway account (https://railway.app)
3. Vercel account (https://vercel.com)
4. API keys:
   - `EXCHANGE_RATE_API_KEY` from open.er-api.com
   - Generated `JWT_SECRET` (strong random string)

---

## Part 1: Backend Deployment to Railway

### Step 1: Set Up Railway PostgreSQL Database

1. Go to https://railway.app and sign in
2. Create a new project
3. Add a PostgreSQL plugin:
   - Click "+ Create"
   - Select "PostgreSQL"
   - Railway will provision a database instance
4. Once created, copy the connection details:
   - In the PostgreSQL service, go to "Connect" tab
   - Copy the connection string (looks like: `postgres://user:password@host:port/database`)
   - This will be your `DATABASE_URL`

### Step 2: Deploy Backend Service to Railway

1. In your Railway project, click "+ Create"
2. Select "Empty Service"
3. Connect your GitHub repository:
   - Railway will automatically detect it's a Node.js project
   - Link to the backend folder (if using monorepo, set the root path)
4. Configure environment variables:
   - Go to the service settings
   - Add the following environment variables:
     ```
     DATABASE_URL=postgres://...
     JWT_SECRET=your-super-secret-jwt-key-here
     EXCHANGE_RATE_API_KEY=your-exchange-rate-api-key
     NODE_ENV=production
     FRONTEND_URL=https://your-vercel-app-url.vercel.app
     PORT=3000
     ```
5. Click "Deploy"
   - Railway will automatically detect `package.json` and run `npm install`
   - Run the start script from `package.json`
   - Ensure Prisma migrations run before starting

### Step 3: Set Up Prisma Migration on Railway

1. In the Railway service settings, add a deployment script:
   - Go to "Deploy" settings
   - Add pre-deploy command: `npx prisma migrate deploy`
   - This ensures database schema is up-to-date

2. The backend should now be deployed at: `https://<railway-service-name>.up.railway.app`

---

## Part 2: Frontend Deployment to Vercel

### Step 1: Configure Frontend for Production

1. Update [frontend/.env.production](frontend/.env.production):
   ```
   VITE_API_URL=https://<your-railway-backend-url>/api/v1
   ```

2. Ensure [frontend/vite.config.js](frontend/vite.config.js) is properly configured for production builds

### Step 2: Deploy to Vercel

1. Go to https://vercel.com and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework:** Vite
   - **Root Directory:** `./frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add environment variables:
   ```
   VITE_API_URL=https://<your-railway-backend-url>/api/v1
   ```
6. Click "Deploy"
   - Vercel will automatically build and deploy your frontend
   - Your app will be available at: `https://<project-name>.vercel.app`

### Step 3: Update Backend CORS Settings

1. Update backend `.env`:
   ```
   FRONTEND_URL=https://<your-vercel-frontend-url>.vercel.app
   ```
2. Redeploy the backend to apply the CORS changes

---

## Part 3: Testing Deployed Application

### Functionality Checklist

#### Authentication
- [ ] User registration works
- [ ] User login works
- [ ] Cookies are properly set (httpOnly)
- [ ] Logout clears session
- [ ] Protected routes redirect to login if not authenticated

#### Groups
- [ ] Create a new group
- [ ] View group details
- [ ] Add members to group (by email)
- [ ] Remove members from group
- [ ] Group balances calculate correctly

#### Friends
- [ ] Add a friend (1-on-1 tracking)
- [ ] View friend details
- [ ] 1-on-1 balance displays correctly

#### Expenses
- [ ] Create expense with EQUAL split
- [ ] Create expense with EXACT amounts
- [ ] Create expense with PERCENTAGE split
- [ ] Create expense with SHARES (weighted)
- [ ] Edit expense
- [ ] Delete expense
- [ ] View expense details

#### Balances
- [ ] Individual balances calculate correctly
- [ ] Group balances display properly
- [ ] Balance simplification works (min cash flow)

#### Settlements
- [ ] Settle up between two users
- [ ] Settlement records correctly
- [ ] Balances update after settlement

#### Multi-Currency
- [ ] Create expense in different currencies
- [ ] Currency conversion rates are applied
- [ ] Display with correct currency symbols

#### Ghost Users
- [ ] Invite non-registered user by email
- [ ] Ghost user created in system
- [ ] When ghost user registers with same email, merge happens automatically
- [ ] All expenses reassigned to real user

### Manual Testing Steps

1. **Register and Login:**
   ```
   Visit: https://<your-vercel-url>/register
   Create account with email and password
   Login with those credentials
   ```

2. **Create Group:**
   ```
   Click "+ New" in Groups
   Fill in group name and description
   Create a test group
   ```

3. **Add Expense:**
   ```
   Click "+ Add expense" in group
   Enter description: "Dinner"
   Enter amount: 1000
   Select split type: EQUAL
   Save expense
   ```

4. **Check Balances:**
   ```
   Go to group details
   Verify "Simplified Balances" section
   All amounts should be calculated correctly
   ```

---

## Part 4: Monitoring & Troubleshooting

### Common Issues

#### Backend Not Starting
- Check logs in Railway dashboard
- Verify DATABASE_URL is correct
- Ensure Prisma migrations ran successfully
- Check all required environment variables are set

#### Frontend Can't Connect to Backend
- Verify VITE_API_URL is correct
- Check CORS is enabled in backend
- Verify FRONTEND_URL is set correctly in backend
- Check browser console for errors

#### Database Connection Issues
- Verify DATABASE_URL format
- Check PostgreSQL instance is running in Railway
- Ensure IP whitelist allows Vercel IPs (if applicable)

#### Expense Balances Not Calculating
- Check backend logs for errors
- Verify expense splits are saved correctly
- Check Prisma schema matches database

### Monitoring

**Railway Dashboard:**
- Monitor CPU, memory, and database usage
- Check deployment logs for errors
- Monitor database query performance

**Vercel Dashboard:**
- Monitor build times
- Check function logs for errors
- Monitor edge function performance

---

## Part 5: Post-Deployment

### Optional Enhancements

1. **Set up custom domain:**
   - In Vercel/Railway settings, add your custom domain
   - Update DNS records with provider

2. **Enable analytics:**
   - Vercel has built-in analytics
   - Add to understand user behavior

3. **Set up error tracking:**
   - Integrate Sentry or similar service
   - Monitor production errors

4. **Backup strategy:**
   - Set up Railway database backups
   - Document backup restore procedures

5. **CI/CD Pipeline:**
   - Both Railway and Vercel support automatic deployments on GitHub push
   - Ensure tests pass before deployment

---

## Deployment Checklist

### Before Deployment
- [ ] All tests passing locally
- [ ] Code committed and pushed to GitHub
- [ ] Environment variables documented
- [ ] Database schema finalized
- [ ] API endpoints tested locally

### During Deployment
- [ ] Railway PostgreSQL instance created
- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set correctly
- [ ] CORS configuration updated
- [ ] Prisma migrations applied

### After Deployment
- [ ] Backend URL accessible
- [ ] Frontend URL accessible
- [ ] Can register new user
- [ ] Can login successfully
- [ ] Can create groups and expenses
- [ ] Balances calculate correctly
- [ ] No console errors in browser
- [ ] No errors in backend logs

---

## Support & Documentation

- **Railway Docs:** https://docs.railway.app
- **Vercel Docs:** https://vercel.com/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Railway PostgreSQL Guide:** https://docs.railway.app/databases/postgresql

---

## Quick Reference

### Deployed URLs
- **Frontend:** https://YOUR-VERCEL-URL.vercel.app
- **Backend API:** https://YOUR-RAILWAY-URL.up.railway.app/api/v1
- **Database:** PostgreSQL on Railway

### Key Environment Variables
```
Backend:
  DATABASE_URL=postgres://user:password@host:port/database
  JWT_SECRET=your-secret-key
  EXCHANGE_RATE_API_KEY=your-api-key
  FRONTEND_URL=https://your-vercel-url.vercel.app
  NODE_ENV=production

Frontend:
  VITE_API_URL=https://your-railway-url.up.railway.app/api/v1
```

---

## Contact & Issues

For issues during deployment, check:
1. Application logs in Railway/Vercel dashboard
2. Browser console for frontend errors
3. Network tab for API failures
4. Backend logs for server errors

If deployment fails, refer to the troubleshooting section or check the respective platform's documentation.
