import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/modules/auth/config/next-auth-options";
import AppSidebarPreferenceProvider from "@/components/app/AppSidebarPreferenceProvider";
import { readInitialSidebarCollapsed } from "@/components/app/sidebar-preference.server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin?callbackUrl=/dashboard");
  }

  const initialCollapsed = await readInitialSidebarCollapsed();

  return (
    <AppSidebarPreferenceProvider initialCollapsed={initialCollapsed}>
      {children}
    </AppSidebarPreferenceProvider>
  );
}
