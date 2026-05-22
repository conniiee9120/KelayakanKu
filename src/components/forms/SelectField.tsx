// Reusable select field for long option lists.
import type { FormOption } from "../../data/formOptions";

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  options: FormOption[];
  placeholder: string;
  error?: string;
  onChange: (value: string) => void;
}

export function SelectField({ id, label, value, options, placeholder, error, onChange }: SelectFieldProps) {
  const errorId = `${id}-error`;

  return (
    <label className="form-field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <strong id={errorId}>{error}</strong> : null}
    </label>
  );
}
