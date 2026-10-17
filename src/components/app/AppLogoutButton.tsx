"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

type AppLogoutButtonProps = {
  collapsed?: boolean;
  onSignOut?: () => void;
};

export default function AppLogoutButton({
  collapsed = false,
  onSignOut,
}: AppLogoutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        onSignOut?.();
        void signOut({ callbackUrl: "/" });
      }}
      aria-label="Logout"
      title={collapsed ? "Logout" : undefined}
      className={`flex min-h-10 w-full items-center rounded-xl px-3 text-sm font-medium text-text-secondary transition hover:bg-surface-subtle hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${collapsed ? "justify-center" : "gap-3"}`}
    >
      <LogOut aria-hidden="true" className="h-5 w-5 shrink-0" />
      {!collapsed && <span>Logout</span>}
    </button>
  );
}
