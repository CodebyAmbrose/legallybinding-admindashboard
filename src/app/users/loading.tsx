export default function UsersLoading() {
  return (
    <main className="admin-main" aria-label="Loading users">
      <div className="dashboard-content users-content">
        <div className="page-heading"><div className="heading-skeleton skeleton" /></div>
        <section className="panel users-panel users-loading-panel">
          <div className="users-table-state"><span className="loading-ring"/><strong>Loading users...</strong><p>Connecting to Clerk...</p></div>
        </section>
      </div>
    </main>
  );
}
