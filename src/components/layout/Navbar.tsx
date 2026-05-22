// Global navigation with section links, primary CTA, and rightmost language switcher.
import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { navigate } from "../../utils/navigation";
import { Button } from "../ui/Button";
import kelayakankuLogo from "../pictures/kelayakanku.png";
import { LanguageSwitcher } from "./LanguageSwitcher";

function goToLandingSection(sectionId: string) {
  if (window.location.pathname !== "/") {
    navigate("/");
    window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" }), 50);
    return;
  }

  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { text } = useLanguage();

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main navigation">
        <button type="button" className="brand-link" onClick={() => navigate("/")}>
          <img className="brand-logo" src={kelayakankuLogo} alt="" aria-hidden="true" />
          <span>
            <strong>{text.nav.brand}</strong>
            <small>{text.nav.subtitle}</small>
          </span>
        </button>

        <button className="menu-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          Menu
        </button>

        <div className={`nav-links ${open ? "open" : ""}`}>
          <button type="button" onClick={() => goToLandingSection("how-it-works")}>{text.nav.howItWorks}</button>
          <button type="button" onClick={() => goToLandingSection("who-it-helps")}>{text.nav.whoItHelps}</button>
          <button type="button" onClick={() => navigate("/faq")}>{text.nav.faq}</button>
        </div>

        <div className="nav-actions">
          <Button onClick={() => navigate("/eligibility")}>{text.nav.check}</Button>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}
