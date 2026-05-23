// App-wide BM/EN language state.
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { translations, type Language } from "../data/translations";
import { getLanguage, saveLanguage } from "../utils/storage";

interface LanguageContextValue {
  language: Language;
  text: typeof translations.en;
  t: (key: string) => string;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => getLanguage());

  const value = useMemo<LanguageContextValue>(() => {
    const currentText = {
      ...translations[language],
      admin: translations.en.admin
    };

    return {
      language,
      text: currentText,
      t(key) {
      const value = key.split(".").reduce<unknown>((current, part) => (
        current && typeof current === "object" ? (current as Record<string, unknown>)[part] : undefined
      ), currentText);
      const fallback = key.split(".").reduce<unknown>((current, part) => (
        current && typeof current === "object" ? (current as Record<string, unknown>)[part] : undefined
      ), translations.en);
      return typeof value === "string" ? value : typeof fallback === "string" ? fallback : key;
      },
      setLanguage(nextLanguage) {
        setLanguageState(nextLanguage);
        saveLanguage(nextLanguage);
      }
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
