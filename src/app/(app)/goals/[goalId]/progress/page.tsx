"use client";

import { useParams } from "next/navigation";
import { GoalProgress } from "@/components/goals/GoalProgress";

export default function GoalProgressRoute() {
  const { goalId } = useParams<{ goalId: string }>();
  return <GoalProgress goalId={goalId} />;
}
