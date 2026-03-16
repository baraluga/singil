export default function CollectionPayLoading() {
  return (
    <main className="pay-page">
      <div className="pay-header">
        <div className="skeleton skeleton-text" style={{ width: 120, opacity: 0.3, marginBottom: 8 }} />
        <div className="skeleton skeleton-title" style={{ width: 200, opacity: 0.3 }} />
      </div>
      <div className="pay-inner">
        <div className="skeleton skeleton-text" style={{ width: 80, marginBottom: 12 }} />
        <div className="name-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      </div>
    </main>
  );
}
