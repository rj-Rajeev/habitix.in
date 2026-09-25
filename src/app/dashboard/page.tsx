import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import DashboardView from "@/components/dashboard/DashboardView";

export const metadata = {
  title: "Dashboard | Habitix",
  description: "Your personal overview for today.",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin?callbackUrl=/dashboard");

  return <DashboardView />;
}
