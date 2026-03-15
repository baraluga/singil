export default function BillDetailLoading() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 40 }}>
      <div className="page-inner" style={{ padding: "0 20px" }}>
        <div className="skeleton skeleton-text" style={{ width: 60, marginTop: 20, marginBottom: 16 }} />
      </div>
      <div className="skeleton skeleton-hero" style={{ borderRadius: 0 }} />
      <div className="page-inner" style={{ padding: "0 20px" }}>
        <div className="skeleton skeleton-row" style={{ marginBottom: 20 }} />
        <div className="skeleton skeleton-text" style={{ width: 80, marginBottom: 10 }} />
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" />
      </div>
    </main>
  );
}
