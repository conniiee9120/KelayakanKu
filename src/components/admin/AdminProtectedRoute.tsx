import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getAdminMe, getAdminToken } from "../../services/adminApi";
import { navigate } from "../../utils/navigation";

export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"checking" | "allowed">("checking");

  useEffect(() => {
    if (!getAdminToken()) {
      navigate("/admin/login");
      return;
    }

    getAdminMe()
      .then(() => setState("allowed"))
      .catch(() => navigate("/admin/login"));
  }, []);

  if (state === "checking") {
    return (
      <main className="section-shell page-section">
        <p>Checking admin access...</p>
      </main>
    );
  }

  return <>{children}</>;
}
