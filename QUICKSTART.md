# Quick Start Guide - Splitwise Clone

## 🚀 Running Locally

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Git

### Setup (5 minutes)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/splitwise-clone.git
   cd splitwise-clone
   ```

2. **Install dependencies:**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend (in separate terminal)
   cd frontend
   npm install
   ```

3. **Start the application (requires 2 terminals):**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   # Server will start on http://localhost:3000
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   # App will open on http://localhost:5173
   ```

4. **Open browser:**
   ```
   Visit: http://localhost:5173
   ```

---

## 🎯 Testing Locally (5 minutes)

### Quick Test Flow

1. **Register Account:**
   - Click "Create one" on login page
   - Fill in: Name, Email, Password
   - Click "Create account"

2. **Create a Group:**
   - Click "+ New" in Groups section
   - Select icon, enter name: "Test Group"
   - Click "Create Group"

3. **Add an Expense:**
   - Click "+ Add expense"
   - Description: "Test Expense"
   - Amount: 1000
   - Currency: INR
   - Split type: Equal
   - Click "Save Expense"

4. **View Results:**
   - Check group page for expense
   - View balances (shows settlement state)
   - Navigate to dashboard to see summary

### Features to Explore

- **Dashboard:** Overview of all groups, friends, and balances
- **Groups:** Create, view, and manage group expenses
- **Friends:** Add 1-on-1 expense tracking
- **Activity:** See all recent transactions
- **Profile:** User settings and preferences

---

## 📦 Production Deployment

### Quick Deploy to Vercel (Frontend) - 2 minutes

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy Frontend:**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Select your GitHub repository
   - Set root directory: `./frontend`
   - Click "Deploy"

3. **Copy Frontend URL:** (e.g., https://splitwise-clone.vercel.app)

### Quick Deploy to Railway (Backend) - 3 minutes

1. **Create Railway Account:**
   - Go to https://railway.app
   - Sign in with GitHub

2. **Create PostgreSQL Database:**
   - New Project → Add PostgreSQL
   - Copy connection string from "Connect" tab

3. **Create Node.js Service:**
   - New Project → Connect GitHub Repository
   - Set root directory: `./backend`

4. **Configure Environment Variables:**
   ```
   DATABASE_URL=postgres://...
   JWT_SECRET=your-random-secret-key
   EXCHANGE_RATE_API_KEY=your-api-key
   FRONTEND_URL=https://your-vercel-url.vercel.app
   NODE_ENV=production
   ```

5. **Deploy:** Railway auto-deploys on push to GitHub

### Environment Setup - 2 minutes

**Create `.env` files from examples:**

Backend (`.env`):
```
DATABASE_URL=postgres://[your_connection_string]
JWT_SECRET=your-super-secret-jwt-key
EXCHANGE_RATE_API_KEY=e591f692eaac0039ccb303de
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
PORT=3000
```

Frontend (`.env`):
```
VITE_API_URL=https://your-railway-app.up.railway.app/api/v1
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Frontend loads at Vercel URL
- [ ] Can register new account
- [ ] Can login
- [ ] Can create group
- [ ] Can add expense
- [ ] Can view balances
- [ ] No errors in browser console
- [ ] All data persists after refresh

---

## 🔧 Troubleshooting

### Backend Won't Start
```bash
# Check logs
npm run dev

# Issues:
# - Missing dependencies: npm install
# - Database URL invalid: check .env
# - Port 3000 in use: change PORT in .env
```

### Frontend Won't Load
```bash
# Check logs
npm run dev

# Issues:
# - Backend URL incorrect: check VITE_API_URL
# - Port 5173 in use: Vite will use 5174, 5175, etc.
# - Dependencies: npm install
```

### Database Connection Failed
```bash
# Verify DATABASE_URL format
# postgres://user:password@host:port/database

# Check:
# - URL syntax correct
# - Database exists
# - Credentials valid
# - Network access allowed
```

### Expense Not Saving
```bash
# Check:
# - Backend logs for errors
# - Network tab in DevTools
# - Browser console for errors
# - Database connection
```

---

## 📚 Documentation Files

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Detailed deployment steps
- **[TESTING_REPORT.md](./TESTING_REPORT.md)** - Test results and checklist
- **[AI_CONTEXT.md](./AI_CONTEXT.md)** - Project requirements and design
- **[BUILD_PLAN.md](./BUILD_PLAN.md)** - Development timeline
- **[README.md](./README.md)** - Project overview

---

## 🚀 Next Steps

1. **Local Testing:** Follow "Testing Locally" section
2. **Prepare for Deployment:** Set up GitHub, Railway, and Vercel accounts
3. **Deploy Backend:** Follow "Quick Deploy to Railway"
4. **Deploy Frontend:** Follow "Quick Deploy to Vercel"
5. **Verify Deployment:** Run verification checklist
6. **Multi-User Testing:** Create multiple test accounts

---

## 💡 Tips

- **API Key:** Get free exchange rate API key from https://open.er-api.com
- **JWT Secret:** Generate strong secret: `openssl rand -hex 32`
- **Database Backup:** Enable Railway backups for production
- **Monitoring:** Use Railway and Vercel dashboards to monitor app
- **Logs:** Check logs regularly for errors

---

## 📞 Support

For help:
1. Check relevant documentation file
2. Review error logs
3. Check browser console (F12)
4. Review network requests (DevTools → Network tab)
5. Check troubleshooting section

---

**Ready to start?** Begin with "Running Locally" section above!
