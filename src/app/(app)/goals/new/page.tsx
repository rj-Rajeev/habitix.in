"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import ManualGoalForm from "@/components/goals/ManualGoalForm";
import type { CreateGoalInput } from "@/modules/tasks/task.schemas";

export default function NewGoalPage() {
  const router = useRouter();

  const createGoal = async (goalData: CreateGoalInput) => {
    const res = await fetch("/api/v1/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(goalData),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.message || json?.error || "Failed to create goal");
    }

    const id = json?.data?.id ?? json?.id;
    if (!id) throw new Error("Missing goal id");
    router.push(`/dashboard/goals/${id}`);
  };

  return (
    <AppShell
      eyebrow="Create"
      title="New goal"
      action={
        <Link
          href="/dashboard/goal-chat"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
        >
          <Sparkles className="h-4 w-4 text-emerald-700" />
          AI
        </Link>
      }
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <ManualGoalForm onSubmit={createGoal} />
      </div>
    </AppShell>
  );
}
