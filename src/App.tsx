// Root app shell with lightweight path-based routing.
import { useEffect, useState } from "react";
import { Footer } from "./components/layout/Footer";
import { Navbar } from "./components/layout/Navbar";
import { LanguageProvider } from "./context/LanguageContext";
import { AdminProtectedRoute } from "./components/admin/AdminProtectedRoute";
import { ChecklistDetail } from "./pages/ChecklistDetail";
import { EligibilityForm } from "./pages/EligibilityForm";
import { FAQ } from "./pages/FAQ";
import { Landing } from "./pages/Landing";
import { Processing } from "./pages/Processing";
import { Results } from "./pages/Results";
import { ReviewDetails } from "./pages/ReviewDetails";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminPoliciesPage } from "./pages/admin/AdminPoliciesPage";
import { AdminPolicyFormPage } from "./pages/admin/AdminPolicyFormPage";
import { AdminPolicyExtractionPage } from "./pages/admin/AdminPolicyExtractionPage";
import { AdminPolicyImportPage } from "./pages/admin/AdminPolicyImportPage";

function CurrentPage() {
  const path = window.location.pathname;

  if (path === "/eligibility" || path === "/check") return <EligibilityForm />;
  if (path === "/admin/login") return <AdminLoginPage />;
  if (path === "/admin/dashboard") return <AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute>;
  if (path === "/admin/policies" || path === "/admin/policies/") return <AdminProtectedRoute><AdminPoliciesPage /></AdminProtectedRoute>;
  if (path === "/admin/drafts") return <AdminProtectedRoute><AdminPoliciesPage /></AdminProtectedRoute>;
  if (path === "/admin/policies/new" || /^\/admin\/policies\/[^/]+\/edit$/.test(path)) return <AdminProtectedRoute><AdminPolicyFormPage /></AdminProtectedRoute>;
  if (path === "/admin/policy-import/extract") return <AdminPolicyExtractionPage />;
  if (path === "/admin/policy-import") return <AdminProtectedRoute><AdminPolicyImportPage /></AdminProtectedRoute>;
  if (path === "/admin") return <AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute>;
  if (path === "/review") return <ReviewDetails />;
  if (path === "/processing") return <Processing />;
  if (path === "/results") return <Results />;
  if (path.startsWith("/checklist")) return <ChecklistDetail />;
  if (path === "/faq") return <FAQ />;
  return <Landing />;
}

export function App() {
  const [, setPath] = useState(window.location.pathname);
  const isAdminPath = window.location.pathname.startsWith("/admin");

  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  return (
    <LanguageProvider>
      <div className="app-shell">
        {!isAdminPath && <Navbar />}
        <CurrentPage />
        {!isAdminPath && <Footer />}
      </div>
    </LanguageProvider>
  );
}
