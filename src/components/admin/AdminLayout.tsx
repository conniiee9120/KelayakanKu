import type { ReactNode } from "react";
import { Button } from "../ui/Button";
import { clearAdminToken } from "../../services/adminApi";
import { navigate } from "../../utils/navigation";
import { useLanguage } from "../../context/LanguageContext";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { text } = useLanguage();
  const path = window.location.pathname;

  function logout() {
    clearAdminToken();
    navigate("/admin/login");
  }

  function navClass(target: string) {
    if (target === "/admin/policy-import") {
      return path.startsWith("/admin/policy-import") ? "active" : "";
    }
    return path === target || path.startsWith(`${target}/`) ? "active" : "";
  }

  return (
    <main className="section-shell page-section admin-shell">
      <div className="admin-topbar">
        <div>
          <span className="badge badge-info">{text.admin.badge}</span>
          <h1>{text.admin.title}</h1>
        </div>
        <div className="admin-nav">
          <Button variant="ghost" className={navClass("/admin/dashboard")} onClick={() => navigate("/admin/dashboard")}>{text.admin.dashboard}</Button>
          <Button variant="ghost" className={navClass("/admin/policies")} onClick={() => navigate("/admin/policies")}>{text.admin.policies}</Button>
          <Button variant="ghost" className={navClass("/admin/drafts")} onClick={() => navigate("/admin/drafts")}>{text.admin.drafts}</Button>
          <Button variant="ghost" className={navClass("/admin/policy-import")} onClick={() => navigate("/admin/policy-import")}>{text.admin.import}</Button>
          <Button variant="outline" onClick={logout}>{text.admin.logout}</Button>
        </div>
      </div>
      {children}
    </main>
  );
}
