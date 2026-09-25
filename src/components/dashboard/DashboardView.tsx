"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, BookOpen, CalendarCheck, Plus, Target } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Alert, Card, Progress, Skeleton } from "@/components/ui";
import type { TodayQueue } from "@/types/today";

type Goal = {
  _id: string;
  title: string;
  roadmap?: Array<{ tasks?: Array<{ isCompleted?: boolean }> }>;
};
type Analytics = { currentStreak?: number; totalTasksCompleted?: number };
type Enrollment = {
  status?: string;
  paymentStatus?: string;
  courseId?: { title?: string; slug?: string } | null;
};
type ActiveCourseEnrollment = Enrollment & {
  courseId: { title: string; slug: string };
};
type LoadState<T> = { loading: boolean; error: string; data: T | null };

function useResource<T>(url: string) {
  const [state, setState] = useState<LoadState<T>>({ loading: true, error: "", data: null });
  useEffect(() => {
    let active = true;
    fetch(url)
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || !json?.success) throw new Error(json?.error?.message || "Unable to load this section.");
        return json.data as T;
      })
      .then((data) => { if (active) setState({ loading: false, error: "", data }); })
      .catch((error: unknown) => { if (active) setState({ loading: false, error: error instanceof Error ? error.message : "Unable to load this section.", data: null }); });
    return () => { active = false; };
  }, [url]);
  return state;
}

function SectionCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return <Card className={`p-5 sm:p-6 ${className}`}><h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">{title}</h2><div className="mt-4">{children}</div></Card>;
}

function LoadingLines() {
  return <div className="space-y-3" aria-label="Loading"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-3 w-full" /></div>;
}

export default function DashboardView() {
  const { data: session } = useSession();
  const today = useResource<TodayQueue>("/api/v1/today");
  const goals = useResource<Goal[]>("/api/v1/goals");
  const analytics = useResource<Analytics>("/api/v1/analytics/summary");
  const enrollments = useResource<Enrollment[]>("/api/enrollments");
  const firstName = session?.user?.name?.trim().split(/\s+/)[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const tasks = today.data ? [...today.data.sections.overdue, ...today.data.sections.today, ...today.data.sections.revisions] : [];
  const learningCourses = enrollments.data?.filter(
    (item): item is ActiveCourseEnrollment =>
      item.status === "active" &&
      item.paymentStatus === "paid" &&
      Boolean(item.courseId?.slug && item.courseId?.title)
  ) ?? [];
  const hasMoreLearningCourses = learningCourses.length > 3;

  return <AppShell eyebrow="Your overview" title="Dashboard">
    <div className="space-y-5 sm:space-y-6">
      <header className="pb-1 pt-2">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">{greeting}, {firstName}</h1>
        <p className="mt-2 text-sm text-text-secondary">Make today count, one step at a time.</p>
      </header>

      <SectionCard title="Today" className="border-brand-primary/20">
        {today.loading ? <LoadingLines /> : today.error ? <Alert tone="error">{today.error}</Alert> : tasks.length === 0 ? <><p className="font-medium text-text-primary">Your day is clear.</p><p className="mt-1 text-sm text-text-secondary">Add a task or start with one of your goals.</p><Link className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-brand-primary" href="/today"><Plus className="h-4 w-4" /> Add a task <ArrowRight className="h-4 w-4" /></Link></> : <><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-2xl font-semibold text-text-primary">{tasks.length} task{tasks.length === 1 ? "" : "s"} to work on</p><p className="mt-1 text-sm text-text-secondary">{today.data?.summary.overdueCount ? `${today.data.summary.overdueCount} overdue · ` : ""}{today.data?.sections.today.length ?? 0} scheduled today</p></div><Link className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-primary" href="/today">Continue today <ArrowRight className="h-4 w-4" /></Link></div><div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-sm text-text-secondary"><CalendarCheck className="h-4 w-4 text-brand-primary" />{today.data?.summary.estimatedMinutes ?? 0} minutes planned</div></>}
      </SectionCard>

      <div className="grid gap-5 sm:grid-cols-2">
        <SectionCard title="Active goals">
          {goals.loading ? <LoadingLines /> : goals.error ? <Alert tone="error">{goals.error}</Alert> : !goals.data?.length ? <><p className="font-medium">No goals yet.</p><p className="mt-1 text-sm text-text-secondary">Set a direction for something you want to build.</p><Link href="/goals/new" className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-brand-primary">Create a goal <ArrowRight className="h-4 w-4" /></Link></> : <><p className="text-sm text-text-secondary">{goals.data.length} active goal{goals.data.length === 1 ? "" : "s"}</p><ul className="mt-3 space-y-3">{goals.data.slice(0, 2).map((goal) => {
            const items = goal.roadmap?.flatMap((day) => day.tasks ?? []) ?? [];
            const percent = items.length ? Math.round(items.filter((task) => task.isCompleted).length / items.length * 100) : null;
            return <li key={goal._id}><Link href={`/dashboard/goals/${goal._id}`} className="flex items-center justify-between gap-3 text-sm font-medium text-text-primary hover:text-brand-primary"><span className="truncate">{goal.title}</span>{percent !== null && <span className="text-text-secondary">{percent}%</span>}</Link>{percent !== null && <Progress className="mt-2" value={percent} label={`${goal.title} progress`} />}</li>;
          })}</ul><Link href="/goals" className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-primary">View all goals <ArrowRight className="h-4 w-4" /></Link></>}
        </SectionCard>

        <SectionCard title="Learning">
          {enrollments.loading ? <LoadingLines /> : enrollments.error ? <Alert tone="error">{enrollments.error}</Alert> : learningCourses.length > 0 ? <><ul className="space-y-3">{learningCourses.slice(0, 3).map((enrollment) => <li key={enrollment.courseId.slug} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"><span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{enrollment.courseId.title}</span><Link href={`/courses/${encodeURIComponent(enrollment.courseId.slug)}`} className="inline-flex min-h-10 shrink-0 items-center gap-1 text-sm font-semibold text-brand-primary">Continue learning <ArrowRight className="h-4 w-4" /></Link></li>)}</ul>{hasMoreLearningCourses && <Link href="/courses" className="mt-3 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-primary">View all courses <ArrowRight className="h-4 w-4" /></Link>}</> : <><div className="flex items-center gap-2 font-medium"><BookOpen className="h-4 w-4 text-brand-primary" /><span>Keep learning.</span></div><p className="mt-1 text-sm text-text-secondary">Explore courses designed to help you build practical skills.</p><Link href="/courses" className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-primary">Explore courses <ArrowRight className="h-4 w-4" /></Link></>}
        </SectionCard>
      </div>

      <SectionCard title="Your consistency">
        {analytics.loading ? <LoadingLines /> : analytics.error ? <Alert tone="error">{analytics.error}</Alert> : <div className="flex flex-wrap gap-x-10 gap-y-4">{typeof analytics.data?.currentStreak === "number" && <div><p className="text-2xl font-semibold">{analytics.data.currentStreak} days</p><p className="text-sm text-text-secondary">Current streak</p></div>}{typeof analytics.data?.totalTasksCompleted === "number" && <div><p className="text-2xl font-semibold">{analytics.data.totalTasksCompleted}</p><p className="text-sm text-text-secondary">Tasks completed</p></div>}{typeof analytics.data?.currentStreak !== "number" && typeof analytics.data?.totalTasksCompleted !== "number" && <p className="text-sm text-text-secondary">Consistency details are not available yet.</p>}</div>}
      </SectionCard>

      <section aria-labelledby="quick-actions-heading" className="space-y-3 pt-1">
        <h2 id="quick-actions-heading" className="text-sm font-semibold text-text-primary">Quick actions</h2>
        <div className="flex flex-wrap gap-2"><Link href="/today" className="ui-button min-h-11 flex-1 sm:flex-none" data-variant="primary"><Plus className="h-4 w-4" />Add task</Link><Link href="/goals/new" className="ui-button min-h-11 flex-1 sm:flex-none" data-variant="secondary"><Target className="h-4 w-4" />Create goal</Link><Link href="/courses" className="ui-button min-h-11 flex-1 sm:flex-none" data-variant="secondary"><BookOpen className="h-4 w-4" />Explore courses</Link></div>
      </section>
    </div>
  </AppShell>;
}
