# Unified Deployment Guide - Splitwise Clone (Vercel)

The easiest way to deploy is using **Vercel** for both the Frontend, Backend, and Database.

## 1. Database (Vercel Postgres)

1. Go to your [Vercel Dashboard](https://vercel.com/).
2. Click on the **Storage** tab.
3. Click **Create** → **Postgres**.
4. Accept the terms and create the database.
5. In the **Connect** tab, copy the **`.env`** values or simply click "Connect" to a project.
   - *Prisma will use the `POSTGRES_PRISMA_URL` or `POSTGRES_URL`.*

---

## 2. Backend (Vercel)

1. In your project root, ensure `backend/vercel.json` exists (I have created it).
2. Deploy the `backend` folder as a new project on Vercel.
3. In the project settings, connect the **Postgres** database you just created.
4. Add other **Environment Variables**:
   - `JWT_SECRET`: (Random string)
   - `EXCHANGE_RATE_API_KEY`: (From open.er-api.com)
   - `FRONTEND_URL`: (Your frontend URL)

---

## 3. Frontend (Vercel)

1. Deploy the `frontend` folder.
2. Set `VITE_API_URL` to your backend Vercel URL (e.g., `https://your-api.vercel.app/api/v1`).

---

## 4. Initialization

Run this locally to sync your schema to the new Vercel database:
```bash
cd backend
# Replace the .env DATABASE_URL with your Vercel Postgres URL temporarily
npx prisma db push
```
