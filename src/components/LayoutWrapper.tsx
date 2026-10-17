"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import AppNavigationDrawer from "@/components/app/AppNavigationDrawer";
import { AppShellNavigationContext, type AppShellNavigationContextValue } from "@/components/app/AppNavigationContext";
import { getNavigationItems, isNavigationItemActive } from "@/config/navigation";

const appNavigationItems = [...new Map(
  [
    ...getNavigationItems("desktopSidebar"),
    ...getNavigationItems("mobileMore"),
    ...getNavigationItems("desktopMore"),
  ].map((item) => [item.id, item])
).values()].filter((item) => item.id !== "courses");

function isAppShellPath(pathname: string) {
  return pathname === "/dashboard" || appNavigationItems.some((item) =>
    isNavigationItemActive(pathname, item.id, "desktopSidebar")
  );
}

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const appDrawerTriggerRef = useRef<HTMLButtonElement>(null);
  const previousPathnameRef = useRef(pathname);
  const [appDrawerOpen, setAppDrawerOpen] = useState(false);
  const openAppDrawer = useCallback(() => setAppDrawerOpen(true), []);
  const closeAppDrawer = useCallback(() => setAppDrawerOpen(false), []);
    // Define all paths where layout should be hidden
  const hideLayoutPaths = [
    "/dashboard/goal-chat",
    "/today",
    "/goals",
  ];

  const hideAdminLayout = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAppShellRoute = isAppShellPath(pathname);

  // Check for exact matches or dynamic segments
  const hideLayout =
    hideLayoutPaths.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    ) ||
    pathname.startsWith("/personas/") ||
    pathname.startsWith("/people/") ||
    hideAdminLayout;

  useEffect(() => {
    if (hideLayout) return;

    const navbar = document.querySelector<HTMLElement>("[data-public-navbar]");
    const main = mainRef.current;
    if (!navbar || !main) return;

    const updateOffset = () => {
      main.style.setProperty(
        "--app-shell-top-offset",
        `${Math.max(0, navbar.getBoundingClientRect().bottom)}px`
      );
    };

    updateOffset();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateOffset);
      observer.observe(navbar);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateOffset);
    return () => window.removeEventListener("resize", updateOffset);
  }, [hideLayout]);


  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      closeAppDrawer();
    }
  }, [pathname, closeAppDrawer]);

  const navigationContextValue: AppShellNavigationContextValue = {
    open: appDrawerOpen,
    openDrawer: openAppDrawer,
    closeDrawer: closeAppDrawer,
    triggerRef: appDrawerTriggerRef,
    hasPublicNavbar: !hideLayout,
    isAppShellRoute,
  };

  return (
    <AppShellNavigationContext.Provider value={navigationContextValue}>
      {!hideLayout && <Navbar />}
      <main
        ref={mainRef}
        style={{
          paddingTop: hideLayout ? 0 : "80px",
          "--app-shell-top-offset": hideLayout ? "0px" : "70px",
          "--app-shell-content-top-inset": hideLayout ? "0px" : "80px",
        } as React.CSSProperties}
      >
        {children}
      </main>
      {!hideLayout && <Footer />}
      {!hideAdminLayout && <AppNavigationDrawer open={appDrawerOpen} onClose={closeAppDrawer} triggerRef={appDrawerTriggerRef} />}
    </AppShellNavigationContext.Provider>
  );
}
