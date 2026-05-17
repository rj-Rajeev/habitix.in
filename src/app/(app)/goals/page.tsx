"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Loader2, Plus, Target } from "lucide-react";
import AppShell from "@/components/app/AppShell";

type GoalItem = {
  _id: string;
  title: string;
  description?: string;
  targetDate?: string;
  roadmap?: Array<{ tasks?: unknown[] }>;
  createdAt?: string;
};

export default function GoalsListPage() {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/goals")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setGoals(j.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeCount = goals.length;
  const targetCount = useMemo(
    () => goals.filter((goal) => Boolean(goal.targetDate)).length,
    [goals]
  );

  return (
    <AppShell
      eyebrow="Plan"
      title="Goals"
      action={
        <Link
          href="/goals/new"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          New
        </Link>
      }
    >
      <div className="space-y-5">
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Active</p>
            <p className="mt-2 text-2xl font-semibold">{activeCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Dated</p>
            <p className="mt-2 text-2xl font-semibold">{targetCount}</p>
          </div>
        </section>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center rounded-3xl bg-white text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading
          </div>
        ) : goals.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Target className="h-6 w-6" />
            </div>
            <p className="mt-4 font-semibold text-slate-950">No goals yet</p>
            <Link
              href="/goals/new"
              className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Create goal
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {goals.map((goal) => {
              const taskCount =
                goal.roadmap?.reduce(
                  (sum, day) => sum + (day.tasks?.length ?? 0),
                  0
                ) ?? 0;

              return (
                <li key={goal._id}>
                  <Link
                    href={`/dashboard/goals/${goal._id}`}
                    className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-slate-950">
                          {goal.title}
                        </h2>
                        {goal.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                            {goal.description}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">
                            {taskCount} roadmap tasks
                          </span>
                          {goal.targetDate && (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                              {goal.targetDate}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
