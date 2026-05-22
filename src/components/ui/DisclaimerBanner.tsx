// Reusable disclaimer block for guidance-only messaging.
import { useLanguage } from "../../context/LanguageContext";

export function DisclaimerBanner({ children }: { children: string }) {
  const { text } = useLanguage();

  return (
    <section className="disclaimer-banner" aria-label="Important disclaimer">
      <strong>{text.common.important}:</strong> {children}
    </section>
  );
}
