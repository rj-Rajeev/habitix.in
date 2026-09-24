import type { HTMLAttributes, ReactNode } from "react";

export function Badge({ tone = "neutral", className = "", children, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "success" | "warning" | "error" | "info" | "ai"; children: ReactNode }) {
  return <span {...props} className={`ui-badge ${className}`} data-tone={tone}>{children}</span>;
}