# SCOPE.md — Splitwise Clone: Scope, Schema & Source of Truth

> This file is the single source of truth for the entire project.
> All implementation decisions must trace back to this document.
> Update this file whenever requirements, architecture, schema, UI, or logic changes.
> Another engineer must be able to paste this file into an AI tool and recreate a similar app.

---

## 1. Project Goal

Build a working, deployed Splitwise clone in 3 days that demonstrates:
- **Technical depth** — clean architecture, solid code
- **Product thinking** — real workflows, edge cases handled
- **Working prototype** — end-to-end deployed and usable

---

## 2. Splitwise Research Summary

Splitwise core concepts:
- Users can form **groups** (e.g. "Trip to Goa") or track **1-on-1** expenses with friends
- Expenses are **split** among participants in various ways
- The app tracks **who owes whom** across all expenses
- Users can **settle up** (record a payment), which reduces balances
- Balances are **simplified** (minimized transactions) — e.g. if A owes B and B owes C, A pays C directly

---

## 3. User Personas

- **Logged-in users** — register with email + password, manage their own expenses, groups, and friends
- **Ghost/invited users** — non-registered members added to groups by email; placeholder until they join
- Both single-user tracking mode (one person logs everything) and multi-user mode (everyone has an account) are supported

---

## 4. MVP Scope

### In Scope
- User registration and login (email + password)
- Dashboard: list of groups + list of friends (1-on-1)
- Create and manage groups
- Add friends (1-on-1 context)
- Add expenses — with all split types (see §8)
- Edit and delete expenses
- Expense detail view
- Settle up between two users
- Simplified/minimized balance calculation
- Multi-currency support with conversion rates
- Invite non-registered users by email (ghost placeholder until they join)
- Profile / Settings screen
- Integration + API tests and unit tests for balance logic

### Out of Scope (explicitly excluded)
- Recurring expenses
- Comments on expenses
- Receipt / photo upload
- Notifications (push, email, in-app)
- Mobile app (iOS/Android)

---

## 5. UI Screens

| Screen | Description |
|---|---|
| `/register` | Email + password registration |
| `/login` | Email + password login |
| `/dashboard` | List of groups + list of friends, net balances shown |
| `/groups/:id` | Group detail — members, expenses, balances |
| `/friends/:id` | Friend detail — 1-on-1 expenses and balance |
| `/expenses/new` | Add expense (group or 1-on-1, all split types) |
| `/expenses/:id` | Expense detail |
| `/expenses/:id/edit` | Edit expense |
| `/settle` | Settle up between two users |
| `/profile` | Profile and settings |
| `/activity` | Activity feed across all groups and friends |

---

## 6. Authentication

- **Method:** Email + password only
- **Token storage:** JWT stored in **httpOnly cookie** (not localStorage — XSS safe)
- **Flow:**
  1. User registers → password hashed (bcrypt) → JWT issued → set as httpOnly cookie
  2. Every request sends cookie automatically → backend validates JWT
  3. Logout → cookie cleared server-side
- No OAuth, no magic links in MVP

---

## 7. User Modes

- **Multi-user:** All participants have accounts; expenses are linked to real user IDs
- **Single-user / ghost:** When adding an expense, a user can invite a non-registered person by email. A **ghost user** record is created (no password, flagged `is_ghost: true`). When that person registers with the same email, the ghost account is **automatically merged** into the real account — no manual confirmation required.
- **Ghost merge logic:** On `POST /auth/register`, if the submitted email matches an existing ghost user row, the system: (1) reassigns all `expense_splits.user_id` from ghost ID → new real user ID, (2) reassigns all `settlements.paid_by` / `settlements.paid_to`, (3) reassigns all `group_members.user_id`, (4) recomputes affected balances, (5) deletes the ghost user row.

---

## 8. Expense Split Types

All four split types must be supported:

| Type | Description |
|---|---|
| Equal | Total divided equally among all participants |
| Exact amounts | Each participant's share is a specific amount (must sum to total) |
| Percentage | Each participant's share is a percentage (must sum to 100%) |
| Custom shares | Weighted shares (e.g. 2:1:1 ratio) |

- The **payer** is the person who paid the full amount
- The expense records who paid and what each person owes

---

## 9. Groups

- A group has a name, optional description, and a list of members
- Members can be registered users or ghost (invited-by-email) users
- Both group expenses and 1-on-1 (non-group) expenses are supported
- 1-on-1 expenses are not attached to a group (group_id is null)

---

## 10. Settlements

- Settlements are stored in a **separate `settlements` table**, independent of expenses
- A settlement records: who paid, who received, how much, in which currency, and when
- Settling up **reduces the precomputed balance** between two users
- Settlements are not expenses — they do not affect the expense ledger

---

## 11. Balance Calculation

- Strategy: **Simplified / minimized transactions**
  - Net balances are computed across all expenses and settlements in a group (or between two friends)
  - A debt-simplification algorithm (e.g. greedy min-cash-flow) reduces the number of transactions needed
  - Example: A owes B ₹100, B owes C ₹100 → simplified to A pays C ₹100 directly
- Storage: **Precomputed balances stored in DB**, updated on every write (expense add/edit/delete, settlement add)
- A `balances` table stores net amount owed between each pair of users within a group (and globally)
- On any mutation, the balance rows for affected user pairs are recomputed and saved

---

## 12. Multi-Currency

- Each expense stores a `currency` field (ISO 4217 code, e.g. "USD", "INR", "EUR")
- Conversion rates are fetched from an external exchange rate API at the time of expense creation
- `base_currency` is set at **both levels**:
  - **Group level:** all balances within a group are stored in the group's `base_currency`
  - **User level:** the dashboard aggregates all balances (across groups and 1-on-1) into the user's preferred `base_currency`
- Balances in the `balances` table are stored in the group's base currency (or the user's base currency for 1-on-1)
- The dashboard re-converts group balances into the user's base currency for display (using stored rates or a fresh fetch)
- The conversion rate used is stored on the expense row for auditability

---

## 13. Data Model

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | VARCHAR | |
| email | VARCHAR UNIQUE | |
| password_hash | VARCHAR | null for ghost users |
| is_ghost | BOOLEAN | true = invited, not yet registered |
| base_currency | VARCHAR | default 'INR' |
| created_at | TIMESTAMP | |

### `groups`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | VARCHAR | |
| description | TEXT | nullable |
| base_currency | VARCHAR | e.g. 'INR' |
| created_by | UUID FK → users | |
| created_at | TIMESTAMP | |

### `group_members`
| Column | Type | Notes |
|---|---|---|
| group_id | UUID FK → groups | |
| user_id | UUID FK → users | |
| joined_at | TIMESTAMP | |
| PRIMARY KEY | (group_id, user_id) | |

### `friendships`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id_1 | UUID FK → users | always smaller UUID for dedup |
| user_id_2 | UUID FK → users | |
| created_at | TIMESTAMP | |

### `expenses`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| group_id | UUID FK → groups | nullable (null = 1-on-1) |
| description | VARCHAR | |
| total_amount | DECIMAL(10,2) | |
| currency | VARCHAR | ISO 4217 |
| conversion_rate | DECIMAL(12,6) | rate to group/user base_currency |
| paid_by | UUID FK → users | who paid |
| split_type | ENUM | 'equal','exact','percentage','shares' |
| created_by | UUID FK → users | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | nullable, soft delete |

### `expense_splits`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| expense_id | UUID FK → expenses | |
| user_id | UUID FK → users | |
| owed_amount | DECIMAL(10,2) | in expense's currency |
| share_value | DECIMAL(10,4) | raw input (%, ratio, exact) |
| created_at | TIMESTAMP | |

### `settlements`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| group_id | UUID FK → groups | nullable (null = 1-on-1) |
| paid_by | UUID FK → users | person who paid |
| paid_to | UUID FK → users | person who received |
| amount | DECIMAL(10,2) | |
| currency | VARCHAR | |
| conversion_rate | DECIMAL(12,6) | |
| created_at | TIMESTAMP | |

### `balances`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| group_id | UUID FK → groups | nullable (null = global/friend balance) |
| user_id_from | UUID FK → users | user who owes |
| user_id_to | UUID FK → users | user who is owed |
| net_amount | DECIMAL(10,2) | in base currency, always positive |
| updated_at | TIMESTAMP | |

> Note: Balances are always stored as directional pairs (from → to). A net of 0 means settled. Rows are upserted on every expense or settlement mutation.

---

## 14. API Design

All endpoints are REST (JSON over HTTP). Base path: `/api/v1`

### Auth
| Method | Path | Description |
|---|---|---|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login, set httpOnly JWT cookie |
| POST | /auth/logout | Clear JWT cookie |
| GET | /auth/me | Get current user from cookie |

### Users
| Method | Path | Description |
|---|---|---|
| GET | /users/search | Search users by email (for inviting) |
| PATCH | /users/me | Update profile / base currency |

### Groups
| Method | Path | Description |
|---|---|---|
| GET | /groups | List groups for current user |
| POST | /groups | Create group |
| GET | /groups/:id | Get group detail (members, balances) |
| PATCH | /groups/:id | Edit group |
| POST | /groups/:id/members | Add member (by email, creates ghost if needed) |
| DELETE | /groups/:id/members/:userId | Remove member |

### Friends
| Method | Path | Description |
|---|---|---|
| GET | /friends | List friends + balances |
| POST | /friends | Add friend by email |
| GET | /friends/:userId | Get 1-on-1 detail with a friend |

### Expenses
| Method | Path | Description |
|---|---|---|
| GET | /expenses | List expenses (filter by group_id or friend userId) |
| POST | /expenses | Create expense |
| GET | /expenses/:id | Get expense detail |
| PATCH | /expenses/:id | Edit expense |
| DELETE | /expenses/:id | Soft-delete expense |

### Settlements
| Method | Path | Description |
|---|---|---|
| POST | /settlements | Record a settlement |
| GET | /settlements | List settlements (filter by group or friend) |

### Balances
| Method | Path | Description |
|---|---|---|
| GET | /balances | Get simplified balances (group or global) |

### Activity
| Method | Path | Description |
|---|---|---|
| GET | /activity | Paginated feed of expenses + settlements for current user |

---

## 15. Frontend Architecture

- **Framework:** React (Vite)
- **Routing:** React Router v6
- **State management:** React Context + useReducer (or lightweight — no Redux)
- **HTTP client:** Axios (with `withCredentials: true` for cookie-based auth)
- **Styling:** TailwindCSS
- **Currency:** Use a free exchange rate API (e.g. `exchangerate.host` or `open.er-api.com`) — called from backend, not frontend

---

## 16. Backend Architecture

- **Database**: Vercel Postgres (PostgreSQL) using Prisma ORM.
- **Backend**: Node.js, Express.js (deployed as Vercel Functions).
- **Frontend**: React (Vite), TailwindCSS v4.
- **Auth:** JWT via `jsonwebtoken`, stored in httpOnly cookie via `cookie-parser`
- **Password hashing:** bcrypt
- **Validation:** Zod (request body validation)
- **Balance recompute:** Triggered as a service function after every expense/settlement write — runs the min-cash-flow simplification algorithm and upserts `balances` rows
- **Currency conversion:** Fetched from external API on expense creation; rate stored on expense row

---

## 17. Database

- **Engine:** MySQL (hosted on Railway or PlanetScale)
- **ORM:** Prisma
- **Migrations:** Prisma Migrate
- **Soft deletes:** `deleted_at` timestamp on expenses (not hard deleted)

---

## 18. Deployment

| Layer | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Railway or Render |
| Database | Railway (MySQL) or PlanetScale |

- Environment variables managed via Vercel dashboard (frontend) and Railway/Render dashboard (backend)
- Frontend calls backend via `VITE_API_URL` env var
- CORS configured on backend to allow Vercel frontend origin with credentials

---

## 19. Testing

- **Unit tests:** Balance calculation / debt simplification algorithm (Jest)
- **Integration / API tests:** Supertest on Express routes — cover auth, expense CRUD, settlement, balance recompute
- **Test database:** Separate MySQL test DB (or SQLite in-memory via Prisma for speed)

---

## 20. Known Risks & Tradeoffs

| Risk | Decision / Mitigation |
|---|---|
| Balance recompute on every write may be slow for large groups | Acceptable for MVP scale; can optimize later |
| Ghost user merge on registration is complex | Must match email on register → merge ghost → reassign splits/settlements |
| Multi-currency introduces rounding errors | Store `conversion_rate` on expense; round to 2dp only at display layer |
| Debt simplification algorithm correctness | Unit-test exhaustively; use greedy min-cash-flow |
| Edit expense must retrigger balance recompute | Treat edit as delete-old + insert-new in balance logic |
| Edit blocked if settlements exist covering this expense | On `PATCH /expenses/:id`, check if any `settlements` exist between the same pair of users in the same group after the expense's `created_at`. If yes, return `409 Conflict` with a clear error message. User must reverse the settlement first. |
| Soft deletes must be excluded from balance reads | All balance queries filter `deleted_at IS NULL` |
| CORS + httpOnly cookies in cross-origin setup | Set `SameSite=None; Secure` on cookie; configure CORS `credentials: true` |

---

## 21. Build Plan (to be finalized before implementation)

> This section will be populated after the interview phase is complete and the full context is confirmed.

### Day 1
- Project scaffolding (frontend + backend repos)
- DB schema + Prisma migrations
- Auth endpoints (register, login, logout, /me)
- User, Group, Friend APIs
- Basic dashboard UI (login → dashboard)

### Day 2
- Expense CRUD (all split types)
- Balance recompute service (min-cash-flow algorithm)
- Settlement endpoint
- Group detail + Friend detail screens
- Add Expense + Expense Detail + Edit Expense screens

### Day 3
- Multi-currency (fetch rates, store on expense, convert balances)
- Activity feed
- Profile/Settings screen
- Ghost user invite + merge on registration
- Integration + unit tests
- Deploy frontend to Vercel, backend to Railway/Render
- End-to-end smoke test

---

## 22. Submission Requirements

The following deliverables must be produced and submitted:

| # | Deliverable | Notes |
|---|---|---|
| 1 | **Public deployed app URL** | Frontend on Vercel, Backend on Railway/Render |
| 2 | **GitHub repository** | Single public repo (monorepo: `/frontend` + `/backend`) |
| 3 | **README.md** | Setup instructions, env vars, how to run locally, AI tool used |
| 4 | **DECISIONS.md** | Decision log and Day-by-day build plan |
| 5 | **SCOPE.md** | This file — anomaly log, database schema, and source of truth for the entire project |
| 6 | **AI_USAGE.md** | Key prompts used and cases where AI was wrong |

### Repo Structure
```
splitwise-clone/
├── frontend/          # React + Vite + TailwindCSS
├── backend/           # Node.js + Express + Prisma
├── SCOPE.md           # Anomaly log and database schema
├── DECISIONS.md       # Decision log
├── README.md          # Setup + AI disclosure
└── AI_USAGE.md        # Key prompts and AI usage details
```

*Last updated: submission requirements added.*

---

## 23. Anomaly Log (CSV Data Handling)

> This section details the data anomalies encountered when importing the provided CSV into our database schema, and the exact steps taken to resolve them.

| Issue Detected | Description / Why it was a problem | How we resolved it |
|---|---|---|
| **Empty or Missing Fields** | Some CSV rows lacked `amount`, `paid_by`, or `currency`. | Skipped rows without `amount` or `paid_by`. Fallback to 'INR' for missing currency. |
| **Inconsistent Case in Names** | Users entered names like "priya" vs "Priya", leading to duplicate accounts. | Standardized normalization internally where needed or mapped varying cases manually. |
| **Settlement Identification** | Settlements did not have a clear type, only an empty `split_type` and target in `split_with`. | Inferred blank `split_type` as a Settlement, extracting `paid_to` from `split_with`. |
| **Malformed Split Shares** | Complex strings in `split_details` (e.g., "Rohan 700", "Aisha 30%"). | Used Regex parsing (`/(.+?)\s+([\d.]+)%?/`) to extract user names and numbers dynamically. |
| **Calculated Share Rounding** | Custom split fractions didn't perfectly match the total amount. | Calculated fractional shares and normalized up to the total in our script logic. |
