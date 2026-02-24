# Startup Simulation

A turn-based startup simulation game where you run a company one quarter at a time. Each turn you set your product price, decide how many engineers and sales staff to hire, and choose what salary to offer. The server processes everything and shows you the results. Survive to Year 10 with cash in the bank and you win.

Built with Next.js App Router and Supabase.

---

## Getting it running

You need a Supabase account. It is free at [supabase.com](https://supabase.com). Create a new project there first.

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in two values. Both are on the **Settings → API** page of your Supabase project.

```
NEXT_PUBLIC_SUPABASE_URL=your project url here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your anon key here
```

Then go to the **SQL Editor** in your Supabase dashboard and run everything inside `supabase/schema.sql`. This creates the tables, indexes, RLS policies and the transaction function.

`npm install` downloads all the project dependencies. `npm run dev` starts the local development server.

```bash
npm install && npm run dev
```

Once running, open `http://localhost:3000` in your browser. To run the simulation unit tests at any point: `npm test`.

---

## How it works

When you click Advance Turn the browser sends four numbers to `POST /api/advance` — price, new hires, and salary percentage. That is all the client ever sends. The server reads your current game state from the database, runs the simulation, and writes the result back. The client receives the outcome. It never computes anything financial itself.

I built the simulation as a pure function in `lib/simulation.ts`. It takes the current state and your decisions as plain objects and returns the outcome. No database calls, no HTTP, no side effects. This made it easy to unit test with exact numbers against the spec formulas, and it means the core logic is completely isolated from the web layer.

The state update and history insert happen inside a single Postgres function called `advance_game_tx`. Both writes are atomic — if either fails, neither persists. I chose this over two sequential API calls because a failure halfway through would leave the game in an inconsistent state with no clean recovery path.

Row Level Security is on both tables. Every query is scoped to the authenticated user automatically. I used `security invoker` on the Postgres function so RLS applies inside the transaction too, not just at the API layer.

---

## The database

Two tables. `games` holds the live state of a session — cash, headcount, quality, year, quarter, and a flag for whether the game has ended. `quarterly_history` stores an immutable snapshot after each turn with revenue, net income, cash and headcount. History rows are never updated, only inserted.

There is a compound index on `(game_id, year desc, quarter desc)` which is exactly how the last-four-quarters query is ordered. One index scan, no sort step.

Quality is not stored in history. The dashboard history table shows revenue, net income, cash and headcount which is what is needed. Current quality is always available from the games row.

The competitors field is stored and shown on the dashboard because it is part of the initial game state. The demand formula does not reference it directly, so it is not passed into the simulation function. If the model is updated with a market-share mechanic the field is already in the schema and type system.

---

## Decisions I made

**No game reset.** There is one game per user enforced by a unique constraint. A reset sounds simple but it is not. Deleting a game raises a question that is not straightforward: should the history go too? If yes you lose the audit trail. If no the data becomes orphaned. Doing it right means a soft-delete or archive pattern, a confirmation step, and a clear explanation to the user of what they are losing. Shipping a half-built version of that would be worse than leaving it out and documenting the gap, which is what I did.

**Table instead of a chart.** A chart looks nicer but needs either a dependency or a significant amount of custom SVG. A table shows all the numbers with no ambiguity and no third-party code. For a simulation where the numbers are the point, that felt like the right call.

**20 desks in the office visualization.** The desk count is a display choice. At early stage you see mostly empty desks. As you hire they fill up. When you grow beyond 20 the grid stays full and the real headcount is shown in the summary and KPI cards. Hiring is never capped by the desk count — payroll is the natural constraint on aggressive hiring and that comes from the simulation model.

**Salary range constants live in one place.** `SALARY_PCT_MIN` and `SALARY_PCT_MAX` are exported from `lib/simulation.ts` and used by both the server validation and the client form. If the range ever changes it is one edit.

---

## What I would build next

- Game restart with an explicit archive of completed runs
- Integration tests for the `/api/advance` route
- Debounce on the Advance Turn button to close the double-click race
- A migration-based schema management setup instead of a single SQL file

---

## Known gaps

No in-app way to start a new game. To reset, delete the row in the `games` table from the Supabase dashboard. Rapid double-clicking Advance Turn can submit two requests before the first one completes. The database function blocks advancing a game that is already over but it does not rate-limit mid-game submissions.
