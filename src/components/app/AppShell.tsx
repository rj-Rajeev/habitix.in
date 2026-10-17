"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Menu } from "lucide-react";
import AppSidebar from "./AppSidebar";
import { useAppSidebarPreference } from "./AppSidebarPreferenceProvider";
import { useAppShellNavigation } from "./AppNavigationContext";
import { getNavigationItems, isNavigationItemActive } from "@/config/navigation";
import { navigationIcons } from "./navigation-icons";

type AppShellProps = {
  title?: string;
  titleAs?: "h1" | "span";
  eyebrow?: string;
  action?: ReactNode;
  contentClassName?: string;
  hideHeaderTitle?: boolean;
  compactContentTop?: boolean;
  children: ReactNode;
};

export default function AppShell({
  title,
  titleAs = "h1",
  eyebrow,
  action,
  contentClassName,
  hideHeaderTitle = false,
  compactContentTop = false,
  children,
}: AppShellProps) {
  const TitleElement = titleAs;
  const mobileNavigationItems = getNavigationItems("mobileBottomBar");
  const pathname = usePathname();
  const { collapsed: sidebarCollapsed, setCollapsed } = useAppSidebarPreference();
  const { open: mobileMenuOpen, toggleDrawer, closeDrawer, triggerRef, hasPublicNavbar } = useAppShellNavigation();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  useEffect(() => {
    if (isAdminRoute) return;

    const desktopViewport = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) closeDrawer();
    };
    desktopViewport.addEventListener("change", closeOnDesktop);
    return () => desktopViewport.removeEventListener("change", closeOnDesktop);
  }, [closeDrawer, isAdminRoute]);

  return (
    <div
      className={`min-h-0 flex-1 bg-background text-text-primary ${
        isAdminRoute
          ? ""
          : "md:grid md:transition-[grid-template-columns] md:duration-[250ms] md:ease-in-out"
      }`}
      style={isAdminRoute ? undefined : {
        gridTemplateColumns: sidebarCollapsed
          ? "5rem minmax(0, 1fr)"
          : "16rem minmax(0, 1fr)",
      }}
    >
      {!isAdminRoute && (
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setCollapsed(!sidebarCollapsed)}
        />
      )}
      <div
        className="min-w-0"
      >
        {(title || action || !isAdminRoute) && !(hideHeaderTitle && hasPublicNavbar && !title && !action) && (
          <header className={`sticky top-0 ${mobileMenuOpen && !hasPublicNavbar ? "z-[60] pointer-events-none" : "z-30"} border-b border-border/80 bg-background/95 backdrop-blur ${hideHeaderTitle ? "px-4 py-1 md:hidden" : "px-4 pb-3 pt-4"}`}>
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                {!isAdminRoute && !hasPublicNavbar && (
                  <button
                    ref={triggerRef}
                    type="button"
                    onClick={toggleDrawer}
                    aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                    aria-haspopup="dialog"
                    aria-expanded={mobileMenuOpen}
                    aria-controls="mobile-app-navigation"
                    className="relative z-[61] flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-text-secondary hover:bg-surface-subtle hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary md:hidden"
                  >
                    <Menu aria-hidden="true" className="h-5 w-5" />
                  </button>
                )}
                {!hideHeaderTitle && <div className="min-w-0">
                  {eyebrow && (
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
                      {eyebrow}
                    </p>
                  )}
                  {title && (
                    <TitleElement className="truncate text-xl font-semibold tracking-tight">
                      {title}
                    </TitleElement>
                  )}
                </div>}
              </div>
              {action}
            </div>
          </header>
        )}

        <main className={`mx-auto w-full px-4 pb-28 ${compactContentTop ? "pt-2 sm:pt-3" : "pt-4"} ${contentClassName ?? "max-w-3xl"}`}>{children}</main>
      </div>

      <nav
        aria-label="Primary navigation"
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 shadow-[0_-8px_24px_rgba(23,32,30,0.06)] backdrop-blur ${
          isAdminRoute ? "hidden" : "md:hidden"
        }`}
      >
        <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1">
          {mobileNavigationItems.map((item) => {
            const Icon = item.icon ? navigationIcons[item.icon] : null;
            const active = isNavigationItemActive(pathname, item.id, "mobileBottomBar");

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
                {Icon && <Icon aria-hidden="true" className="h-4 w-4" />}
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
