# BUILD_PLAN.md — Splitwise Clone

> Built from AI_CONTEXT.md. This plan is the execution order for the 3-day MVP.
> Every task maps to a decision in AI_CONTEXT.md.
> Do not begin a day without completing the previous day's checklist.

---

## Pre-Day Setup (Before Day 1 — ~1 hour)

### Accounts & Services
- [ ] Create GitHub repo: `splitwise-clone` (public, monorepo)
- [ ] Create Railway account → provision MySQL instance → copy `DATABASE_URL`
- [ ] Create Vercel account → connect GitHub repo → set root to `/frontend`
- [ ] Get free API key from `open.er-api.com` (exchange rates)
- [ ] Create `.env` files from `.env.example` templates (never commit actual `.env`)

### Repo Structure
```
splitwise-clone/
├── frontend/          # React + Vite + TailwindCSS
├── backend/           # Node.js + Express + Prisma + MySQL
├── AI_CONTEXT.md
├── BUILD_PLAN.md
├── README.md
└── PROMPTS.md
```

### Backend Init
```bash
mkdir backend && cd backend
npm init -y
npm install express prisma @prisma/client bcrypt jsonwebtoken cookie-parser cors zod dotenv axios
npm install -D jest supertest ts-jest @types/jest nodemon
npx prisma init
```

### Frontend Init
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install axios react-router-dom @tailwindcss/vite tailwindcss
```

---

## Day 1 — Foundation: Auth, Schema, Groups, Friends, Dashboard UI

**Goal:** A logged-in user can see their dashboard with groups and friends.

---

### Block 1A — Prisma Schema & DB Migration (2 hrs)

Define all tables from AI_CONTEXT.md §13 in `prisma/schema.prisma`:

- [ ] `users` — id, name, email, password_hash, is_ghost, base_currency, created_at
- [ ] `groups` — id, name, description, base_currency, created_by, created_at
- [ ] `group_members` — group_id, user_id, joined_at (composite PK)
- [ ] `friendships` — id, user_id_1, user_id_2 (always store smaller UUID first), created_at
- [ ] `expenses` — id, group_id (nullable), description, total_amount, currency, conversion_rate, paid_by, split_type (enum), created_by, created_at, updated_at, deleted_at (nullable)
- [ ] `expense_splits` — id, expense_id, user_id, owed_amount, share_value, created_at
- [ ] `settlements` — id, group_id (nullable), paid_by, paid_to, amount, currency, conversion_rate, created_at
- [ ] `balances` — id, group_id (nullable), user_id_from, user_id_to, net_amount, updated_at

```bash
npx prisma migrate dev --name init
```

**Key rules:**
- All IDs are UUID (`@default(uuid())`)
- `split_type` is a Prisma enum: `EQUAL | EXACT | PERCENTAGE | SHARES`
- `deleted_at` on expenses enables soft delete — never hard delete
- `balances` has a unique constraint on `(group_id, user_id_from, user_id_to)` for upsert

---

### Block 1B — Backend: Auth Endpoints (1.5 hrs)

File: `backend/src/routes/auth.js`

- [ ] `POST /api/v1/auth/register`
  - Validate: name, email, password (Zod)
  - Check if email exists as a real (non-ghost) user → 409
  - **Ghost merge:** if email matches `is_ghost: true` user → run ghost merge transaction (see §7 AI_CONTEXT)
    - Reassign `expense_splits.user_id`, `settlements.paid_by/paid_to`, `group_members.user_id`
    - Recompute affected balances
    - Delete ghost row
    - Set new user's ID as the real account
  - Hash password with bcrypt (rounds: 12)
  - Create user row
  - Sign JWT (`userId`, `email`), expiry 7d
  - Set httpOnly cookie: `SameSite=None; Secure; HttpOnly`
  - Return user object (no password_hash)

- [ ] `POST /api/v1/auth/login`
  - Validate email + password
  - Find user, compare bcrypt hash
  - Sign JWT, set cookie
  - Return user object

- [ ] `POST /api/v1/auth/logout`
  - Clear cookie (set expired)

- [ ] `GET /api/v1/auth/me`
  - Read JWT from cookie → return current user

**Middleware:** `backend/src/middleware/auth.js` — verify JWT cookie, attach `req.user`

---

### Block 1C — Backend: Users, Groups, Friends APIs (2 hrs)

#### Users
- [ ] `GET /api/v1/users/search?email=` — search by email for inviting (exclude ghost users from results unless they match exactly)
- [ ] `PATCH /api/v1/users/me` — update name, base_currency

#### Groups
- [ ] `GET /api/v1/groups` — list groups where `req.user` is a member, include net balance per group
- [ ] `POST /api/v1/groups` — create group, auto-add creator as member
- [ ] `GET /api/v1/groups/:id` — group detail: name, members, expenses (paginated), simplified balances
- [ ] `PATCH /api/v1/groups/:id` — edit name/description/base_currency (creator only)
- [ ] `POST /api/v1/groups/:id/members` — add by email; if email not found → create ghost user → add to group
- [ ] `DELETE /api/v1/groups/:id/members/:userId` — remove member (only if balance is zero)

#### Friends
- [ ] `GET /api/v1/friends` — list friendships + net balance in user's base_currency
- [ ] `POST /api/v1/friends` — add friend by email; if not found → create ghost user + friendship
- [ ] `GET /api/v1/friends/:userId` — 1-on-1 detail: expenses, settlements, balance

---

### Block 1D — Frontend: Auth + Dashboard (2 hrs)

#### Setup
- [ ] Configure Axios base URL from `VITE_API_URL`, set `withCredentials: true` globally
- [ ] React Router v6 routes: `/login`, `/register`, `/dashboard`, `/groups/:id`, `/friends/:id`, `/expenses/*`, `/settle`, `/profile`, `/activity`
- [ ] Auth context: store `currentUser`, expose `login`, `logout`, `register` functions
- [ ] Protected route wrapper — redirect to `/login` if not authenticated (call `/auth/me` on app load)

#### Screens
- [ ] `/register` — name, email, password form → POST /auth/register → redirect to dashboard
- [ ] `/login` — email, password → POST /auth/login → redirect to dashboard
- [ ] `/dashboard` — two columns:
  - Left: Groups list (name, member count, your net balance in group)
  - Right: Friends list (name, net balance)
  - Top: Total you are owed / you owe (in your base_currency)

**Day 1 Done Checklist:**
- [ ] Can register, login, logout
- [ ] Dashboard loads groups and friends with balances
- [ ] DB schema migrated, all tables exist
- [ ] `/auth/me` returns current user from cookie

---

## Day 2 — Core: Expenses, Balances, Settlements, Detail Screens

**Goal:** Full expense lifecycle — add, view, edit, delete, settle up. Balances update correctly.

---

### Block 2A — Balance Engine (2 hrs)

This is the most critical piece. Build and unit-test this before wiring it to routes.

File: `backend/src/services/balanceService.js`

#### Step 1 — Compute raw balances for a group (or pair)
```
For each expense (where deleted_at IS NULL):
  payer = paid_by
  for each split in expense_splits:
    if split.user_id != payer:
      raw[split.user_id][payer] += split.owed_amount_in_base_currency
```

#### Step 2 — Apply settlements
```
For each settlement:
  raw[paid_by][paid_to] -= amount_in_base_currency
  (can go negative → means overpaid → flip direction)
```

#### Step 3 — Net the raw balances into a single directional map
```
For each pair (A, B):
  net = raw[A][B] - raw[B][A]
  if net > 0: A owes B net
  if net < 0: B owes A abs(net)
```

#### Step 4 — Debt simplification (min-cash-flow greedy)
```
Compute net position for each person (total owed - total owing)
Repeatedly: match the person who owes the most with the person who is owed the most
Record a simplified transaction between them
Reduce both by the min of the two amounts
Repeat until all positions are zero
```

#### Step 5 — Upsert `balances` table
```
DELETE existing balance rows for this group (or pair)
INSERT simplified transactions as (user_id_from, user_id_to, net_amount)
```

**Unit tests (Jest):**
- [ ] Equal 3-way split → correct simplified debts
- [ ] A→B + B→C → simplifies to A→C
- [ ] Settlement reduces balance correctly
- [ ] Overpayment flips direction
- [ ] All zero → no balance rows

---

### Block 2B — Backend: Expense CRUD (2 hrs)

File: `backend/src/routes/expenses.js`

- [ ] `POST /api/v1/expenses`
  - Validate: description, total_amount, currency, paid_by, split_type, splits array, group_id or friend pair
  - Fetch conversion rate from exchange rate API → store on expense
  - Validate split totals (exact must sum to total, percentage to 100%, shares to any positive)
  - Compute `owed_amount` per split in expense currency
  - Create expense + expense_splits in a transaction
  - Call `balanceService.recompute(groupId or userPair)`
  - Return created expense with splits

- [ ] `GET /api/v1/expenses?group_id=&friend_id=` — list expenses, exclude soft-deleted
- [ ] `GET /api/v1/expenses/:id` — expense detail with splits and payer info

- [ ] `PATCH /api/v1/expenses/:id`
  - **Block if settled:** check if any settlement exists between involved users in same group after expense `created_at` → 409 with message
  - Delete old `expense_splits` rows
  - Insert new splits
  - Update expense row
  - Recompute balances
  - Return updated expense

- [ ] `DELETE /api/v1/expenses/:id`
  - Soft delete: set `deleted_at = NOW()`
  - Recompute balances
  - Return 204

---

### Block 2C — Backend: Settlements (1 hr)

File: `backend/src/routes/settlements.js`

- [ ] `POST /api/v1/settlements`
  - Validate: paid_by, paid_to, amount, currency, group_id (optional)
  - Fetch conversion rate
  - Insert settlement row
  - Recompute balances
  - Return settlement

- [ ] `GET /api/v1/settlements?group_id=&friend_id=` — list settlements for context

---

### Block 2D — Frontend: Expense & Settlement Screens (3 hrs)

#### `/expenses/new`
- [ ] Context selector: group or 1-on-1 friend
- [ ] Fields: description, amount, currency, paid by (dropdown of members), split type (tabs: Equal / Exact / Percentage / Shares)
- [ ] Dynamic split input: based on selected split type, show per-member input fields
- [ ] Validation: totals must match
- [ ] Submit → POST /expenses → redirect to group or friend detail

#### `/expenses/:id`
- [ ] Show: description, amount, currency, payer, date, split breakdown per member
- [ ] Edit button (disabled with tooltip if settled)
- [ ] Delete button (with confirmation modal)

#### `/expenses/:id/edit`
- [ ] Pre-populate form from expense data
- [ ] Same validation as create
- [ ] On 409 from backend → show: "This expense has been partially settled. Reverse the settlement before editing."

#### `/settle`
- [ ] Select who you're settling with (from simplified balances)
- [ ] Pre-fill amount from current balance
- [ ] Currency selector
- [ ] Submit → POST /settlements

#### `/groups/:id`
- [ ] Member list with avatars/initials
- [ ] Simplified balances section ("You owe X ₹500", "Y owes you ₹200")
- [ ] Expense list (paginated, newest first)
- [ ] "Add Expense" button → `/expenses/new?group_id=`
- [ ] "Settle Up" button → `/settle?group_id=`

#### `/friends/:id`
- [ ] 1-on-1 balance (you owe / they owe)
- [ ] Expense list
- [ ] "Add Expense" + "Settle Up" buttons

**Day 2 Done Checklist:**
- [ ] Can add an expense with all 4 split types
- [ ] Balance updates immediately after adding expense
- [ ] Can edit expense (blocked if settled)
- [ ] Can soft-delete expense (balance recalculates)
- [ ] Can settle up — balance reduces
- [ ] Debt simplification works: A→B + B→C = A→C

---

## Day 3 — Polish: Multi-Currency, Activity, Profile, Ghost Users, Tests, Deploy

**Goal:** App is deployed, tested, and submission-ready.

---

### Block 3A — Multi-Currency (1.5 hrs)

#### Backend
- [ ] `backend/src/services/currencyService.js`
  - `fetchRate(from, to)` — call `open.er-api.com/v6/latest/{from}`, return rate to `to`
  - Cache rates in memory for 1 hour (simple object + timestamp, no Redis needed for MVP)
- [ ] On expense create/edit: call `fetchRate(expense.currency, group.base_currency)` → store on expense
- [ ] Balance recompute: convert `owed_amount * conversion_rate` before summing
- [ ] On `GET /dashboard` (or `/friends`): convert group balances from group base_currency to user base_currency using a fresh rate

#### Frontend
- [ ] Currency selector on Add Expense form (ISO 4217 dropdown — at minimum: INR, USD, EUR, GBP, JPY)
- [ ] Show currency symbol next to all amounts
- [ ] Dashboard: show total balance in user's base_currency with "≈" prefix if converted

---

### Block 3B — Activity Feed (1 hr)

- [ ] `GET /api/v1/activity?page=1&limit=20`
  - Union of: expenses (where user is payer or in splits) + settlements (where user is paid_by or paid_to)
  - Order by created_at DESC
  - Return: type (`expense`|`settlement`), description, amount, currency, group name (if group), other user, date
- [ ] `/activity` screen — infinite scroll or pagination, grouped by date

---

### Block 3C — Profile / Settings (30 min)

- [ ] `/profile` screen
  - Display name + email
  - Edit name
  - Base currency selector
  - Logout button
- [ ] `PATCH /api/v1/users/me` already built in Day 1

---

### Block 3D — Ghost User Invite Flow (1 hr)

Already handled in backend (Block 1B register + Block 1C group member add). Frontend work:

- [ ] When adding a member to a group and no user found → show: "No account found. We'll invite them as a guest."
- [ ] Ghost users shown in member lists with "(invited)" badge
- [ ] When ghost registers with same email → automatic merge → they see all their expenses

---

### Block 3E — Tests (1.5 hrs)

#### Unit Tests (`backend/src/__tests__/balanceService.test.js`)
- [ ] 2-person equal split
- [ ] 3-person unequal split
- [ ] Debt simplification: triangle case
- [ ] Settlement reduces balance
- [ ] Overpayment reversal
- [ ] Multi-currency conversion in balance calc
- [ ] Soft-deleted expenses excluded

#### Integration / API Tests (`backend/src/__tests__/api.test.js` via Supertest)
- [ ] Register → login → cookie set
- [ ] `/auth/me` returns user
- [ ] Create group → add member → create expense → check balances
- [ ] Edit expense → check balance updated
- [ ] Edit settled expense → 409
- [ ] Delete expense → balance recalculates
- [ ] Settle up → balance reduces
- [ ] Ghost register → merge → expense reassigned

```bash
# Run tests
cd backend && npm test
```

---

### Block 3F — Deployment (1 hr)

#### Backend → Railway
- [ ] Add `Procfile` or `package.json` start script: `node src/index.js`
- [ ] Set env vars in Railway dashboard:
  - `DATABASE_URL` (Railway MySQL)
  - `JWT_SECRET`
  - `EXCHANGE_RATE_API_KEY`
  - `FRONTEND_URL` (Vercel URL for CORS)
  - `NODE_ENV=production`
- [ ] Run `npx prisma migrate deploy` as part of Railway build command
- [ ] Copy Railway backend URL

#### Frontend → Vercel
- [ ] Set env vars in Vercel dashboard:
  - `VITE_API_URL` = Railway backend URL
- [ ] Vercel auto-deploys on push to `main`
- [ ] Verify CORS works: frontend can login and load dashboard

#### Smoke Test
- [ ] Register two users
- [ ] Add each other as friends
- [ ] Create a group, add both
- [ ] Add expense (equal split)
- [ ] Verify balance shows correctly
- [ ] Settle up — balance goes to zero
- [ ] Register with ghost user email — verify merge works

---

### Block 3G — Submission Files (30 min)

- [ ] `README.md` — setup instructions, env vars, AI disclosure
- [ ] `PROMPTS.md` — key prompts used
- [ ] `BUILD_PLAN.md` — this file (already done)
- [ ] `AI_CONTEXT.md` — source of truth (already done)
- [ ] Push all to GitHub (public repo)
- [ ] Submit: GitHub URL + Vercel deployed URL

---

## Summary Timeline

| Time | Block | Output |
|---|---|---|
| Pre-Day | Setup | Repo, DB, accounts |
| Day 1 AM | 1A + 1B | Schema migrated, auth working |
| Day 1 PM | 1C + 1D | Dashboard with groups/friends |
| Day 2 AM | 2A + 2B | Balance engine + expense CRUD |
| Day 2 PM | 2C + 2D | Settlements + all detail screens |
| Day 3 AM | 3A + 3B | Multi-currency + activity feed |
| Day 3 PM | 3C–3F | Profile, ghost merge, tests, deploy |
| Day 3 Eve | 3G | Submission files, final push |

---

## Critical Implementation Rules

1. **Always recompute balances inside a DB transaction** with the write that triggered it
2. **Never hard-delete expenses** — always soft delete (`deleted_at = NOW()`)
3. **Ghost merge must be atomic** — use `prisma.$transaction([...])`
4. **All balance reads must filter** `WHERE deleted_at IS NULL`
5. **JWT cookie must have** `SameSite=None; Secure` in production (cross-origin Vercel → Railway)
6. **Friendship dedup:** always store `user_id_1 < user_id_2` (lexicographic UUID comparison)
7. **Balance upsert:** use `ON DUPLICATE KEY UPDATE` or Prisma `upsert` on the unique `(group_id, user_id_from, user_id_to)` index
8. **Edit expense = delete-old-splits + insert-new-splits + recompute**, not a partial update
