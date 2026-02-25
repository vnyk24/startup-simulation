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

  const engShown = Math.min(engineers, zoneSize);
  const salesShown = Math.min(sales, zoneSize);
  const remoteCount = (engineers - engShown) + (sales - salesShown);

  const engZone: DeskKind[] = [
    ...Array<DeskKind>(engShown).fill("engineer"),
    ...Array<DeskKind>(zoneSize - engShown).fill("empty")
  ];

  const salesZone: DeskKind[] = [
    ...Array<DeskKind>(salesShown).fill("sales"),
    ...Array<DeskKind>(zoneSize - salesShown).fill("empty")
  ];

  return (
    <div className="db-card office-card">
      <div className="db-card-head">
        <h2>Office floor</h2>
        <span className="db-card-sub">
          {remoteCount > 0
            ? `${headcount} total · ${totalDesks} desks shown`
            : `${engShown + salesShown}/${totalDesks} desks occupied`}
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
        {(zoneSize - engShown) + (zoneSize - salesShown) > 0 && (
          <div className="summary-chip">
            <span className="chip-dot" style={{ background: "var(--empty-dot)" }} />
            {(zoneSize - engShown) + (zoneSize - salesShown)} open
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

      {remoteCount > 0 && (
        <p className="office-overflow">
          {remoteCount} team members work remotely (beyond office capacity)
        </p>
      )}
    </div>
  );
}
