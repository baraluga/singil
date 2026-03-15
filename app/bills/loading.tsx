export default function BillsLoading() {
  return (
    <main className="page">
      <div className="page-inner">
        <div className="dash-header">
          <div>
            <div className="skeleton skeleton-title" style={{ width: 80 }} />
            <div className="skeleton skeleton-text" style={{ width: 140 }} />
          </div>
        </div>
        <div className="bills-grid">
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </div>
      </div>
    </main>
  );
}
