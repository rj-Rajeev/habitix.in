"use client";

import { GoalDetailView } from "@/components/goals/GoalDetailView";

export default function GoalRoadmap({ goalId }: { goalId: string }) {
  return <GoalDetailView goalId={goalId} initialTab="roadmap" />;
}
