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
  const hideLayout = pathname === "/dashboard/goal-chat";

  return (
    <>
      {!hideLayout && <Navbar />}
      <main style={{ paddingTop: hideLayout ? 0 : "80px" }}>{children}</main>
      {!hideLayout && <Footer />}
    </>
  );
}
