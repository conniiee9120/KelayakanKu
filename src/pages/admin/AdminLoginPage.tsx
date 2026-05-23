import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { AdminApiError, loginAdmin } from "../../services/adminApi";
import { navigate } from "../../utils/navigation";
import { useLanguage } from "../../context/LanguageContext";

export function AdminLoginPage() {
  const { text } = useLanguage();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginAdmin(password);
      navigate("/admin/dashboard");
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 401) {
        setError(text.admin.invalidPassword);
      } else if (err instanceof AdminApiError && err.status === 503) {
        setError(text.admin.loginNotConfigured);
      } else {
        setError(err instanceof Error ? err.message : text.admin.loginFailed);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="section-shell page-section centered-page">
      <Card>
        <span className="badge badge-info">{text.admin.hidden}</span>
        <h1>{text.admin.loginTitle}</h1>
        <p>{text.admin.loginDesc}</p>
        <form className="stack" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>{text.admin.password}</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <strong className="admin-error">{error}</strong>}
          <Button type="submit" disabled={loading}>{loading ? text.admin.signingIn : text.admin.login}</Button>
        </form>
      </Card>
    </main>
  );
}
