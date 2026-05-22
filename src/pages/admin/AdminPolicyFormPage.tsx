import { useEffect, useState } from "react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { PolicyForm, createBlankPolicy } from "../../components/admin/PolicyForm";
import { Button } from "../../components/ui/Button";
import { createAdminPolicy, deleteAdminPolicy, getAdminPolicies, updateAdminPolicy, type AdminPolicy } from "../../services/adminApi";
import { navigate } from "../../utils/navigation";

function getEditId() {
  const match = window.location.pathname.match(/^\/admin\/policies\/([^/]+)\/edit$/);
  return match?.[1];
}

export function AdminPolicyFormPage() {
  const editId = getEditId();
  const [policy, setPolicy] = useState<AdminPolicy | null>(editId ? null : createBlankPolicy());
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!editId) return;
    getAdminPolicies()
      .then((policies) => {
        const found = policies.find((item) => item.id === editId);
        if (found) setPolicy(found);
        else setMessage("Policy not found.");
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : "Could not load policy."));
  }, [editId]);

  async function handleSubmit(nextPolicy: AdminPolicy) {
    const saved = editId ? await updateAdminPolicy(editId, nextPolicy) : await createAdminPolicy(nextPolicy);
    navigate(`/admin/policies/${saved.id}/edit`);
  }

  async function handleDelete() {
    if (!editId || !window.confirm("Delete this policy?")) return;
    await deleteAdminPolicy(editId);
    navigate("/admin/policies");
  }

  return (
    <AdminLayout>
      <div className="admin-page-actions">
        <div>
          <h2>{editId ? "Edit Policy" : "New Policy"}</h2>
          <p>Keep fields clear and verify official criteria before approving.</p>
        </div>
        {editId && <Button variant="outline" onClick={handleDelete}>Delete Policy</Button>}
      </div>
      {message && <div className="disclaimer-banner">{message}</div>}
      {policy ? <PolicyForm initialPolicy={policy} onSubmit={handleSubmit} submitLabel={editId ? "Save changes" : "Create policy"} /> : <p>Loading policy...</p>}
    </AdminLayout>
  );
}
