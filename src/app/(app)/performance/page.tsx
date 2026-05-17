"use client";

import { useEffect, useState } from "react";
import { BarChart3, Clock3, Flame, Loader2, Target } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import type { TodayQueue } from "@/types/today";

type Summary = {
  currentStreak: number;
  activeGoals: number;
  completedCount?: number;
};

export default function PerformancePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [queue, setQueue] = useState<TodayQueue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/analytics/summary").then((r) => r.json()),
      fetch("/api/v1/today").then((r) => r.json()),
    ])
      .then(([summaryJson, todayJson]) => {
        if (summaryJson.success) setSummary(summaryJson.data);
        if (todayJson.success) setQueue(todayJson.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const total = queue?.summary.total ?? 0;
  const overdue = queue?.summary.overdueCount ?? 0;
  const focusLoad = queue?.summary.estimatedMinutes ?? 0;
  const completionProxy = total ? Math.max(0, Math.round(((total - overdue) / total) * 100)) : 100;

  return (
    <AppShell eyebrow="Insights" title="Performance">
      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-3xl bg-white text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading
        </div>
      ) : (
        <div className="space-y-5">
          <section className="rounded-3xl bg-slate-950 p-5 text-white">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-emerald-300" />
              <div>
                <p className="text-sm text-slate-300">Today health</p>
                <h2 className="text-3xl font-semibold">{completionProxy}%</h2>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${completionProxy}%` }}
              />
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <Metric icon={<Flame className="h-4 w-4" />} label="Streak" value={`${summary?.currentStreak ?? 0}d`} />
            <Metric icon={<Target className="h-4 w-4" />} label="Goals" value={String(summary?.activeGoals ?? 0)} />
            <Metric icon={<Clock3 className="h-4 w-4" />} label="Focus load" value={`${focusLoad}m`} />
            <Metric icon={<BarChart3 className="h-4 w-4" />} label="Overdue" value={String(overdue)} />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">Workload graph</h2>
            <div className="mt-4 flex h-36 items-end gap-2">
              {[total, focusLoad / 30, overdue, summary?.activeGoals ?? 0, summary?.currentStreak ?? 0].map((value, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-xl bg-emerald-500"
                    style={{ height: `${Math.max(10, Math.min(100, value * 12))}%` }}
                  />
                  <span className="text-[10px] font-medium text-slate-500">
                    {["Tasks", "Load", "Late", "Goals", "Streak"][index]}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}
