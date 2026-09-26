"use client";

import { useParams } from "next/navigation";
import { GoalDetailView } from "@/components/goals/GoalDetailView";

export default function GoalDetail() {
  const { goalId } = useParams<{ goalId: string }>();
  return <GoalDetailView goalId={goalId} initialTab="overview" />;
}
