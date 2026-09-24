import { forwardRef, type TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, id, className = "", ...props },
  ref,
) {
  const textareaId = id || props.name;
  return (
    <label className="block space-y-1.5" htmlFor={textareaId}>
      {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
      <textarea {...props} ref={ref} id={textareaId} className={`ui-textarea ${className}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${textareaId}-error` : undefined} />
      {error && <span id={`${textareaId}-error`} className="text-sm text-red-700">{error}</span>}
    </label>
  );
});