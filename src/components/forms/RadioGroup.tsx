// Reusable radio option group with visible label and error text.
import type { FormOption } from "../../data/formOptions";

interface RadioGroupProps {
  label: string;
  name: string;
  options: FormOption[];
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function RadioGroup({ label, name, options, value, error, onChange }: RadioGroupProps) {
  return (
    <fieldset className="radio-group">
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <label key={option.value}>
            <input type="radio" name={name} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error ? <strong>{error}</strong> : null}
    </fieldset>
  );
}
