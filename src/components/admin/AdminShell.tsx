"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminNavigation = [
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/email", label: "Email" },
  { href: "/admin/notifications", label: "Notifications" },
];

function isAdminNavigationItemActive(pathname: string, href: string) {
  return href === "/admin/courses"
    ? pathname === href || pathname.startsWith(`${href}/`)
    : pathname === href;
}

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-[100dvh] bg-background text-text-primary">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <Link
            href="/admin/courses"
            className="w-fit rounded-lg text-base font-semibold tracking-tight text-text-primary"
          >
            Habitix Admin
          </Link>
          <nav aria-label="Admin navigation">
            <ul className="flex flex-wrap gap-2">
              {adminNavigation.map((item) => {
                const active = isAdminNavigationItemActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium transition ${
                        active
                          ? "bg-brand-primary text-white"
                          : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
