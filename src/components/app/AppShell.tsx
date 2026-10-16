"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import AppSidebar from "./AppSidebar";
import AppNavigationDrawer from "./AppNavigationDrawer";
import { useAppSidebarPreference } from "./AppSidebarPreferenceProvider";
import { appNavigationItems, isAppNavigationItemActive } from "./navigation";

type AppShellProps = {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
};

export default function AppShell({
  title,
  eyebrow,
  action,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const { collapsed: sidebarCollapsed, setCollapsed } = useAppSidebarPreference();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    if (isAdminRoute) return;

    const desktopViewport = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) closeMobileMenu();
    };
    desktopViewport.addEventListener("change", closeOnDesktop);
    return () => desktopViewport.removeEventListener("change", closeOnDesktop);
  }, [closeMobileMenu, isAdminRoute]);

  return (
    <div className="min-h-[100dvh] bg-background text-text-primary">
      {!isAdminRoute && (
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setCollapsed(!sidebarCollapsed)}
        />
      )}
      <div
        className={`min-w-0 ${
          isAdminRoute
            ? ""
            : `md:transition-[margin-left] md:duration-[250ms] md:ease-in-out ${
                sidebarCollapsed ? "md:ml-20" : "md:ml-64"
              }`
        }`}
      >
        {(title || action || !isAdminRoute) && (
          <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 px-4 pb-3 pt-4 backdrop-blur">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                {!isAdminRoute && (
                  <button
                    ref={mobileMenuTriggerRef}
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    aria-label="Open navigation menu"
                    aria-haspopup="dialog"
                    aria-expanded={mobileMenuOpen}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-text-secondary hover:bg-surface-subtle hover:text-text-primary md:hidden"
                  >
                    <Menu aria-hidden="true" className="h-5 w-5" />
                  </button>
                )}
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
              </div>
              {action}
            </div>
          </header>
        )}

        <main className="mx-auto max-w-3xl px-4 pb-28 pt-4">{children}</main>
      </div>

      <nav
        aria-label="Primary navigation"
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 shadow-[0_-8px_24px_rgba(23,32,30,0.06)] backdrop-blur ${
          isAdminRoute ? "hidden" : "md:hidden"
        }`}
      >
        <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1">
          {appNavigationItems.map((item) => {
            const Icon = item.icon;
            const active = isAppNavigationItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
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
      {!isAdminRoute && (
        <AppNavigationDrawer
          open={mobileMenuOpen}
          onClose={closeMobileMenu}
          triggerRef={mobileMenuTriggerRef}
        />
      )}
    </div>
  );
}
