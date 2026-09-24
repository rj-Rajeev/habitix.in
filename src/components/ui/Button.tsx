import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`ui-button ${className}`}
      data-variant={variant}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? "Working..." : children}
    </button>
  );
}