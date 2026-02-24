type Props = {
  engineers: number;
  sales: number;
};

type DeskKind = "engineer" | "sales" | "empty";

function PersonIcon({ kind }: { kind: DeskKind }) {
  if (kind === "empty") {
    return (
      <svg viewBox="0 0 32 40" fill="none" className="person-svg empty-person">
        <circle cx="16" cy="10" r="7" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" />
        <path
          d="M4 38c0-6.627 5.373-12 12-12s12 5.373 12 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="3 2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const fill = kind === "engineer" ? "var(--engineer)" : "var(--sales)";

  return (
    <svg viewBox="0 0 32 40" fill="none" className="person-svg">
      <circle cx="16" cy="10" r="7" fill={fill} />
      <path
        d="M4 38c0-6.627 5.373-12 12-12s12 5.373 12 12"
        fill={fill}
      />
    </svg>
  );
}

export default function OfficeVisualization({ engineers, sales }: Props) {
  const zoneSize = 10;
  const totalDesks = zoneSize * 2;
  const headcount = engineers + sales;
  const occupiedDesks = Math.min(headcount, totalDesks);
  const emptyDesks = Math.max(totalDesks - headcount, 0);

  const rawEngineerShare =
    headcount === 0 ? 0 : (engineers / headcount) * occupiedDesks;
  const engineerDesks = Math.min(Math.round(rawEngineerShare), occupiedDesks);
  const salesDesks = Math.max(occupiedDesks - engineerDesks, 0);

  const engZone: DeskKind[] = [
    ...Array<DeskKind>(Math.min(engineerDesks, zoneSize)).fill("engineer"),
    ...Array<DeskKind>(Math.max(zoneSize - engineerDesks, 0)).fill("empty")
  ];

  const salesZone: DeskKind[] = [
    ...Array<DeskKind>(Math.min(salesDesks, zoneSize)).fill("sales"),
    ...Array<DeskKind>(Math.max(zoneSize - salesDesks, 0)).fill("empty")
  ];

  return (
    <div className="db-card office-card">
      <div className="db-card-head">
        <h2>Office floor</h2>
        <span className="db-card-sub">
          {headcount > totalDesks
            ? `${headcount} total · ${totalDesks} desks shown`
            : `${Math.min(headcount, totalDesks)}/${totalDesks} desks occupied`}
        </span>
      </div>

      <div className="office-summary">
        <div className="summary-chip">
          <span className="chip-dot" style={{ background: "var(--engineer)" }} />
          {engineers} eng
        </div>
        <div className="summary-chip">
          <span className="chip-dot" style={{ background: "var(--sales)" }} />
          {sales} sales
        </div>
        {emptyDesks > 0 && (
          <div className="summary-chip">
            <span className="chip-dot" style={{ background: "var(--empty-dot)" }} />
            {emptyDesks} open
          </div>
        )}
      </div>

      <div className="office-floor">
        <div className="office-wing">
          <p className="wing-label">Engineering</p>
          <div className="wing-grid">
            {engZone.map((kind, i) => (
              <div key={i} className={`office-seat-wrap ${kind}`}>
                <PersonIcon kind={kind} />
              </div>
            ))}
          </div>
        </div>

        <div className="office-divider" />

        <div className="office-wing">
          <p className="wing-label">Sales</p>
          <div className="wing-grid">
            {salesZone.map((kind, i) => (
              <div key={i} className={`office-seat-wrap ${kind}`}>
                <PersonIcon kind={kind} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {headcount > totalDesks && (
        <p className="office-overflow">
          {headcount - totalDesks} team members work remotely (beyond office capacity)
        </p>
      )}
    </div>
  );
}
