import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdminUser();
  } catch {
    redirect("/signin?callbackUrl=/admin/courses");
  }

  return children;
}
