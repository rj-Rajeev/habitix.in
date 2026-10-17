"use client";

import { createContext, useContext, type RefObject } from "react";

export type AppShellNavigationContextValue = {
  open: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  hasPublicNavbar: boolean;
  isAppShellRoute: boolean;
};

export const AppShellNavigationContext = createContext<AppShellNavigationContextValue | null>(null);

export function useAppShellNavigation() {
  const context = useContext(AppShellNavigationContext);
  if (!context) throw new Error("App navigation must be used inside LayoutWrapper");
  return context;
}
