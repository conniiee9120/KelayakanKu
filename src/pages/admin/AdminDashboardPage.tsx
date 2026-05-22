import { useEffect, useState } from "react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { getAdminPolicies, type AdminPolicy } from "../../services/adminApi";
import { navigate } from "../../utils/navigation";

export function AdminDashboardPage() {
  const [policies, setPolicies] = useState<AdminPolicy[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminPolicies().then(setPolicies).catch((err) => setError(err instanceof Error ? err.message : "Could not load policies."));
  }, []);

  const approved = policies.filter((policy) => policy.verificationStatus === "approved").length;
  const draft = policies.filter((policy) => policy.verificationStatus === "draft").length;
  const pending = policies.filter((policy) => policy.verificationStatus === "pending_review").length;

  return (
    <AdminLayout>
      {error && <div className="disclaimer-banner">{error}</div>}
      <div className="metrics-grid">
        <Card className="metric-card"><strong>{policies.length}</strong><span>Total policies</span></Card>
        <Card className="metric-card"><strong>{approved}</strong><span>Approved</span></Card>
        <Card className="metric-card"><strong>{pending}</strong><span>Pending review</span></Card>
        <Card className="metric-card"><strong>{draft}</strong><span>Draft</span></Card>
      </div>
      <Card className="cta-card">
        <div>
          <h2>Policy database controls</h2>
          <p>Manage the JSON policy database used by the public eligibility rule engine.</p>
        </div>
        <div className="button-row">
          <Button onClick={() => navigate("/admin/policies")}>Manage Policies</Button>
          <Button variant="outline" onClick={() => navigate("/admin/policies/new")}>Add New Policy</Button>
          <Button variant="secondary" onClick={() => navigate("/admin/policy-import")}>Import Policy</Button>
        </div>
      </Card>
    </AdminLayout>
  );
}
