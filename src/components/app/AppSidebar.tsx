"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { getNavigationItems, isNavigationItemActive } from "@/config/navigation";
import { navigationIcons } from "./navigation-icons";

type AppSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const sidebarItems = getNavigationItems("desktopSidebar");

  return (
    <aside
      aria-label="Main navigation"
      className="sticky z-40 hidden w-full flex-col self-start border-r border-border bg-surface px-3 py-5 shadow-sm md:flex"
      style={{
        top: "var(--app-shell-top-offset, 0px)",
        height: "calc(100dvh - var(--app-shell-top-offset, 0px))",
        marginTop:
          "calc(var(--app-shell-top-offset, 0px) - var(--app-shell-content-top-inset, 0px))",
      }}
    >
      <div className="mb-6 flex items-center justify-end">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar-links"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
          title={collapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden="true" className="h-5 w-5" />
          ) : (
            <PanelLeftClose aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav id="app-sidebar-links" aria-label="Application" className="flex-1">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon ? navigationIcons[item.icon] : null;
            const active = isNavigationItemActive(pathname, item.id, "desktopSidebar");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-label={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={`flex min-h-12 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium transition ${
                    active
                      ? "bg-brand-primary text-white"
                      : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
                  }`}
                >
                  {Icon && <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />}
                  <span
                    aria-hidden={collapsed}
                    className={`block overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-[250ms] ease-in-out ${
                      collapsed ? "max-w-0 opacity-0" : "max-w-44 opacity-100"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
