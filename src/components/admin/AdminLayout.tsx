import type { ReactNode } from "react";
import { Button } from "../ui/Button";
import { clearAdminToken } from "../../services/adminApi";
import { navigate } from "../../utils/navigation";

export function AdminLayout({ children }: { children: ReactNode }) {
  function logout() {
    clearAdminToken();
    navigate("/admin/login");
  }

  return (
    <main className="section-shell page-section admin-shell">
      <div className="admin-topbar">
        <div>
          <span className="badge badge-info">Admin</span>
          <h1>KelayakanKu Policy Admin</h1>
        </div>
        <div className="admin-nav">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>Dashboard</Button>
          <Button variant="ghost" onClick={() => navigate("/admin/policies")}>Policies</Button>
          <Button variant="ghost" onClick={() => navigate("/admin/policy-import")}>Import</Button>
          <Button variant="outline" onClick={logout}>Log out</Button>
        </div>
      </div>
      {children}
    </main>
  );
}
