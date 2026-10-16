import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/modules/auth/config/next-auth-options";
import ProfilePage from "@/components/profile/profile-page";
import AppSidebarPreferenceProvider from "@/components/app/AppSidebarPreferenceProvider";
import { readInitialSidebarCollapsed } from "@/components/app/sidebar-preference.server";

export const metadata = {
  title: "Profile | Habitix",
  description: "Manage your Habitix profile and password.",
};

export default async function ProfileRoute() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/profile");
  }

  const initialCollapsed = await readInitialSidebarCollapsed();

  return (
    <AppSidebarPreferenceProvider initialCollapsed={initialCollapsed}>
      <ProfilePage userId={session.user.id} />
    </AppSidebarPreferenceProvider>
  );
}
