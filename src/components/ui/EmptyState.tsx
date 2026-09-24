import type { ReactNode } from "react";

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <section className="rounded-container border border-dashed border-border-strong bg-surface px-6 py-10 text-center">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </section>
  );
}