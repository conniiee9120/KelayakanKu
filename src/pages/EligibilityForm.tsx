// Three-step eligibility form using local React state, validation, and localStorage.
import { useEffect, useState } from "react";
import { RadioGroup } from "../components/forms/RadioGroup";
import { SelectField } from "../components/forms/SelectField";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ProgressIndicator } from "../components/ui/ProgressIndicator";
import { getFormOptions, type FormOption } from "../data/formOptions";
import type { EligibilityFormData, EligibilityFormErrors } from "../types/eligibility";
import { useLanguage } from "../context/LanguageContext";
import { navigate } from "../utils/navigation";
import { getEligibilityForm, saveEligibilityForm } from "../utils/storage";
import { validateStep } from "../utils/validation";

const blankForm: EligibilityFormData = {
  citizenship: "",
  ageGroup: "",
  state: "",
  householdSituation: "",
  dependents: "",
  workSituation: "",
  householdIncomeRange: "",
  incomeStability: "",
  contributionStatus: "",
  supportNeeds: "",
  specialSituations: "",
  extraContext: ""
};

const checkItems = {
  en: ["Your B40 household profile", "Household size and dependents", "Estimated household income", "EPF/KWSP or SOCSO/PERKESO contribution status", "Support needs and special household situations", "Required documents and next steps"],
  bm: ["Profil isi rumah B40 anda", "Saiz isi rumah dan tanggungan", "Anggaran pendapatan isi rumah", "Status caruman EPF/KWSP atau SOCSO/PERKESO", "Keperluan sokongan dan situasi khas isi rumah", "Dokumen diperlukan dan langkah seterusnya"]
};

export function EligibilityForm() {
  const { language, text } = useLanguage();
  const options = getFormOptions(language);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<EligibilityFormData>(blankForm);
  const [errors, setErrors] = useState<EligibilityFormErrors>({});

  useEffect(() => {
    const stored = getEligibilityForm();
    if (stored) setForm({ ...blankForm, ...stored });
  }, []);

  function update(field: keyof EligibilityFormData, value: string) {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    saveEligibilityForm(nextForm);
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function next() {
    const nextErrors = validateStep(step, form, language);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setStep((current) => Math.min(3, current + 1));
  }

  function review() {
    const nextErrors = validateStep(3, form, language);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      saveEligibilityForm(form);
      navigate("/review");
    }
  }

  return (
    <main className="section-shell page-section">
      <div className="page-title eligibility-title">
        <span>{text.form.eyebrow}</span>
        <h1>{text.form.title}</h1>
        <p>{text.form.desc}</p>
      </div>
      <div className="two-column eligibility-layout">
        <aside className="stack">
          <Card>
            <h2>{text.form.checksTitle}</h2>
            <ul className="plain-list">
              {checkItems[language].map((item) => <li key={item}>{item}</li>)}
            </ul>
          </Card>
          <Card className="soft-card">
            <h2>{text.form.privacyTitle}</h2>
            <p>{text.form.privacyDesc}</p>
          </Card>
        </aside>

        <Card className="form-card spacious-form-card">
          <h2>{text.form.formTitle}</h2>
          <p>{text.form.formDesc}</p>
          <ProgressIndicator step={step} />
          <form>
            {step === 1 && (
              <div className="form-grid">
                <RadioGroup label={text.form.fields.citizen} name="citizenship" options={options.citizenshipOptions} value={form.citizenship} error={errors.citizenship} onChange={(value) => update("citizenship", value)} />
                <SelectField id="ageGroup" label={text.form.fields.ageGroup} value={form.ageGroup} options={options.ageGroupOptions} placeholder={language === "bm" ? "Pilih kumpulan umur" : "Select age group"} error={errors.ageGroup} onChange={(value) => update("ageGroup", value)} />
                <SelectField id="state" label={text.form.fields.state} value={form.state} options={options.malaysianStates} placeholder={language === "bm" ? "Pilih negeri" : "Select your state"} error={errors.state} onChange={(value) => update("state", value)} />
                <SelectField id="householdSituation" label={text.form.fields.household} value={form.householdSituation} options={options.householdSituationOptions} placeholder={language === "bm" ? "Pilih situasi isi rumah" : "Select household situation"} error={errors.householdSituation} onChange={(value) => update("householdSituation", value)} />
                <SelectField id="dependents" label={text.form.fields.dependents} value={form.dependents} options={options.dependentOptions} placeholder={language === "bm" ? "Pilih tanggungan" : "Select dependents"} error={errors.dependents} onChange={(value) => update("dependents", value)} />
              </div>
            )}

            {step === 2 && (
              <div className="form-grid">
                <SelectField id="workSituation" label={text.form.fields.work} value={form.workSituation} options={options.workSituations} placeholder={language === "bm" ? "Pilih situasi kerja" : "Select work situation"} error={errors.workSituation} onChange={(value) => update("workSituation", value)} />
                <SelectField id="householdIncomeRange" label={text.form.fields.income} value={form.householdIncomeRange} options={options.householdIncomeRanges} placeholder={language === "bm" ? "Pilih julat pendapatan isi rumah" : "Select household income range"} error={errors.householdIncomeRange} onChange={(value) => update("householdIncomeRange", value)} />
                <RadioGroup label={text.form.fields.stability} name="incomeStability" options={options.incomeStabilityOptions} value={form.incomeStability} error={errors.incomeStability} onChange={(value) => update("incomeStability", value)} />
                <RadioGroup label={text.form.fields.contribution} name="contributionStatus" options={options.contributionStatusOptions} value={form.contributionStatus} error={errors.contributionStatus} onChange={(value) => update("contributionStatus", value)} />
              </div>
            )}

            {step === 3 && (
              <div className="form-grid">
                <MultiSelectGroup label={text.form.fields.support} name="supportNeeds" options={options.supportNeedsOptions} value={form.supportNeeds} error={errors.supportNeeds} onChange={(value) => update("supportNeeds", value)} />
                <MultiSelectGroup label={text.form.fields.situations} name="specialSituations" options={options.specialSituationOptions} value={form.specialSituations} error={errors.specialSituations} helper={text.form.fields.situationsHelp} onChange={(value) => update("specialSituations", value)} />
                <label className="form-field wide" htmlFor="extraContext">
                  <span>{text.form.fields.extra}</span>
                  <textarea id="extraContext" value={form.extraContext} placeholder={language === "bm" ? "Contoh: Saya bekerja sebagai rider penghantaran. Pendapatan saya berubah setiap bulan dan saya tiada slip gaji." : "Example: I work as a delivery rider. My income changes every month and I do not have a payslip."} onChange={(event) => update("extraContext", event.target.value)} />
                </label>
              </div>
            )}

            <div className="form-actions">
              <Button type="button" variant="outline" onClick={() => step === 1 ? navigate("/") : setStep((current) => Math.max(1, current - 1))}>{text.buttons.back}</Button>
              {step < 3 ? <Button type="button" onClick={next}>{text.buttons.next}</Button> : <Button type="button" onClick={review}>{text.buttons.review}</Button>}
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}

function MultiSelectGroup({ label, name, options, value, error, helper, onChange }: {
  label: string;
  name: keyof EligibilityFormData;
  options: FormOption[];
  value: string;
  error?: string;
  helper?: string;
  onChange: (value: string) => void;
}) {
  const selected = value ? value.split("|").filter(Boolean) : [];

  function toggle(option: FormOption) {
    const nextSelected = selected.includes(option.value)
      ? selected.filter((item) => item !== option.value)
      : [...selected, option.value];
    onChange(nextSelected.join("|"));
  }

  return (
    <fieldset className="radio-group">
      <legend>{label}</legend>
      {helper ? <p className="field-helper">{helper}</p> : null}
      <div className="checkbox-grid">
        {options.map((option) => (
          <label key={option.value}>
            <input type="checkbox" name={name} checked={selected.includes(option.value)} onChange={() => toggle(option)} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error ? <strong>{error}</strong> : null}
    </fieldset>
  );
}
