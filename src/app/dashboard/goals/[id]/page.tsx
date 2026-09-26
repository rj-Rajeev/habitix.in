import { redirect } from "next/navigation";

export default async function LegacyGoalDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/goals/${id}`);
}
