import { SharedSidebar } from "@/components/admin/shared-sidebar";

export default function UsersLoading() {
  return (
    <div className="admin-shell">
      <SharedSidebar open={false} close={() => undefined} />
      <main className="admin-main">
        <header className="admin-topbar" />
        <div className="dashboard-content users-content" aria-label="Loading users">
          <div className="page-heading">
            <div className="heading-skeleton skeleton" />
          </div>
          <section className="panel users-panel users-loading-panel">
            <div className="users-table-state"><span className="loading-ring"/><strong>Loading users...</strong><p>Connecting to Clerk...</p></div>
          </section>
        </div>
      </main>
    </div>
  );
}
