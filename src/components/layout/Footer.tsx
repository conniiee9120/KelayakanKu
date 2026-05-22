// Shared footer with simple navigation and guidance-only disclaimer.
import { useLanguage } from "../../context/LanguageContext";
import { navigate } from "../../utils/navigation";

export function Footer() {
  const { text } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <button type="button" className="footer-brand" onClick={() => navigate("/")}>
          KelayakanKu
        </button>
        <p>{text.footer.desc}</p>
      </div>
      <div className="footer-column">
        <h2>{text.footer.explore}</h2>
        <nav aria-label="Footer navigation">
          <button type="button" onClick={() => navigate("/")}>{text.footer.home}</button>
          <button type="button" onClick={() => navigate("/eligibility")}>{text.footer.eligibility}</button>
          <button type="button" onClick={() => navigate("/results")}>{text.footer.snapshot}</button>
          <button type="button" onClick={() => navigate("/faq")}>{text.nav.faq}</button>
        </nav>
      </div>
      <div className="footer-column">
        <h2>{text.footer.important}</h2>
        <p>{text.common.guidance}</p>
      </div>
    </footer>
  );
}
