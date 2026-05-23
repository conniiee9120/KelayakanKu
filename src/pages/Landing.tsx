// Landing page with hero, flow explanation, audiences, FAQ preview, and disclaimer.
import { useLanguage } from "../context/LanguageContext";
import { navigate } from "../utils/navigation";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { DisclaimerBanner } from "../components/ui/DisclaimerBanner";
import { MetricCard } from "../components/results/MetricCard";

const landingCopy = {
  en: {
    howItWorks: ["Answer simple questions", "KelayakanKu checks curated eligibility rules", "Trusted official sources are retrieved", "Get your eligibility snapshot and checklist"],
    audiences: [
      ["B40 households", "Helps low-income households identify relevant support programmes and prepare the right documents before checking official channels."],
      ["Single-parent households", "Highlights support that may be relevant for parents managing household expenses and dependents on one income."],
      ["Families with dependents", "Guides families with children or dependents toward programmes that may match their household situation."],
      ["Gig or informal-worker households", "Supports users with irregular income by showing programmes that may not require formal payslips."],
      ["Households with unstable income", "Helps households with changing monthly income understand which support options may need further verification."],
      ["Senior or student-led households", "Shows support that may be relevant for older adults, students, or households led by non-traditional earners."]
    ],
    faqPreview: [
      ["Does KelayakanKu submit applications?", "No. KelayakanKu only provides guidance."],
      ["Does KelayakanKu guarantee approval?", "No. Final eligibility depends on the official agency."],
      ["What information do I need?", "Basic profile, work situation, income range, contribution status, and support needs."],
      ["Where do the sources come from?", "KelayakanKu uses curated program data and trusted official source links."]
    ],
    journeySteps: [
      ["1", "Enter the system", "User opens KelayakanKu and starts a guided B40 household check."],
      ["2", "Fill in the form", "Simple household questions: state, dependents, income range, work, and support needs."],
      ["3", "System processes", "KelayakanKu compares answers with curated rules and trusted official sources."],
      ["4", "Snapshot is ready", "Recommended programs, need-more-info items, documents, and next steps are shown."]
    ],
    supportProfile: "Support profile",
    recommended: "Recommended",
    needInfo: "Need Info",
    match: "Match based on income and household.",
    depends: "Depends on household records.",
    scrollHint: "Scroll to preview the steps",
    journeyAria: "Eligibility journey preview",
    howEyebrow: "How it works",
    whoEyebrow: "Who it helps",
    faqEyebrow: "FAQ preview"
  },
  bm: {
    howItWorks: ["Jawab soalan mudah", "KelayakanKu menyemak peraturan kelayakan terpilih", "Sumber rasmi dipercayai disediakan", "Dapatkan ringkasan kelayakan dan senarai semak"],
    audiences: [
      ["Isi rumah B40", "Membantu isi rumah berpendapatan rendah mengenal pasti program sokongan yang berkaitan dan menyediakan dokumen yang sesuai sebelum menyemak saluran rasmi."],
      ["Isi rumah ibu atau bapa tunggal", "Menonjolkan sokongan yang mungkin berkaitan untuk ibu atau bapa yang mengurus perbelanjaan rumah dan tanggungan dengan satu sumber pendapatan."],
      ["Keluarga dengan tanggungan", "Membantu keluarga yang mempunyai anak atau tanggungan melihat program yang mungkin sepadan dengan keadaan isi rumah mereka."],
      ["Isi rumah pekerja gig atau tidak formal", "Menyokong pengguna dengan pendapatan tidak tetap dengan memaparkan program yang mungkin tidak memerlukan slip gaji formal."],
      ["Isi rumah dengan pendapatan tidak tetap", "Membantu isi rumah yang pendapatan bulanannya berubah-ubah memahami pilihan sokongan yang mungkin memerlukan semakan lanjut."],
      ["Isi rumah warga emas atau pelajar", "Memaparkan sokongan yang mungkin berkaitan untuk warga emas, pelajar, atau isi rumah yang diketuai oleh pencari nafkah bukan tradisional."]
    ],
    faqPreview: [
      ["Adakah KelayakanKu menghantar permohonan?", "Tidak. KelayakanKu hanya memberi panduan."],
      ["Adakah KelayakanKu menjamin kelulusan?", "Tidak. Kelayakan akhir bergantung kepada agensi rasmi."],
      ["Maklumat apa yang diperlukan?", "Profil asas, situasi kerja, julat pendapatan, status caruman, dan keperluan sokongan."],
      ["Dari mana sumber diperoleh?", "KelayakanKu menggunakan data program terpilih dan pautan sumber rasmi dipercayai."]
    ],
    journeySteps: [
      ["1", "Masuk ke sistem", "Pengguna membuka KelayakanKu dan memulakan semakan isi rumah B40 berpandu."],
      ["2", "Isi borang", "Soalan mudah tentang negeri, tanggungan, julat pendapatan, kerja, dan keperluan sokongan."],
      ["3", "Sistem memproses", "KelayakanKu membandingkan jawapan dengan peraturan terpilih dan sumber rasmi dipercayai."],
      ["4", "Ringkasan sedia", "Program disyorkan, item perlu maklumat lanjut, dokumen, dan langkah seterusnya dipaparkan."]
    ],
    supportProfile: "Profil sokongan",
    recommended: "Disyorkan",
    needInfo: "Perlu Info",
    match: "Padanan berdasarkan pendapatan dan isi rumah.",
    depends: "Bergantung pada rekod isi rumah.",
    scrollHint: "Tatal untuk melihat langkah-langkah",
    journeyAria: "Pratonton perjalanan kelayakan",
    howEyebrow: "Cara ia berfungsi",
    whoEyebrow: "Untuk siapa",
    faqEyebrow: "Soalan lazim"
  }
};

export function Landing() {
  const { language, text } = useLanguage();
  const copy = landingCopy[language];

  return (
    <main>
      <section className="hero section-shell">
        <div className="hero-copy">
          <Badge tone="info">{text.landing.trust}</Badge>
          <h1>{text.landing.title}</h1>
          <p className="tagline">{text.landing.tagline}</p>
          <p className="subtitle">{text.landing.subtitle}</p>
          <div className="button-row">
            <Button onClick={() => navigate("/eligibility")}>{text.nav.check}</Button>
            <Button variant="outline" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
              {text.buttons.learnHow}
            </Button>
          </div>
        </div>

        <div className="hero-visual-wrap">
          <Card className="snapshot-card">
            <div className="snapshot-heading">
              <span className="snapshot-icon" aria-hidden="true">✓</span>
              <div>
                <h2>{text.landing.journeyTitle}</h2>
              </div>
            </div>
            <p className="journey-scroll-hint">{copy.scrollHint}</p>
            <div className="auto-flow-window" aria-label={copy.journeyAria} tabIndex={0}>
              <div className="auto-flow-track">
                {copy.journeySteps.map(([number, title, description]) => (
                  <div className="flow-card" key={title}>
                    <span>{number}</span>
                    <div>
                      <strong>{title}</strong>
                      <p>{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="metrics-grid">
              <MetricCard label={copy.recommended} value={2} />
              <MetricCard label={copy.needInfo} value={1} />
              <MetricCard label={text.results.checklistReady} value={2} />
            </div>
            <div className="snapshot-list">
              <p><strong>{language === "bm" ? "Sokongan Bantuan Tunai (STR)" : "Cash Aid Support (STR)"}</strong><small>{copy.match}</small><span>{copy.recommended}</span></p>
              <p><strong>{language === "bm" ? "Sokongan Isi Rumah Tambahan" : "Additional Household Support"}</strong><small>{copy.depends}</small><span>{copy.needInfo}</span></p>
            </div>
          </Card>
        </div>
      </section>

      <section id="how-it-works" className="section-shell page-section landing-band how-band">
        <div className="section-header">
          <span>{copy.howEyebrow}</span>
          <h2>{text.landing.howTitle}</h2>
          <p>{text.landing.howDesc}</p>
        </div>
        <div className="card-grid four">
          {copy.howItWorks.map((item, index) => (
            <Card key={item}>
              <div className="step-number">{index + 1}</div>
              <h3>{item}</h3>
            </Card>
          ))}
        </div>
      </section>

      <section id="who-it-helps" className="section-shell page-section landing-band who-band">
        <div className="section-header">
          <span>{copy.whoEyebrow}</span>
          <h2>{text.landing.whoTitle}</h2>
          <p>{text.landing.whoDesc}</p>
        </div>
        <div className="card-grid three">
          {copy.audiences.map(([audience, description]) => (
            <Card key={audience}>
              <Badge tone="neutral">{copy.supportProfile}</Badge>
              <h3>{audience}</h3>
              <p>{description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="faq-preview" className="section-shell page-section landing-band faq-band">
        <div className="section-header">
          <span>{copy.faqEyebrow}</span>
          <h2>{text.landing.faqTitle}</h2>
        </div>
        <div className="card-grid two">
          {copy.faqPreview.map(([question, answer]) => (
            <Card key={question}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </Card>
          ))}
        </div>
        <Button variant="outline" onClick={() => navigate("/faq")}>{text.buttons.readFaq}</Button>
      </section>

      <div className="section-shell">
        <DisclaimerBanner>{text.common.disclaimer}</DisclaimerBanner>
      </div>
    </main>
  );
}
