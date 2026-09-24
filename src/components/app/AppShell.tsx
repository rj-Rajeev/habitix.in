"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  BarChart3,
  CalendarCheck,
  Lightbulb,
  MoreHorizontal,
  Target,
} from "lucide-react";

type AppShellProps = {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
};

const navItems = [
  { href: "/today", label: "Today", icon: CalendarCheck },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/performance", label: "Stats", icon: BarChart3 },
  { href: "/recommendations", label: "Ideas", icon: Lightbulb },
  { href: "/more", label: "More", icon: MoreHorizontal },
];

export default function AppShell({
  title,
  eyebrow,
  action,
  children,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-[100dvh] bg-background text-text-primary">
      {(title || action) && (
        <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 px-4 pb-3 pt-4 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div className="min-w-0">
              {eyebrow && (
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h1 className="truncate text-xl font-semibold tracking-tight">
                  {title}
                </h1>
              )}
            </div>
            {action}
          </div>
        </header>
      )}

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 shadow-[0_-8px_24px_rgba(23,32,30,0.06)] backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/today" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium transition ${
                  active
                    ? "bg-brand-primary text-white"
                    : "text-text-muted hover:bg-surface-subtle hover:text-text-primary"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
