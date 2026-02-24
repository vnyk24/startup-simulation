# Startup Simulation

A turn-based startup simulation game where you run a company one quarter at a time. Each turn you set your product price, decide how many engineers and sales staff to hire, and choose what salary to offer. The server processes everything and shows you the results. Survive to Year 10 with cash in the bank and you win.

Built with Next.js App Router and Supabase.

## Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project root, copy the env file and fill in your keys (found at **Settings > API** in Supabase):

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=your project url here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your anon key here
```

3. In the Supabase **SQL Editor**, paste and run the contents of `supabase/schema.sql`.
4. From the project root, install dependencies and start the dev server:

```bash
npm install && npm run dev
```

Open `http://localhost:3000`. To run tests: `npm test`.

## What was built

- Email and password authentication via Supabase Auth
- Persistent game state stored in Postgres, one game per user
- Quarterly decision panel: unit price, engineers to hire, sales staff to hire, salary percentage
- `POST /api/advance` route that runs the full simulation on the server and persists the result
- Dashboard showing cash, revenue, net income, headcount, year, quarter, last 4 quarters history table, and a product quality KPI
- Office visualization with 20 desks showing engineers, sales staff, and empty seats
- Win condition at Year 10 with positive cash, lose condition when cash hits zero or below
- Pure simulation function in `lib/simulation.ts` with unit tests
- Atomic state update using a Postgres transaction function so history and game state never get out of sync

## Architecture

```
Browser
  │  POST /api/advance  (price, hires, salary %)
  ▼
/api/advance  ──  validate input
  │
  ▼
simulateQuarter()        lib/simulation.ts  (pure function, no side effects)
  │  outcome
  ▼
advance_game_tx          Postgres transaction  (atomic)
  │  write
  ▼
games + quarterly_history tables
  │  updated state
  ▼
Browser
```

The client sends four numbers and nothing else. All financial logic runs in `lib/simulation.ts`, a pure function with no database calls or side effects. The result is written atomically via a Postgres transaction function so the game state and history are always in sync. Row Level Security on both tables ensures users only ever access their own data.

## Tradeoffs

**No game reset.** One game per user, enforced by a unique constraint. A reset sounds simple but raises questions that are not straightforward: should the history go too? If yes you lose the audit trail. If no the data becomes orphaned. Doing it right means a soft-delete or archive pattern, a confirmation step, and a clear explanation of what the user is losing. Shipping a half-built version would be worse than leaving it out and documenting the gap.

**Table instead of a chart.** A chart needs a dependency or a significant amount of custom SVG. A table shows all the numbers with no ambiguity and no third-party code.

**20 desks in the office visualization.** At early stage you see mostly empty desks. As you hire they fill. When headcount exceeds 20 the grid stays full and the real count appears in the KPI cards. Hiring is never capped by the desk count; payroll is the natural constraint and that comes from the simulation model.

**Salary range constants in one place.** `SALARY_PCT_MIN` and `SALARY_PCT_MAX` are exported from `lib/simulation.ts` and used by both server validation and the client form. One edit to change both.

## What was not built

- In-app game reset or new game flow
- Multiplayer or leaderboard
- Charts for history data
- Integration tests for the `/api/advance` route
- Migration-based schema management

## Known issues

No in-app way to start a new game. To reset, delete the row in the `games` table from the Supabase dashboard. Rapid double-clicking Advance Turn can submit two requests before the first completes. The database function blocks advancing a finished game but does not rate-limit mid-game submissions.
