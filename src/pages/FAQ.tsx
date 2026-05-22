// Full FAQ page with static MVP guidance.
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useLanguage } from "../context/LanguageContext";
import { navigate } from "../utils/navigation";

const faq = {
  en: [
    ["What is KelayakanKu?", "KelayakanKu is an eligibility navigator that helps users understand possible financial aid, subsidies, and support programs."],
    ["Does KelayakanKu submit applications?", "No. KelayakanKu does not submit applications. It only provides guidance."],
    ["Does KelayakanKu guarantee approval?", "No. Final eligibility and approval depend on the official agency."],
    ["What information do users need to provide?", "Users provide basic profile, work situation, income range, contribution status, and support needs."],
    ["Why does KelayakanKu only show recommended and need-more-info programs?", "To reduce confusion. The MVP focuses on programs that are most relevant or require official verification."],
    ["How are results generated?", "In the full version, results will be based on curated aid rules, trusted official sources, and AI explanations. In this UI prototype, results are mock data."],
    ["What are trusted official sources?", "Trusted official sources are government or official agency websites that provide program criteria and application guidance."]
  ],
  bm: [
    ["Apakah KelayakanKu?", "KelayakanKu ialah panduan kelayakan yang membantu pengguna memahami bantuan kewangan, subsidi, dan program sokongan yang mungkin berkaitan."],
    ["Adakah KelayakanKu menghantar permohonan?", "Tidak. KelayakanKu tidak menghantar permohonan. Ia hanya memberi panduan."],
    ["Adakah KelayakanKu menjamin kelulusan?", "Tidak. Kelayakan dan kelulusan akhir bergantung kepada agensi rasmi."],
    ["Maklumat apa yang perlu diberikan?", "Pengguna memberi profil asas, situasi kerja, julat pendapatan, status caruman, dan keperluan sokongan."],
    ["Mengapa hanya program disyorkan dan perlu maklumat lanjut dipaparkan?", "Untuk mengurangkan kekeliruan. MVP ini fokus pada program yang paling relevan atau memerlukan pengesahan rasmi."],
    ["Bagaimana keputusan dijana?", "Dalam versi penuh, keputusan akan berdasarkan peraturan bantuan terpilih, sumber rasmi dipercayai, dan penjelasan AI. Dalam prototaip UI ini, keputusan ialah data contoh."],
    ["Apakah sumber rasmi dipercayai?", "Sumber rasmi dipercayai ialah laman kerajaan atau agensi rasmi yang menyediakan kriteria program dan panduan permohonan."]
  ]
};

export function FAQ() {
  const { language, text } = useLanguage();

  return (
    <main className="section-shell page-section">
      <div className="page-title">
        <span>{text.faq.eyebrow}</span>
        <h1>{text.faq.title}</h1>
      </div>
      <div className="card-grid two">
        {faq[language].map(([question, answer]) => (
          <Card key={question}>
            <h2>{question}</h2>
            <p>{answer}</p>
          </Card>
        ))}
      </div>
      <Card className="cta-card">
        <h2>{text.faq.cta}</h2>
        <Button onClick={() => navigate("/eligibility")}>{text.nav.check}</Button>
      </Card>
    </main>
  );
}
