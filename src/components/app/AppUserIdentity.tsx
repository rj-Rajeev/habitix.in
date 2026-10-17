"use client";

import Link from "next/link";
import { Avatar } from "@mui/material";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { getNavigationItem, isNavigationItemActive } from "@/config/navigation";

type AppUserIdentityProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

export default function AppUserIdentity({ collapsed = false, onNavigate }: AppUserIdentityProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user;

  if (!user) return null;

  const name = user.name?.trim() || user.email?.split("@")[0] || "Account";
  const initials = user.name?.trim()
    ? user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
    : user.email?.[0]?.toUpperCase() || "?";
  const profile = getNavigationItem("profile");
  const active = isNavigationItemActive(pathname, profile.id, "desktopSidebar");

  return (
    <Link
      href={profile.href}
      onClick={onNavigate}
      aria-label={`Open profile for ${name}`}
      aria-current={active ? "page" : undefined}
      title={collapsed ? `${name}${user.email ? ` · ${user.email}` : ""}` : undefined}
      className={`flex min-h-12 min-w-0 items-center rounded-xl text-text-primary transition hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${collapsed ? "justify-center px-1" : "gap-2.5 px-2"}`}
    >
      <Avatar
        src={user.image || undefined}
        alt={name}
        sx={{ width: 34, height: 34, flexShrink: 0, bgcolor: "var(--brand-primary)", fontSize: 12, fontWeight: 700 }}
      >
        {initials}
      </Avatar>
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold">{name}</span>
            {user.email && <span className="mt-0.5 block truncate text-[11px] text-text-muted">{user.email}</span>}
          </span>
          <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-text-muted" />
        </>
      )}
    </Link>
  );
}
