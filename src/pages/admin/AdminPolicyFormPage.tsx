import { useEffect, useState } from "react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { PolicyForm, createBlankPolicy } from "../../components/admin/PolicyForm";
import { Button } from "../../components/ui/Button";
import { createAdminPolicy, deleteAdminPolicy, getAdminPolicies, updateAdminPolicy, type AdminPolicy } from "../../services/adminApi";
import { navigate } from "../../utils/navigation";
import { useLanguage } from "../../context/LanguageContext";

function getEditId() {
  const match = window.location.pathname.match(/^\/admin\/policies\/([^/]+)\/edit$/);
  return match?.[1];
}

export function AdminPolicyFormPage() {
  const { text } = useLanguage();
  const editId = getEditId();
  const [policy, setPolicy] = useState<AdminPolicy | null>(editId ? null : createBlankPolicy());
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!editId) return;
    getAdminPolicies()
      .then((policies) => {
        const found = policies.find((item) => item.id === editId);
        if (found) setPolicy(found);
        else setMessage(text.admin.policyNotFound);
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : text.admin.loadPolicyError));
  }, [editId]);

  async function handleSubmit(nextPolicy: AdminPolicy) {
    const saved = editId ? await updateAdminPolicy(editId, nextPolicy) : await createAdminPolicy(nextPolicy);
    navigate(`/admin/policies/${saved.id}/edit`);
  }

  async function handleDelete() {
    if (!editId || !window.confirm(text.admin.deleteConfirm)) return;
    await deleteAdminPolicy(editId);
    navigate("/admin/policies");
  }

  return (
    <AdminLayout>
      <div className="admin-page-actions">
        <div>
          <h2>{editId ? text.admin.editPolicy : text.admin.newPolicy}</h2>
          <p>{text.admin.policyFormDesc}</p>
        </div>
        {editId && <Button variant="outline" onClick={handleDelete}>{text.admin.deletePolicy}</Button>}
      </div>
      {message && <div className="disclaimer-banner">{message}</div>}
      {policy ? <PolicyForm initialPolicy={policy} onSubmit={handleSubmit} submitLabel={editId ? text.admin.saveChanges : text.admin.createPolicy} /> : <p>{text.admin.loadingPolicy}</p>}
    </AdminLayout>
  );
}
