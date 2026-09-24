import type { HTMLAttributes, ReactNode } from "react";

export function Alert({ tone = "info", className = "", children, ...props }: HTMLAttributes<HTMLDivElement> & { tone?: "success" | "warning" | "error" | "info"; children: ReactNode }) {
  return <div {...props} className={`ui-alert ${className}`} data-tone={tone} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}