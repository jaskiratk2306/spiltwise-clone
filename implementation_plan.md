# Splitwise Clone Implementation Plan

This plan follows the `BUILD_PLAN.md` to build a functional Splitwise clone.

## Proposed Changes

### Backend
- [x] Auth: Register, Login, Logout, /me
- [x] Middlewares: JWT verification
- [x] Routes: Users, Groups, Friends, Expenses, Settlements, Balances, Activity
- [x] Services: balanceService (Debt simplification), currencyService (Exchange rates)

### Frontend
- [x] Core: API service, Auth context
- [x] Navigation: Navbar, Protected Routes
- [x] Pages: Dashboard, Login, Register, GroupDetail, FriendDetail, NewExpense, Settle, Activity, Profile
