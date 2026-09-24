type ProgressProps = { value: number; label?: string; className?: string };

export function Progress({ value, label, className = "" }: ProgressProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));
  return (
    <div className={className}>
      <div className="ui-progress" role="progressbar" aria-label={label || "Progress"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={normalizedValue}>
        <span style={{ width: `${normalizedValue}%` }} />
      </div>
      {label && <span className="sr-only">{label}: {normalizedValue}%</span>}
    </div>
  );
}