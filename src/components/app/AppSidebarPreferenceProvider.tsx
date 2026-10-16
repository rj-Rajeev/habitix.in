"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type AppSidebarPreference = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
};

const AppSidebarPreferenceContext = createContext<AppSidebarPreference>({
  collapsed: false,
  setCollapsed: () => undefined,
});

export default function AppSidebarPreferenceProvider({
  initialCollapsed,
  children,
}: {
  initialCollapsed: boolean;
  children: ReactNode;
}) {
  const [collapsed, setCollapsedState] = useState(initialCollapsed);

  function setCollapsed(nextCollapsed: boolean) {
    setCollapsedState(nextCollapsed);
    const value = nextCollapsed ? "collapsed" : "expanded";
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `habitix_sidebar=${value}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
  }

  return (
    <AppSidebarPreferenceContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </AppSidebarPreferenceContext.Provider>
  );
}

export function useAppSidebarPreference() {
  return useContext(AppSidebarPreferenceContext);
}
