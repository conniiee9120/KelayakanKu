// App-wide BM/EN language state.
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { translations, type Language } from "../data/translations";
import { getLanguage, saveLanguage } from "../utils/storage";

interface LanguageContextValue {
  language: Language;
  text: typeof translations.en;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => getLanguage());

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    text: translations[language],
    setLanguage(nextLanguage) {
      setLanguageState(nextLanguage);
      saveLanguage(nextLanguage);
    }
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
