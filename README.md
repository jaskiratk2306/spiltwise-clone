# Splitwise Clone

A full-stack expense splitting app built as a reverse-engineered Splitwise MVP, deployed and working end-to-end.

**Live App:** `[INSERT VERCEL URL]`
**Backend API:** `[INSERT RAILWAY URL]`
**Deployment Guide:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## AI Disclosure

This project was scoped, designed, and planned with the assistance of **Claude (Anthropic)** — specifically Claude Sonnet 4.6 via claude.ai.

The AI was used for:
- Interviewing and eliciting product requirements (no assumptions made without answers)
- Producing `SCOPE.md` as a living source of truth
- Producing `DECISIONS.md` as a task-ordered execution plan and decision log
- Answering architecture questions and tradeoffs

All implementation was guided by `SCOPE.md`. See `AI_USAGE.md` for key prompts used.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + TailwindCSS + React Router v6 |
| Backend | Node.js + Express.js |
| ORM | Prisma |
| Database | MySQL (Railway) |
| Auth | JWT in httpOnly cookie |
| Validation | Zod |
| Testing | Jest + Supertest |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway |

---

## Project Structure

```
splitwise-clone/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── api/
│   └── .env.example
├── backend/           # Express + Prisma API
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── __tests__/
│   ├── prisma/
│   │   └── schema.prisma
│   └── .env.example
├── SCOPE.md           # Anomaly log and database schema
├── DECISIONS.md       # Decision log
├── README.md          # This file
└── AI_USAGE.md        # AI usage and key prompts used
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- MySQL 8+ (local or Railway)
- npm or yarn

---

### 1. Clone the repo

```bash
git clone https://github.com/[YOUR_USERNAME]/splitwise-clone.git
cd splitwise-clone
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` from the example:

```bash
cp .env.example .env
```

Fill in `.env`:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/splitwise"
JWT_SECRET="your-secret-key-min-32-chars"
EXCHANGE_RATE_API_KEY="your-key-from-open.er-api.com"
FRONTEND_URL="http://localhost:5173"
PORT=3000
NODE_ENV=development
```

Run DB migrations:

```bash
npx prisma migrate dev
npx prisma generate
```

Start the backend:

```bash
npm run dev
```

Backend runs at `http://localhost:3000`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`:

```bash
cp .env.example .env
```

Fill in `.env`:

```env
VITE_API_URL=http://localhost:3000
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`

---

### 4. Run Tests

```bash
cd backend
npm test
```

Runs:
- Unit tests: balance calculation + debt simplification algorithm
- Integration tests: auth, expense CRUD, settlements, balance recompute, ghost user merge

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MySQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs (min 32 chars) |
| `EXCHANGE_RATE_API_KEY` | Yes | API key from open.er-api.com |
| `FRONTEND_URL` | Yes | Allowed CORS origin |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `development` or `production` |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend base URL |

---

## Key Features

- **Auth:** Email + password, JWT in httpOnly cookie (XSS-safe)
- **Groups:** Create groups, invite members by email
- **1-on-1:** Track expenses directly with friends
- **Expenses:** Add with 4 split types — equal, exact, percentage, custom shares
- **Multi-currency:** Per-expense currency with live conversion rates
- **Balances:** Debt simplification algorithm (min-cash-flow) minimizes transactions
- **Settle up:** Record payments, balances update instantly
- **Ghost users:** Invite by email → auto-merge when they register
- **Edit/Delete:** Edit blocked if expense is already settled; soft delete on all expenses

---

## API Base URL

All endpoints are prefixed: `/api/v1`

Key routes:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/groups`
- `POST /api/v1/expenses`
- `POST /api/v1/settlements`
- `GET /api/v1/balances`
- `GET /api/v1/activity`

See `SCOPE.md §14` for the full API reference.

---

## Deployment

### Backend (Railway)
1. Connect GitHub repo to Railway
2. Set all env vars in Railway dashboard
3. Add build command: `npx prisma migrate deploy && node src/index.js`
4. Deploy

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set root directory to `frontend`
3. Set `VITE_API_URL` to Railway backend URL
4. Deploy

> Cookie note: In production, the JWT cookie uses `SameSite=None; Secure` to work across Vercel (frontend) and Railway (backend) origins.
