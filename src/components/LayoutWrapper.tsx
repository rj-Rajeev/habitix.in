"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
    // Define all paths where layout should be hidden
  const hideLayoutPaths = [
    "/dashboard/goal-chat",
  ];

  // Check for exact matches or dynamic segments
  const hideLayout =
    hideLayoutPaths.includes(pathname) ||
    pathname.startsWith("/personas/");


  return (
    <>
      {!hideLayout && <Navbar />}
      <main style={{ paddingTop: hideLayout ? 0 : "80px" }}>{children}</main>
      {!hideLayout && <Footer />}
    </>
  );
}
