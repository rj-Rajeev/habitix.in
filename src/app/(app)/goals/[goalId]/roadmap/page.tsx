"use client";

import { useParams } from "next/navigation";
import GoalRoadmap from "@/components/goals/GoalRoadmap";

export default function GoalRoadmapPage() {
  const { goalId } = useParams<{ goalId: string }>();
  return <GoalRoadmap goalId={goalId} />;
}
