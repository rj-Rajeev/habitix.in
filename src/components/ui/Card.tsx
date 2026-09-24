import type { HTMLAttributes, ReactNode } from "react";

export function Card({ variant = "default", className = "", children, ...props }: HTMLAttributes<HTMLDivElement> & { variant?: "default" | "subtle" | "outlined"; children: ReactNode }) {
  return <div {...props} className={`ui-card ${className}`} data-variant={variant}>{children}</div>;
}