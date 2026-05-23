// Compact BM | EN language switcher.
import { useLanguage } from "../../context/LanguageContext";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-switcher" aria-label={language === "bm" ? "Penukar bahasa" : "Language switcher"}>
      <button type="button" className={language === "bm" ? "active" : ""} onClick={() => setLanguage("bm")}>
        BM
      </button>
      <span>|</span>
      <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>
        EN
      </button>
    </div>
  );
}
