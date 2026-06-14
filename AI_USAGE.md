# AI_USAGE.md — Key Prompts and AI Usage

This file documents the key prompts used when working with Claude (Anthropic) to scope, design, and plan this project. These prompts can be reused to recreate a similar planning session.

---

## Prompt 1 — Initial Assignment Prompt (Master Prompt)

This was the opening prompt that initiated the entire session:

```
You are a junior engineer helping me complete an internship assignment.
The assignment is to reverse engineer Splitwise, scope a realistic 3-day version,
and build a working deployed app.

Important instructions:
1. Do not assume product requirements.
2. Do not jump directly into implementation.
3. Ask me detailed questions about product scope, UX, workflows, edge cases, and engineering decisions.
4. Ask about every implementation detail needed to build the app.
5. After each answer I give, update a Markdown file called AI_CONTEXT.md.
6. AI_CONTEXT.md must become the source of truth for the entire project.
7. The final app must be buildable from AI_CONTEXT.md.
8. Another evaluator should be able to paste AI_CONTEXT.md into the same AI tool and recreate a similar app.
9. Before writing code, produce a build plan based only on the agreed context.
10. During implementation, keep updating AI_CONTEXT.md whenever requirements, architecture, schema, UI, or logic changes.
11. Do not recommend technical solutions. Your job is to let me think through the technical solution.

Start by interviewing me.
Ask questions across:
- product goals
- Splitwise research
- core workflows
- user personas
- MVP scope
- out-of-scope features
- data model
- authentication
- groups
- expenses
- settlements
- balance calculation
- UI screens
- routing
- frontend architecture
- backend architecture
- database choice
- API design
- deployment
- testing
- known risks
- tradeoffs

Do not give me a final plan until you have asked enough questions.
```

---

## Prompt 2 — Deliverables Clarification

After the interview was complete, this prompt was used to orient the output toward submission requirements:

```
Required Deliverables:
1. Public deployed app URL
2. GitHub repository
3. README.md with setup instructions and the AI used
4. BUILD_PLAN.md
5. AI_CONTEXT.md
6. Any key prompts used

This is how I have to submit so help me accordingly.
Just give me the build plan and required things.
```

---

## How to Recreate This Session

To recreate a similar planning session for this project or a similar one:

1. Paste **Prompt 1** into Claude (claude.ai) as your opening message
2. Answer each interview question honestly — Claude will ask across all dimensions (auth, data model, balances, deployment, etc.)
3. After the interview, paste **Prompt 2** to get the build plan and submission files
4. The resulting `AI_CONTEXT.md` becomes your source of truth
5. During implementation, prompt Claude with: _"Here is my AI_CONTEXT.md. I am now implementing [Block X]. Help me write [specific file]."_

---

## Implementation Prompts (Template)

Use prompts like these during Day 1–3 implementation:

### For schema:
```
Here is my AI_CONTEXT.md (paste full file).
I am implementing Block 1A — Prisma Schema.
Based only on §13 (Data Model), write the complete prisma/schema.prisma file.
Do not add any fields or tables not mentioned in AI_CONTEXT.md.
```

### For balance engine:
```
Here is my AI_CONTEXT.md (paste full file).
I am implementing Block 2A — Balance Engine.
Based on §11 (Balance Calculation), write backend/src/services/balanceService.js
including the min-cash-flow debt simplification algorithm.
Also write Jest unit tests for the 7 cases listed in BUILD_PLAN.md Block 2A.
```

### For an API route:
```
Here is my AI_CONTEXT.md (paste full file).
I am implementing POST /api/v1/expenses (Block 2B).
Based on §8 (Split Types), §11 (Balance Calculation), §12 (Multi-Currency),
and §14 (API Design), write backend/src/routes/expenses.js.
Use Express, Prisma, and Zod. Call balanceService.recompute after every write.
```

### For a frontend screen:
```
Here is my AI_CONTEXT.md (paste full file).
I am implementing the Add Expense screen (/expenses/new) from §5 (UI Screens).
Use React, TailwindCSS, React Router v6, and Axios with withCredentials: true.
Support all 4 split types from §8 with dynamic per-member input fields.
Validate that split totals match before submitting.
```

---

## AI Tool Used

**Claude Sonnet 4.6** by Anthropic  
Accessed via: [claude.ai](https://claude.ai)  
Date of session: June 2026

---

## Cases Where AI Was Wrong

1. **Incorrect Split Calculation for CSV**
   - **What happened**: When generating the CSV parsing script (`import_csv.js`), the AI initially provided a straightforward substring split which failed on irregular CSV data (e.g. `Rohan 700` and `Aisha 30%` mixed together).
   - **How it was caught**: Running the import script caused NaN owed amounts in the database.
   - **Fix applied**: We completely rewrote the loop using a custom regex pattern (`/(.+?)\s+([\d.]+)%?/`) and explicit conditionals for PERCENTAGE versus SHARES instead of naive split logic.

2. **Ghost User DB Constraints**
   - **What happened**: The AI generated a Prisma schema for `users` with an empty password constraint, but Prisma nullable defaults crashed the auth middleware later.
   - **How it was caught**: The backend threw a 500 error when trying to run `bcrypt.compare` against `null` values during standard login testing.
   - **Fix applied**: We changed the code flow in `auth.js` to ensure login is instantly rejected for `is_ghost: true` users *before* attempting crypt operations.

3. **Settlement Deduction Directionality**
   - **What happened**: When writing the min-cash-flow algorithm, the AI erroneously deducted settlement values from the source's outgoing debt without balancing the target's net.
   - **How it was caught**: Unit tests failed on the `Settlement reduces balance` edge case, showing an unclosed debt cycle.
   - **Fix applied**: Modified `balanceService.js` to properly decrement `raw[paid_by][paid_to]` and check logic for negative overlap to correctly reverse directional edges in the memory map.
