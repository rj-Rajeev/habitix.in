import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import ProfilePage from "@/components/profile/profile-page";

export const metadata = {
  title: "Profile | Habitix",
  description: "Manage your Habitix profile and password.",
};

export default async function ProfileRoute() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/profile");
  }

  return <ProfilePage userId={session.user.id} />;
}