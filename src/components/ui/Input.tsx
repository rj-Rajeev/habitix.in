import { forwardRef, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = "", ...props },
  ref,
) {
  const inputId = id || props.name;
  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
      <input {...props} ref={ref} id={inputId} className={`ui-input ${className}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} />
      {error && <span id={`${inputId}-error`} className="text-sm text-red-700">{error}</span>}
    </label>
  );
});