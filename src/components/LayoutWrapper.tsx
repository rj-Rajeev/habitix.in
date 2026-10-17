"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
    // Define all paths where layout should be hidden
  const hideLayoutPaths = [
    "/dashboard/goal-chat",
    "/today",
    "/goals",
  ];

  const hideAdminLayout = pathname === "/admin" || pathname.startsWith("/admin/");

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


  return (
    <>
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
    </>
  );
}
