import type { HTMLAttributes } from "react";

export function Skeleton({ className = "h-4 w-full", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={`ui-skeleton ${className}`} aria-hidden="true" />;
}