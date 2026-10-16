import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/modules/auth/config/next-auth-options";
import DashboardView from "@/components/dashboard/DashboardView";
import AppSidebarPreferenceProvider from "@/components/app/AppSidebarPreferenceProvider";
import { readInitialSidebarCollapsed } from "@/components/app/sidebar-preference.server";

export const metadata = {
  title: "Dashboard | Habitix",
  description: "Your personal overview for today.",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin?callbackUrl=/dashboard");

  const initialCollapsed = await readInitialSidebarCollapsed();

  return (
    <AppSidebarPreferenceProvider initialCollapsed={initialCollapsed}>
      <DashboardView />
    </AppSidebarPreferenceProvider>
  );
}
