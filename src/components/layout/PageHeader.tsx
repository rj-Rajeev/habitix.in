import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-text-secondary">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}