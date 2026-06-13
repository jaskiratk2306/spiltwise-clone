# Deployment Guide - Splitwise Clone (Render + Supabase)

Follow these steps to deploy the application to **Supabase** (Database), **Render** (Backend), and **Vercel** (Frontend).

## 1. Database (Supabase)

1. Log in to [Supabase](https://supabase.com/).
2. Create a **New Project**.
3. Go to **Project Settings** → **Database**.
4. Copy the **Connection String** (Transaction mode, port 6543) and save it as your `DATABASE_URL`.
   - It will look like: `postgres://postgres.[USER]:[PASS]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

---

## 2. Backend (Render)

1. Log in to [Render](https://render.com/).
2. Click **New** → **Web Service** → Connect your GitHub Repo.
3. Set **Root Directory** to `backend`.
4. Set **Build Command**: `npm install && npx prisma generate`
5. Set **Start Command**: `node src/index.js`
6. Add the following **Environment Variables**:
   - `DATABASE_URL`: (From Supabase - use the **Transaction Mode** string)
   - `JWT_SECRET`: (Random string)
   - `EXCHANGE_RATE_API_KEY`: (From open.er-api.com)
   - `FRONTEND_URL`: `https://your-frontend.vercel.app`
   - `NODE_ENV`: `production`

> [!IMPORTANT]
> If the build fails on Render, ensure you have the **Node.js Environment** set correctly in the dashboard.

---

## 3. Frontend (Vercel)

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New Project** → Import Repo.
3. **IMPORTANT**: Set the **Root Directory** to `frontend`. Vercel will automatically detect the Vite build settings.
4. Set `VITE_API_URL` to your Render URL: `https://your-backend.onrender.com/api/v1`.

---

## 4. Final Setup

1. On your local machine, run:
   ```bash
   cd backend
   npx prisma db push
   ```
   (This will sync the schema to Supabase).
2. Update the `FRONTEND_URL` on Render and `VITE_API_URL` on Vercel to match the final domains.
