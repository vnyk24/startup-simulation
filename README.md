# Startup Simulation (Option A)

Single-player, turn-based startup simulation built with Next.js App Router and Supabase.

## Setup
1. `cp .env.example .env.local` — then fill in your Supabase project URL and anon key
2. `npm install`
3. In your Supabase SQL editor, run the contents of `supabase/schema.sql`
4. `npm run dev`

Run simulation unit tests anytime with `npm test`.

## Architecture
- **Frontend:** Next.js App Router pages and small client components for auth, decisions, and logout.
- **Backend API:** `POST /api/advance` validates input, fetches current game, runs pure simulation logic server-side, and persists via one transactional DB function.
- **Domain logic:** `lib/simulation.ts` is pure, deterministic, and shared only on the server path.
- **Persistence:** `games` stores current state; `quarterly_history` stores immutable quarter snapshots.
- **Security:** Supabase Auth + RLS policies isolate every user to their own rows. Simulation outcomes are never computed on the client.

## Model Notes
- `competitors` is stored per the spec's initial state table (fixed at 2) and displayed on the dashboard. The per-quarter formulas provided in the spec (`demand = quality * 10 - price * 0.0001`) do not reference it, so it is not passed into the simulation function. If the spec is updated to include a market-share mechanic, `competitors` is already in the schema and type system.

## Tradeoffs

**One game per user, no reset flow.**
The schema enforces a single active game per user via a `unique(user_id)` constraint. There is no in-app way to start over. This was a deliberate choice, not an oversight.

A game reset endpoint (`DELETE /games`) is simple to write but unsafe to ship without a confirmation gate, and a confirmation gate requires either a modal component or a multi-step API flow. Both paths add client-side state and UI surface area that the assignment explicitly discourages. More importantly, introducing a destructive write operation mid-game raises a question the spec does not answer: should completed history be preserved or wiped? Preserving it requires a soft-delete or archive pattern; wiping it breaks the audit trail that quarterly history exists to provide.

The right implementation is a `POST /api/reset` that deletes the game row (cascading to history via the FK constraint), paired with a confirmation step and a clear explanation of what is lost. That flow exists in the Known Issues section as the first candidate for a follow-on iteration. Shipping a half-built version of it would be worse than documenting the gap honestly.

**Table over chart for quarterly history.**
The spec allows either. A chart would be more visually engaging but requires a charting dependency or significant custom SVG work. A table communicates all six required fields with zero ambiguity and no third-party code. Given the evaluation emphasis on judgment and clarity over polish, the table is the more defensible choice.

**Postgres function for atomic writes.**
State update and history insert are wrapped in a single PL/pgSQL function (`advance_game_tx`) rather than two sequential API calls. This means partial writes are impossible — if the history insert fails, the game state rolls back. The tradeoff is that some business logic lives in the database layer, which makes it harder to unit test in isolation. The simulation logic itself remains in a pure TypeScript function precisely to keep that core testable without any database dependency.

## Intentionally Not Built
- Multiplayer support
- Rich charting and animations
- Admin analytics or balancing tools
- End-to-end / integration tests (unit tests for simulation logic are included)

**Office visualization shows 20 desks, hiring is uncapped.**
The spec says "rendering approach is unrestricted" and does not specify a desk count. 20 was chosen because it gives a clear visual signal at both the early stage (6 people, 14 empty desks) and a full office (20 people) without the grid becoming too dense to read. When headcount exceeds 20 the visualization keeps all desks filled and shows the real total with an overflow label. Hiring itself is never restricted — the simulation model has no desk-capacity rule, and payroll scaling is the natural constraint on aggressive hiring. The actual headcount is always shown accurately in the KPI cards and history table regardless of what the office floor displays.

## Schema Decisions
- `quarterly_history` does not store `quality`. The spec's required history display lists revenue, net income, cash, and headcount — quality is not in that list. Current quality is always readable from the `games` row. Adding it to history was a conscious tradeoff to keep the snapshot table minimal.

## Known Issues
- No in-app game reset. To start over, the existing row in `games` must be deleted via the Supabase dashboard. A reset endpoint was scoped out intentionally.
- Rapid double-clicking "Advance Turn" could submit two simultaneous requests. The DB function guards against advancing an already-ended game but does not enforce per-user rate limiting. An idempotency key or debounce would close this gap.

## Potential Improvements
- Add optimistic concurrency checks for duplicate click protection.
- Add integration tests for `/api/advance` and simulation edge cases.
- Add game restart flow and archived runs.
- Add deploy pipeline and Supabase migrations directory for CI.

## Why Server-Authoritative
The assignment’s core risk is client-side tampering of business outcomes. Keeping quarter advancement in `/api/advance` and persisting through server-controlled writes makes financial progression auditable, consistent, and secure. This also keeps game rules centralized in one pure function and avoids drift between UI and backend logic.
