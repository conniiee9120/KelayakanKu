import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { loginAdmin } from "../../services/adminApi";
import { navigate } from "../../utils/navigation";

export function AdminLoginPage() {
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
      setError(err instanceof Error ? err.message : "Admin login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="section-shell page-section centered-page">
      <Card>
        <span className="badge badge-info">Hidden admin</span>
        <h1>KelayakanKu Admin Login</h1>
        <p>Enter the admin password to manage policy records used by the rule engine.</p>
        <form className="stack" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Admin password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <strong className="admin-error">{error}</strong>}
          <Button type="submit" disabled={loading}>{loading ? "Signing in..." : "Login"}</Button>
        </form>
      </Card>
    </main>
  );
}
