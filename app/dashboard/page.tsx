import DecisionPanel from "@/components/DecisionPanel";
import LogoutButton from "@/components/LogoutButton";
import OfficeVisualization from "@/components/OfficeVisualization";
import ThemeToggle from "@/components/ThemeToggle";
import { getCumulativeProfit, getLastFourQuarters, getOrCreateGameForUser, requireAuthedUser } from "@/lib/gameRepo";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export default async function DashboardPage() {
  const { user } = await requireAuthedUser();
  const game = await getOrCreateGameForUser(user.id);
  const history = await getLastFourQuarters(game.id);
  const latestQuarter = history[0];

  const totalQuarters = (game.year - 1) * 4 + (game.quarter - 1);
  const progressPercent = Math.min((totalQuarters / 36) * 100, 100);

  const isLost = game.cash <= 0;
  const isWon = game.year >= 10 && game.cash > 0;
  const isGameOver = game.is_over || isLost || isWon;

  const cumulativeProfit = isWon ? await getCumulativeProfit(game.id) : 0;

  return (
    <div className="db-shell">
      <header className="db-topbar">
        <div className="db-topbar-left">
          <span className="db-brand">Startup Sim</span>
          <span className="db-period">Year {game.year} &middot; Q{game.quarter}</span>
        </div>
        <div className="db-topbar-right">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      <div className="db-body">
        <aside className="db-left">
          <div className="db-kpi-stack">
            <div className="kpi-card kpi-primary">
              <span className="kpi-label">Cash on hand</span>
              <span className="kpi-value">{money(game.cash)}</span>
            </div>
            <div className="kpi-row">
              <div className="kpi-card">
                <span className="kpi-label">Last revenue</span>
                <span className="kpi-value kpi-mid">{latestQuarter ? money(latestQuarter.revenue) : "—"}</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Last net income</span>
                <span className={`kpi-value kpi-mid ${latestQuarter && latestQuarter.net_income < 0 ? "val-negative" : "val-positive"}`}>
                  {latestQuarter ? money(latestQuarter.net_income) : "—"}
                </span>
              </div>
            </div>
            <div className="kpi-row">
              <div className="kpi-card">
                <span className="kpi-label">Engineers</span>
                <span className="kpi-value kpi-mid">{game.engineers}</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Sales staff</span>
                <span className="kpi-value kpi-mid">{game.sales_staff}</span>
              </div>
            </div>
            <div className="kpi-row">
              <div className="kpi-card kpi-quality">
                <span className="kpi-label">Product quality</span>
                <div className="quality-row">
                  <span className="kpi-value kpi-mid">{game.quality.toFixed(1)}</span>
                  <span className="quality-max">/ 100</span>
                </div>
                <div className="quality-bar-wrap">
                  <div className="quality-bar-fill" style={{ width: `${Math.min(game.quality, 100)}%` }} />
                </div>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Competitors</span>
                <span className="kpi-value kpi-mid">{game.competitors}</span>
                <span className="kpi-sub">fixed</span>
              </div>
            </div>
          </div>

          <OfficeVisualization engineers={game.engineers} sales={game.sales_staff} />

          <div className="db-card db-progress-card">
            <div className="db-card-head">
              <h2>Campaign progress</h2>
              <span className="badge">{Math.round(progressPercent)}%</span>
            </div>
            <p className="db-card-sub">Reach Year 10 with positive cash.</p>
            <div
              className="progress-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
            >
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="progress-label">
              {totalQuarters} of 36 quarters completed
            </p>
          </div>

          {isLost && (
            <div className="end-state end-lost">
              <h2>Game Over</h2>
              <p>Your company ran out of cash in Year {game.year} Q{game.quarter}.</p>
              <p>Start a new game to try again.</p>
            </div>
          )}

          {isWon && (
            <div className="end-state end-won">
              <h2>You Win</h2>
              <p>Reached Year 10 with <strong>{money(game.cash)}</strong> cash on hand.</p>
              <p>Total profit: <strong>{money(cumulativeProfit)}</strong></p>
            </div>
          )}
        </aside>

        <main className="db-right">
          <DecisionPanel isGameOver={isGameOver} />

          <div className="db-card">
            <div className="db-card-head">
              <h2>Last 4 Quarters</h2>
              <span className="db-card-sub">Quarter history</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Revenue</th>
                    <th>Net Income</th>
                    <th>Cash</th>
                    <th>Eng</th>
                    <th>Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={6}>No turns played yet. Submit your first decision.</td>
                    </tr>
                  ) : (
                    history.map((row) => (
                      <tr key={row.id}>
                        <td>Y{row.year} Q{row.quarter}</td>
                        <td>{money(row.revenue)}</td>
                        <td className={row.net_income < 0 ? "val-negative" : "val-positive"}>
                          {money(row.net_income)}
                        </td>
                        <td>{money(row.cash)}</td>
                        <td>{row.engineers}</td>
                        <td>{row.sales_staff}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
