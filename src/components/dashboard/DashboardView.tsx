"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Activity, ArrowRight, BookOpen, CalendarCheck, CheckCircle2, CircleAlert, Clock3, FilePlus2, History, MessageSquareText, Plus, RotateCcw, SkipForward, Target, Users } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { REVISION_OPTIONS } from "@/components/today/TaskCard";
import { completeTodayTask } from "@/hooks/useTodayQueue";
import { Alert, Card, Progress, Skeleton } from "@/components/ui";
import styles from "./DashboardView.module.css";
import type { ConnectionRequestDto } from "@/modules/people-chat/types/connection-request";
import type { PeopleConversationSummary } from "@/modules/people-chat/types/people-chat";
import type { TodayQueue } from "@/types/today";
import { getBrowserTimezone } from "@/lib/dates";

type DashboardViewId = "home" | "today" | "goals" | "learning" | "activity" | "people" | "recent";
const dashboardViews: Array<{ id: DashboardViewId; label: string; icon: typeof CalendarCheck }> = [
  { id: "home", label: "Home", icon: Activity },
  { id: "today", label: "Today", icon: CalendarCheck },
  { id: "goals", label: "Goals", icon: Target },
  { id: "learning", label: "Learning", icon: BookOpen },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "people", label: "People", icon: Users },
  { id: "recent", label: "Recent", icon: History },
];

type Goal = {
  planSource: "course" | "ai" | "manual";
  _id: string;
  title: string;
  progress?: { total: number; completed: number; remaining: number; percentage: number };
};
type Analytics = {
  currentStreak?: number;
  totalTasksCompleted?: number;
  weeklyActivity?: Array<{ date: string; completedTasks: number | null }>;
  weeklyActivityTimezone?: string;
  weeklyActivityHistoryCoverage?: "unverified" | "truncated";
};
type Enrollment = {
  status?: string;
  paymentStatus?: string;
  courseId?: { title?: string; slug?: string; thumbnail?: string } | null;
};
type ActiveCourseEnrollment = Enrollment & {
  courseId: { title: string; slug: string; thumbnail?: string };
};
type LoadState<T> = { loading: boolean; error: string; data: T | null };
type PeopleDashboardSummary = {
  pendingIncomingCount: number;
  chats: PeopleConversationSummary[];
};
type RecentActivityDto = {
  id: string;
  label: string;
  taskTitle: string;
  occurredAt: string;
  goalHref: string | null;
};

function participantInitials(displayName: string | null): string {
  const parts = displayName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((part) => part[0].toLocaleUpperCase()).join("");
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function responseError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const error = (data as { error?: unknown }).error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return fallback;
}

function useResource<T>(url: string) {
  const [state, setState] = useState<LoadState<T>>({ loading: true, error: "", data: null });
  const requestId = useRef(0);
  const refresh = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setState((current) => ({ loading: current.data === null, error: "", data: current.data }));
    try {
      const response = await fetch(url);
      const json = await response.json();
      if (!response.ok || !json?.success) throw new Error(json?.error?.message || "Unable to load this section.");
      if (requestId.current === currentRequestId) {
        setState({ loading: false, error: "", data: json.data as T });
      }
    } catch (error) {
      if (requestId.current === currentRequestId) {
        setState((current) => ({ loading: false, error: error instanceof Error ? error.message : "Unable to load this section.", data: current.data }));
      }
    }
  }, [url]);
  useEffect(() => {
    void refresh();
    return () => { requestId.current += 1; };
  }, [refresh]);
  return { ...state, refresh };
}

function SectionCard({ title, children, className = "", featured = false, headerRight }: { title: string; children: React.ReactNode; className?: string; featured?: boolean; headerRight?: React.ReactNode }) {
  const padding = "p-3 sm:p-4 lg:p-5";
  const titleSize = featured ? "text-base" : "text-sm";

  return (
    <Card className={`min-w-0 ${padding} ${className}`}>
      <div className="flex min-w-0 items-center justify-between gap-3">
        <h2 className={`${titleSize} min-w-0 font-semibold text-text-primary`}>{title}</h2>
        {headerRight}
      </div>
      <div className="mt-3">{children}</div>
    </Card>
  );
}

function LoadingLines() {
  return <div className="space-y-3" aria-label="Loading"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-3 w-full" /></div>;
}

export default function DashboardView() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [activeView, setActiveView] = useState<DashboardViewId>("home");
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const taskActionInFlight = useRef(false);
  const [expandedRevisionTaskId, setExpandedRevisionTaskId] = useState<string | null>(null);
  const [taskActionFeedback, setTaskActionFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [people, setPeople] = useState<LoadState<PeopleDashboardSummary>>({
    loading: false,
    error: "",
    data: null,
  });
  const peopleRequestStarted = useRef(false);
  const [recentActivity, setRecentActivity] = useState<LoadState<RecentActivityDto[]>>({
    loading: false,
    error: "",
    data: null,
  });
  const recentRequestStarted = useRef(false);
  useEffect(() => {
    if (pathname === "/dashboard") window.scrollTo(0, 0);
  }, [pathname]);
  const timezone = getBrowserTimezone();
  const today = useResource<TodayQueue>(`/api/v1/today?timezone=${encodeURIComponent(timezone)}`);
  const goals = useResource<Goal[]>("/api/v1/goals?status=active");
  const analytics = useResource<Analytics>(`/api/v1/analytics/summary?timezone=${encodeURIComponent(timezone)}`);
  const enrollments = useResource<Enrollment[]>("/api/enrollments");
  const firstName = session?.user?.name?.trim().split(/\s+/)[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const tasks = today.data ? [...today.data.sections.overdue, ...today.data.sections.today, ...today.data.sections.revisions] : [];
  const weeklyActivity = analytics.data?.weeklyActivity ?? [];
  const maxWeeklyActivity = Math.max(1, ...weeklyActivity.map((day) => day.completedTasks ?? 0));
  const learningCourses = enrollments.data?.filter(
    (item): item is ActiveCourseEnrollment =>
      item.status === "active" &&
      item.paymentStatus === "paid" &&
      Boolean(item.courseId?.slug && item.courseId?.title)
  ) ?? [];
  const loadRecentActivity = useCallback(async () => {
    if (recentRequestStarted.current) return;
    recentRequestStarted.current = true;
    setRecentActivity({ loading: true, error: "", data: null });
    try {
      const response = await fetch("/api/v1/task-history");
      const result = await readJson(response);
      if (!response.ok || !result || typeof result !== "object" || !((result as { success?: unknown }).success === true)) {
        throw new Error(responseError(result, "Recent activity could not be loaded."));
      }
      const data = (result as { data?: unknown }).data;
      const events = data && typeof data === "object" ? (data as { events?: unknown }).events : null;
      if (!Array.isArray(events) || !events.every((event) =>
        event && typeof event === "object" &&
        typeof (event as RecentActivityDto).id === "string" &&
        typeof (event as RecentActivityDto).label === "string" &&
        typeof (event as RecentActivityDto).taskTitle === "string" &&
        typeof (event as RecentActivityDto).occurredAt === "string" &&
        ((event as RecentActivityDto).goalHref === null || typeof (event as RecentActivityDto).goalHref === "string")
      )) {
        throw new Error("Recent activity could not be loaded.");
      }
      setRecentActivity({ loading: false, error: "", data: (events as RecentActivityDto[]).slice(0, 25) });
    } catch (error) {
      recentRequestStarted.current = false;
      setRecentActivity({
        loading: false,
        error: error instanceof Error ? error.message : "Recent activity could not be loaded.",
        data: null,
      });
    }
  }, []);

  const loadPeople = useCallback(async () => {
    if (peopleRequestStarted.current) return;
    peopleRequestStarted.current = true;
    setPeople({ loading: true, error: "", data: null });
    try {
      const [requestsResponse, chatsResponse] = await Promise.all([
        fetch("/api/connection-requests?direction=incoming"),
        fetch("/api/chats"),
      ]);
      const [requestsData, chatsData] = await Promise.all([
        readJson(requestsResponse),
        readJson(chatsResponse),
      ]);
      if (!requestsResponse.ok || !Array.isArray(requestsData)) {
        throw new Error(responseError(requestsData, "Connection requests could not be loaded."));
      }
      if (!chatsResponse.ok || !Array.isArray(chatsData)) {
        throw new Error(responseError(chatsData, "Your chats could not be loaded."));
      }

      const pendingIncomingCount = (requestsData as ConnectionRequestDto[])
        .filter((request) => request.status === "pending").length;
      const accessibleChats = (chatsData as PeopleConversationSummary[]).map((chat) => ({
        chatId: chat.chatId,
        participant: {
          userId: chat.participant.userId,
          displayName: chat.participant.displayName,
        },
      }));
      setPeople({
        loading: false,
        error: "",
        data: { pendingIncomingCount, chats: accessibleChats },
      });
    } catch (error) {
      peopleRequestStarted.current = false;
      setPeople({
        loading: false,
        error: error instanceof Error ? error.message : "People information could not be loaded.",
        data: null,
      });
    }
  }, []);

  useEffect(() => {
    if (activeView !== "home") return;
    void loadRecentActivity();
    void loadPeople();
  }, [activeView, loadPeople, loadRecentActivity]);

  const selectView = (view: DashboardViewId) => {
    setActiveView(view);
    if (view === "home") {
      void loadRecentActivity();
      void loadPeople();
    }
    if (view === "people") void loadPeople();
    if (view === "recent") void loadRecentActivity();
  };

  const retryPeople = () => {
    peopleRequestStarted.current = false;
    void loadPeople();
  };

  const retryRecentActivity = () => {
    recentRequestStarted.current = false;
    void loadRecentActivity();
  };

  const taskMetrics = [
    { label: "Overdue", count: today.data?.summary.overdueCount ?? 0, icon: CircleAlert, tone: "warning" },
    { label: "Scheduled today", count: today.data?.sections.today.length ?? 0, icon: CalendarCheck, tone: "info" },
    { label: "Revisions", count: today.data?.sections.revisions.length ?? 0, icon: RotateCcw, tone: "ai" },
    { label: "Total tasks", count: tasks.length, icon: CheckCircle2, tone: "success" },
  ] as const;

  const handleHomeTaskAction = async (taskId: string, scheduleRevision?: string) => {
    if (taskActionInFlight.current) return;
    taskActionInFlight.current = true;
    setBusyTaskId(taskId);
    setTaskActionFeedback(null);
    try {
      await completeTodayTask(taskId, scheduleRevision);
      setTaskActionFeedback({
        kind: "success",
        message: scheduleRevision
          ? "Task completed and revision scheduled."
          : "Task completed.",
      });
      setExpandedRevisionTaskId(null);
      await today.refresh();
    } catch (error) {
      setTaskActionFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : "The task could not be updated. Please try again.",
      });
    } finally {
      taskActionInFlight.current = false;
      setBusyTaskId(null);
    }
  };

  const topTasksPreview = (
    <section aria-labelledby="dashboard-top-tasks" className="mt-3 border-t border-border pt-3">
      <h3 id="dashboard-top-tasks" className="text-xs font-semibold text-text-primary">Top tasks</h3>
      {tasks.length ? (
        <ol className="mt-1 divide-y divide-border">
          {tasks.slice(0, 3).map((task) => {
            const category = task.isOverdue ? "Overdue" : task.type === "revision" ? "Revision" : "Scheduled today";
            return (
              <li key={task._id} className="min-w-0 py-2 first:pt-1 last:pb-1">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-text-primary">{task.title}</p>
                    {task.goalTitle && <p className="mt-0.5 truncate text-xs text-text-secondary">{task.goalTitle}</p>}
                  </div>
                  <span className={`self-start shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${task.isOverdue ? "bg-[var(--warning-soft)] text-[var(--warning)]" : "bg-surface-subtle text-text-secondary"}`}>
                    {category}
                  </span>
                </div>
                {(task.status === "pending" || task.status === "in_progress") && (
                  <div className="mt-2 flex min-w-0 max-w-full flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busyTaskId !== null}
                      onClick={() => void handleHomeTaskAction(task._id)}
                      className="ui-button min-h-8 max-w-full whitespace-nowrap px-2.5 text-xs"
                      data-variant="secondary"
                    >
                      {busyTaskId === task._id ? "Saving…" : "Complete"}
                    </button>
                    {task.type === "execution" && (
                      <button
                        type="button"
                        disabled={busyTaskId !== null}
                        aria-expanded={expandedRevisionTaskId === task._id}
                        onClick={() => setExpandedRevisionTaskId((current) => current === task._id ? null : task._id)}
                        className="inline-flex min-h-8 max-w-full items-center whitespace-nowrap rounded-control px-2.5 text-xs font-medium text-brand-primary hover:bg-brand-primary-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-60"
                      >
                        Schedule revision
                      </button>
                    )}
                  </div>
                )}
                {task.type === "execution" && expandedRevisionTaskId === task._id && (
                  <div className="mt-2 min-w-0 max-w-full rounded-lg bg-surface-subtle p-2.5" aria-label={`Revision options for ${task.title}`}>
                    <p className="text-xs text-text-secondary">This completes the task and schedules a revision.</p>
                    <div className="mt-2 flex min-w-0 max-w-full flex-wrap gap-1.5">
                      {REVISION_OPTIONS.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          disabled={busyTaskId !== null}
                          onClick={() => void handleHomeTaskAction(task._id, option.key)}
                          className="ui-button min-h-8 max-w-full whitespace-nowrap px-2.5 text-xs"
                          data-variant="ghost"
                          aria-label={`Complete ${task.title} and schedule revision ${option.label.toLowerCase()} later`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      ) : <p className="mt-1 text-xs text-text-secondary">No tasks are scheduled. Add a task or review your full task list.</p>}
      {taskActionFeedback && (
        <p className={`mt-2 rounded-lg px-3 py-2 text-xs ${taskActionFeedback.kind === "error" ? "border border-error/20 bg-error/5 text-error" : "bg-[var(--success-soft)] text-[var(--success)]"}`} role={taskActionFeedback.kind === "error" ? "alert" : "status"}>
          {taskActionFeedback.message}
        </p>
      )}
      {today.error && today.data && <Alert tone="error" className="mt-2">The task was updated, but the task list could not be refreshed: {today.error}</Alert>}
    </section>
  );

  const quickActions = (
    <SectionCard title="Quick actions">
      <ul className="divide-y divide-border">
        <li><Link href="/today" className="group flex min-h-9 items-center gap-3 py-1.5 text-sm font-medium text-text-primary hover:text-brand-primary"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-primary-soft text-brand-primary"><Plus aria-hidden="true" className="h-4 w-4" /></span><span className="min-w-0 flex-1">Add a task</span><ArrowRight aria-hidden="true" className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5" /></Link></li>
        <li><Link href="/goals/new" className="group flex min-h-9 items-center gap-3 py-1.5 text-sm font-medium text-text-primary hover:text-brand-primary"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ai-soft text-ai-primary"><Target aria-hidden="true" className="h-4 w-4" /></span><span className="min-w-0 flex-1">Create a goal</span><ArrowRight aria-hidden="true" className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5" /></Link></li>
        <li><Link href="/courses" className="group flex min-h-9 items-center gap-3 py-1.5 text-sm font-medium text-text-primary hover:text-brand-primary"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--info-soft)] text-[var(--info)]"><BookOpen aria-hidden="true" className="h-4 w-4" /></span><span className="min-w-0 flex-1">Explore courses</span><ArrowRight aria-hidden="true" className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5" /></Link></li>
      </ul>
    </SectionCard>
  );

  const eventIcon = (label: string) => {
    switch (label) {
      case "Task completed": return CheckCircle2;
      case "Task skipped": return SkipForward;
      case "Task reopened": return RotateCcw;
      case "Task rescheduled": return Clock3;
      case "Revision scheduled": return CalendarCheck;
      case "Task created": return FilePlus2;
      case "Note added": return MessageSquareText;
      default: return Activity;
    }
  };

  const homePeoplePreview = (
    <SectionCard title="People" headerRight={<Link href="/people" className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-brand-primary">Open People <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>}>
      {people.loading || (!people.error && !people.data) ? (
        <div role="status" aria-label="Loading People" aria-busy="true" className="space-y-2">
          <div className={styles.peopleAvatarRow} aria-hidden="true">
            {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-10 w-10 shrink-0 rounded-full" />)}
          </div>
          <Skeleton className="h-3 w-28" />
        </div>
      ) : people.error ? (
        <Alert tone="error" className="flex-col items-start gap-2">
          <span>{people.error}</span>
          <button type="button" onClick={retryPeople} className="ui-button min-h-9" data-variant="secondary">Try again</button>
        </Alert>
      ) : people.data ? (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary"><strong className="text-text-primary">{people.data.pendingIncomingCount}</strong> pending connection request{people.data.pendingIncomingCount === 1 ? "" : "s"}</p>
          {people.data.chats.length ? (
            <div className={styles.peopleAvatarRow}>
              {people.data.chats.slice(0, 5).map((chat) => {
                const name = chat.participant.displayName?.trim() || null;
                return (
                  <Link
                    key={chat.chatId}
                    href={`/people/${encodeURIComponent(chat.participant.userId)}`}
                    title={name || "Participant"}
                    aria-label={name ? `Open chat with ${name}` : "Open chat with participant"}
                    className={`${styles.peopleAvatar} grid place-items-center rounded-full border border-border bg-brand-primary-soft text-xs font-semibold text-brand-primary transition-colors hover:bg-brand-primary hover:text-white`}
                  >
                    <span aria-hidden="true">{participantInitials(name)}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-text-secondary">No accessible chats yet.</p>
          )}
        </div>
      ) : null}
    </SectionCard>
  );

  const homeRecentPreview = (
    <SectionCard title="Recent activity" headerRight={<button type="button" onClick={() => selectView("recent")} className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-brand-primary">View all activity <ArrowRight aria-hidden="true" className="h-4 w-4" /></button>}>
      {recentActivity.loading || (!recentActivity.error && !recentActivity.data) ? (
        <div role="status" aria-label="Loading recent activity" aria-busy="true" className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ) : recentActivity.error ? (
        <Alert tone="error" className="flex-col items-start gap-2">
          <span>{recentActivity.error}</span>
          <button type="button" onClick={retryRecentActivity} className="ui-button min-h-9" data-variant="secondary">Try again</button>
        </Alert>
      ) : recentActivity.data?.length ? (
        <ol className="divide-y divide-border">
          {recentActivity.data.slice(0, 5).map((event) => {
        const Icon = eventIcon(event.label);
        const timestamp = new Date(event.occurredAt);
        const readableTimestamp = Number.isFinite(timestamp.getTime()) ? new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(timestamp) : "Date unavailable";
        const goalHref = event.goalHref?.startsWith("/goals/") ? event.goalHref : null;
        return (
          <li key={event.id} className="flex min-w-0 items-center gap-2 py-2 first:pt-0 last:pb-0">
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--info)]" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] leading-tight text-text-secondary">{event.label}</p>
              <p title={event.taskTitle} className="truncate text-sm font-medium text-text-primary">
                {goalHref ? <Link href={goalHref} className="hover:text-brand-primary">{event.taskTitle}</Link> : event.taskTitle}
              </p>
            </div>
            <time dateTime={event.occurredAt} className="shrink-0 text-right text-[10px] leading-tight text-text-secondary">{readableTimestamp}</time>
          </li>
        );
      })}
        </ol>
      ) : (
        <p className="text-xs text-text-secondary">No recent task activity yet.</p>
      )}
    </SectionCard>
  );

  return (
    <AppShell hideHeaderTitle compactContentTop contentClassName="max-w-none">
      <div className="mx-auto min-w-0 w-full max-w-[1280px] space-y-3 sm:space-y-5">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">{greeting}, {firstName}</h1>
          <p className="mt-1.5 text-sm text-text-secondary sm:mt-2">Make today count, one step at a time.</p>
        </header>

        <div role="group" aria-label="Dashboard views" className={`${styles.dashboardTabsScroll} -mx-4 min-w-0 overflow-x-auto overscroll-x-contain px-2 pb-1 sm:mx-0 sm:px-0`}>
          <div className="flex w-max items-center gap-1 rounded-2xl border border-border bg-surface-subtle p-1 sm:gap-1.5">
          {dashboardViews.map(({ id, label, icon: Icon }) => {
            const selected = activeView === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                title={label}
                onClick={() => selectView(id)}
                className={`flex h-14 w-[74px] flex-none flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-medium leading-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary sm:h-10 sm:w-20 sm:flex-row sm:gap-1.5 sm:px-2 sm:text-xs sm:leading-tight lg:w-[100px] ${
                  selected
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-text-secondary hover:bg-surface hover:text-text-primary"
                }`}
              >
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap">{label}</span>
              </button>
            );
          })}
          </div>
        </div>

        {activeView === "home" && (
          <div className="space-y-4 sm:space-y-5">
            <div className={styles.homeColumns}>
              <div className={styles.leftColumn}>
                <SectionCard title="Today’s tasks" featured className="shadow-sm" headerRight={today.data ? <p className="inline-flex shrink-0 items-center gap-1.5 text-xs text-text-secondary"><Clock3 aria-hidden="true" className="h-4 w-4 text-brand-primary" /><span><strong className="font-semibold text-text-primary">{today.data.summary.estimatedMinutes}</strong> min planned</span></p> : null}>
                  {today.loading && !today.data ? <LoadingLines /> : !today.data ? <Alert tone="error">{today.error}</Alert> : <>
                    <dl className="grid grid-cols-2 gap-2 xl:grid-cols-4 xl:gap-2.5">{taskMetrics.map(({ label, count, icon: Icon, tone }) => <div key={label} className={`min-w-0 rounded-xl border border-border px-2.5 py-2.5 ${tone === "warning" ? "bg-[var(--warning-soft)]" : tone === "info" ? "bg-[var(--info-soft)]" : tone === "ai" ? "bg-ai-soft" : "bg-[var(--success-soft)]"}`}><dt className="flex min-h-5 items-center gap-1.5 text-[11px] font-medium leading-tight text-text-secondary"><Icon aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 ${tone === "warning" ? "text-[var(--warning)]" : tone === "info" ? "text-[var(--info)]" : tone === "ai" ? "text-ai-primary" : "text-[var(--success)]"}`} /><span>{label}</span></dt><dd className="mt-1 text-xl font-semibold leading-tight text-text-primary">{count}</dd></div>)}</dl>
                    {topTasksPreview}
                    <Link href="/today" className="ui-button mt-3 min-h-11 w-full" data-variant="primary">{tasks.length === 0 ? "Add a task" : (today.data?.summary.overdueCount ?? 0) > 0 ? "Review overdue tasks" : "View today’s tasks"}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
                  </>}
                </SectionCard>
                <div className={styles.leftSubsections}>
                  <SectionCard title="Active goals" headerRight={<Link href="/goals" className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-brand-primary">View all <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>}>
                  {goals.loading ? <LoadingLines /> : goals.error ? <Alert tone="error">{goals.error}</Alert> : !goals.data?.length ? <><p className="text-sm text-text-secondary">No active goals yet.</p><Link href="/goals/new" className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-brand-primary">Create a goal <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></> : <ul className="divide-y divide-border">{goals.data.slice(0, 3).map((goal) => <li key={goal._id} className="py-2.5 first:pt-0 last:pb-0"><div className="flex min-w-0 items-center justify-between gap-2"><Link href={`/goals/${goal._id}`} className="min-w-0 break-words text-sm font-semibold text-text-primary hover:text-brand-primary">{goal.title}</Link>{goal.progress && goal.progress.total > 0 && <span className="shrink-0 text-xs text-text-secondary">{goal.progress.percentage}%</span>}</div>{goal.progress && goal.progress.total > 0 ? <div className="mt-1.5 flex items-center gap-2"><Progress className="min-w-0 flex-1" value={goal.progress.percentage} label={`${goal.title} progress`} /><span className="shrink-0 text-[11px] text-text-secondary">{goal.progress.completed}/{goal.progress.total}</span></div> : <p className="mt-1 text-xs text-text-secondary">No execution tasks yet</p>}</li>)}</ul>}
                  </SectionCard>

                  <SectionCard title="Continue learning" headerRight={<Link href="/courses" className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-brand-primary">View all <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>}>
                  {enrollments.loading ? <LoadingLines /> : enrollments.error ? <Alert tone="error">{enrollments.error}</Alert> : learningCourses.length ? <ul className="divide-y divide-border">{learningCourses.slice(0, 3).map((enrollment) => <li key={enrollment.courseId.slug} className="flex min-w-0 items-center gap-2.5 py-2 first:pt-0 last:pb-0">{enrollment.courseId.thumbnail ? <img src={enrollment.courseId.thumbnail} alt="" loading="lazy" className="h-10 w-12 shrink-0 rounded-lg object-cover" /> : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-primary-soft text-brand-primary"><BookOpen aria-hidden="true" className="h-4 w-4" /></span>}<span className="min-w-0 flex-1 break-words text-sm font-medium text-text-primary">{enrollment.courseId.title}</span><Link href={`/courses/${encodeURIComponent(enrollment.courseId.slug)}`} aria-label={`Continue learning ${enrollment.courseId.title}`} className="inline-flex min-h-9 shrink-0 items-center gap-1 text-xs font-semibold text-brand-primary">Continue <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></li>)}</ul> : <><p className="text-sm text-text-secondary">Explore a course to keep building your skills.</p><Link href="/courses" className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-brand-primary">Explore courses <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></>}
                  </SectionCard>
                </div>
              </div>

              <div className={styles.rightColumn}>
                {quickActions}
                {homeRecentPreview}
                {homePeoplePreview}
              </div>
            </div>
          </div>
        )}

        {activeView === "today" && (
          <div className="space-y-5 sm:space-y-6">
            <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(16rem,1fr)] lg:gap-5">
              <SectionCard title="Today’s tasks" featured className="h-full shadow-sm sm:p-6" headerRight={today.data ? <p className="inline-flex shrink-0 items-center gap-1.5 text-xs text-text-secondary sm:text-sm"><Clock3 aria-hidden="true" className="h-4 w-4 text-brand-primary" /><span><strong className="font-semibold text-text-primary">{today.data.summary.estimatedMinutes}</strong> min planned</span></p> : null}>
                {today.loading && !today.data ? <LoadingLines /> : !today.data ? <Alert tone="error">{today.error}</Alert> : (
                  <>
                    <dl className="grid grid-cols-2 gap-2 xl:grid-cols-4 xl:gap-2.5">
                      {taskMetrics.map(({ label, count, icon: Icon, tone }) => (
                        <div key={label} className={`min-w-0 rounded-xl border border-border px-2.5 py-2.5 sm:px-3 ${tone === "warning" ? "bg-[var(--warning-soft)]" : tone === "info" ? "bg-[var(--info-soft)]" : tone === "ai" ? "bg-ai-soft" : "bg-[var(--success-soft)]"}`}>
                          <dt className="flex min-h-5 items-center gap-1.5 text-[11px] font-medium leading-tight text-text-secondary sm:text-xs"><Icon aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 ${tone === "warning" ? "text-[var(--warning)]" : tone === "info" ? "text-[var(--info)]" : tone === "ai" ? "text-ai-primary" : "text-[var(--success)]"}`} /><span>{label}</span></dt>
                          <dd className="mt-1 text-xl font-semibold leading-tight text-text-primary">{count}</dd>
                        </div>
                      ))}
                    </dl>
                    {topTasksPreview}
                    <Link href="/today" className="ui-button mt-3 min-h-11 w-full" data-variant="primary">{tasks.length === 0 ? "Add a task" : (today.data?.summary.overdueCount ?? 0) > 0 ? "Review overdue tasks" : "View today’s tasks"}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
                  </>
                )}
              </SectionCard>
              {quickActions}
            </div>

            <div className="grid items-stretch gap-4 lg:grid-cols-2 lg:gap-5">
              <SectionCard title="Active goals" className="h-full">
                {goals.loading ? <LoadingLines /> : goals.error ? <Alert tone="error">{goals.error}</Alert> : !goals.data?.length ? <><p className="text-sm text-text-secondary">No active goals yet.</p><Link href="/goals/new" className="mt-3 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-primary">Create a goal <ArrowRight className="h-4 w-4" /></Link></> : <><ul className="divide-y divide-border">{goals.data.slice(0, 3).map((goal) => <li key={goal._id} className="py-3 first:pt-0 last:pb-0"><Link href={`/goals/${goal._id}`} className="block break-words text-sm font-semibold text-text-primary hover:text-brand-primary">{goal.title}</Link>{goal.progress && goal.progress.total > 0 ? <div className="mt-2 flex items-center gap-3"><Progress className="min-w-0 flex-1" value={goal.progress.percentage} label={`${goal.title} progress`} /><span className="shrink-0 text-xs font-medium text-text-secondary">{goal.progress.percentage}%</span></div> : <p className="mt-1 text-xs text-text-secondary">No execution tasks yet</p>}</li>)}</ul><Link href="/goals" className="mt-3 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-primary">View all goals <ArrowRight className="h-4 w-4" /></Link></>}
              </SectionCard>
              <SectionCard title="Continue learning" className="h-full">
                {enrollments.loading ? <LoadingLines /> : enrollments.error ? <Alert tone="error">{enrollments.error}</Alert> : learningCourses.length ? <><ul className="divide-y divide-border">{learningCourses.slice(0, 3).map((enrollment) => <li key={enrollment.courseId.slug} className="flex min-w-0 items-center gap-3 py-2.5 first:pt-0 last:pb-0"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-primary-soft text-brand-primary"><BookOpen aria-hidden="true" className="h-4 w-4" /></span><span className="min-w-0 flex-1 break-words text-sm font-medium text-text-primary">{enrollment.courseId.title}</span><Link href={`/courses/${encodeURIComponent(enrollment.courseId.slug)}`} aria-label={`Continue learning ${enrollment.courseId.title}`} className="inline-flex min-h-10 shrink-0 items-center gap-1 text-xs font-semibold text-brand-primary sm:text-sm">Continue <ArrowRight className="h-4 w-4" /></Link></li>)}</ul><Link href="/courses" className="mt-2 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-primary">View all courses <ArrowRight className="h-4 w-4" /></Link></> : <><p className="text-sm text-text-secondary">Explore a course to keep building your skills.</p><Link href="/courses" className="mt-3 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-primary">Explore courses <ArrowRight className="h-4 w-4" /></Link></>}
              </SectionCard>
            </div>
          </div>
        )}

        {activeView === "goals" && (
          <SectionCard title="Your goals">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-text-secondary">Track the work moving you toward your goals.</p><Link href="/goals/new" className="ui-button min-h-10" data-variant="primary"><Plus className="h-4 w-4" />Create goal</Link></div>
            {goals.loading ? <LoadingLines /> : goals.error ? <Alert tone="error">{goals.error}</Alert> : !goals.data?.length ? <><p className="text-sm text-text-secondary">No active goals yet.</p><Link href="/goals/new" className="mt-3 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-primary">Create your first goal <ArrowRight className="h-4 w-4" /></Link></> : <ul className="divide-y divide-border">{goals.data.map((goal) => <li key={goal._id} className="py-4 first:pt-0 last:pb-0"><div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><Link href={`/goals/${goal._id}`} className="min-w-0 flex-1 break-words text-sm font-semibold text-text-primary hover:text-brand-primary">{goal.title}</Link>{goal.progress && goal.progress.total > 0 && <span className="shrink-0 text-xs font-medium text-text-secondary">{goal.progress.completed} of {goal.progress.total} · {goal.progress.percentage}%</span>}</div>{goal.progress && goal.progress.total > 0 ? <Progress className="mt-2" value={goal.progress.percentage} label={`${goal.title} progress`} /> : <p className="mt-2 text-xs text-text-secondary">No execution tasks yet</p>}</li>)}</ul>}
          </SectionCard>
        )}

        {activeView === "learning" && (
          <SectionCard title="Your learning">
            {enrollments.loading ? <LoadingLines /> : enrollments.error ? <Alert tone="error">{enrollments.error}</Alert> : learningCourses.length ? <><ul className="divide-y divide-border">{learningCourses.map((enrollment) => <li key={enrollment.courseId.slug} className="flex min-w-0 items-center gap-3 py-2.5 first:pt-0 last:pb-0"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-primary-soft text-brand-primary"><BookOpen aria-hidden="true" className="h-4 w-4" /></span><span className="min-w-0 flex-1 break-words text-sm font-medium text-text-primary">{enrollment.courseId.title}</span><Link href={`/courses/${encodeURIComponent(enrollment.courseId.slug)}`} aria-label={`Continue learning ${enrollment.courseId.title}`} className="inline-flex min-h-10 shrink-0 items-center gap-1 text-xs font-semibold text-brand-primary sm:text-sm">Continue <ArrowRight className="h-4 w-4" /></Link></li>)}</ul><Link href="/courses" className="mt-2 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-primary">View all courses <ArrowRight className="h-4 w-4" /></Link></> : <div className="rounded-xl border border-dashed border-border-strong bg-surface-subtle p-4"><p className="font-medium text-text-primary">No active paid enrollments yet.</p><p className="mt-1 text-sm text-text-secondary">Explore the catalog to find your next course.</p><Link href="/courses" className="mt-2 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-primary">Explore courses <ArrowRight className="h-4 w-4" /></Link></div>}
          </SectionCard>
        )}

        {activeView === "people" && (
          <SectionCard title="People" headerRight={<Link href="/people" className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-brand-primary sm:text-sm">Open People <ArrowRight className="h-4 w-4" /></Link>}>
            {people.loading ? <div aria-label="Loading People" aria-busy="true"><LoadingLines /></div> : people.error ? <Alert tone="error" className="flex-col items-start gap-3 sm:flex-row sm:items-center"><span>{people.error}</span><button type="button" onClick={retryPeople} className="ui-button min-h-10" data-variant="secondary">Try again</button></Alert> : <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--info-soft)] px-3 py-2.5"><div className="flex items-center gap-2"><Users aria-hidden="true" className="h-4 w-4 text-[var(--info)]" /><p className="text-sm font-medium text-text-primary">Incoming requests</p></div><p className="text-sm text-text-secondary"><strong className="font-semibold text-text-primary">{people.data?.pendingIncomingCount ?? 0}</strong> pending</p></div>
              <div className="mt-4"><h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Accessible chats</h3>{people.data?.chats.length ? <ul className="mt-1 divide-y divide-border">{people.data.chats.slice(0, 5).map((chat) => <li key={chat.chatId}><Link href={`/people/${encodeURIComponent(chat.participant.userId)}`} className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm font-medium text-text-primary hover:text-brand-primary"><span className="min-w-0 truncate">{chat.participant.displayName || "Habitix member"}</span><ArrowRight className="h-4 w-4 shrink-0 text-brand-primary" /></Link></li>)}</ul> : <p className="mt-2 text-sm text-text-secondary">No accessible chats yet.</p>}</div>
            </>}
          </SectionCard>
        )}

        {activeView === "activity" && (
          <SectionCard title="Weekly activity">
            {analytics.loading ? <LoadingLines /> : analytics.error ? <Alert tone="error">{analytics.error}</Alert> : !analytics.data ? <p className="text-sm text-text-secondary">Activity details are unavailable right now.</p> : <>
              {(typeof analytics.data.currentStreak === "number" || typeof analytics.data.totalTasksCompleted === "number") && <dl className="mb-5 grid gap-3 sm:grid-cols-2">{typeof analytics.data.currentStreak === "number" && <div className="rounded-xl border border-border bg-surface-subtle px-4 py-3"><dt className="text-xs font-medium text-text-secondary">Current streak</dt><dd className="mt-1 text-xl font-semibold text-text-primary">{analytics.data.currentStreak} days</dd></div>}{typeof analytics.data.totalTasksCompleted === "number" && <div className="rounded-xl border border-border bg-surface-subtle px-4 py-3"><dt className="text-xs font-medium text-text-secondary">Tasks completed</dt><dd className="mt-1 text-xl font-semibold text-text-primary">{analytics.data.totalTasksCompleted}</dd></div>}</dl>}
              {!analytics.data.weeklyActivity ? <p className="text-sm text-text-secondary">Weekly activity is unavailable right now.</p> : <>
              <div className="flex flex-wrap items-start justify-between gap-2"><p className="text-sm text-text-secondary">Recorded task completions · {analytics.data.weeklyActivityTimezone || timezone}</p><span className="rounded-full bg-[var(--warning-soft)] px-2.5 py-1 text-xs font-medium text-[var(--warning)]">History coverage unverified{analytics.data.weeklyActivityHistoryCoverage === "truncated" ? " · display limit reached" : ""}</span></div>
              {weeklyActivity.every((day) => day.completedTasks === null) ? <p className="mt-4 rounded-xl bg-surface-subtle p-4 text-sm text-text-secondary">No completion events are recorded for these dates. This does not confirm that no tasks were completed.</p> : <ol aria-label="Recorded task completion events by day" className="mt-5 grid grid-cols-7 gap-2 sm:gap-3">{weeklyActivity.map((day) => {
                const count = day.completedTasks;
                const label = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric" }).format(new Date(`${day.date}T12:00:00`));
                const height = count === null || count === 0 ? 0 : (count / maxWeeklyActivity) * 100;
                const accessibleLabel = count === null
                  ? `${label}: completion history unavailable`
                  : `${label}: ${count} completed task${count === 1 ? "" : "s"}`;
                return <li key={day.date} aria-label={accessibleLabel} className="flex min-w-0 flex-col items-center gap-2 text-center"><span className="min-h-4 text-[10px] font-semibold text-text-primary sm:text-xs">{count === null ? "—" : count}</span><div className="relative flex h-28 w-full items-end justify-center border-b border-border-strong px-1.5">{count !== null && count > 0 && <div aria-hidden="true" className="w-full max-w-8 rounded-t-md bg-brand-primary transition-[height] duration-300" style={{ height: `${height}%` }} />}</div><time dateTime={day.date} className="text-[10px] leading-tight text-text-secondary sm:text-xs">{label}</time></li>;
              })}</ol>}
              </>}
            </>}
          </SectionCard>
        )}

        {activeView === "recent" && (
          <SectionCard title="Recent activity">
            {recentActivity.loading ? <div aria-label="Loading recent activity" aria-busy="true"><LoadingLines /></div> : recentActivity.error ? <Alert tone="error" className="flex-col items-start gap-3 sm:flex-row sm:items-center"><span>{recentActivity.error}</span><button type="button" onClick={retryRecentActivity} className="ui-button min-h-10" data-variant="secondary">Try again</button></Alert> : !recentActivity.data?.length ? <div className="rounded-xl border border-dashed border-border-strong bg-surface-subtle p-5"><p className="font-medium text-text-primary">No recent task activity yet.</p><p className="mt-1 text-sm text-text-secondary">Completed, skipped, and scheduled task events will appear here.</p></div> : <ol className="divide-y divide-border">{recentActivity.data.map((event) => {
              const Icon = eventIcon(event.label);
              const goalHref = event.goalHref?.startsWith("/goals/") ? event.goalHref : null;
              const timestamp = new Date(event.occurredAt);
              const readableTimestamp = Number.isFinite(timestamp.getTime()) ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(timestamp) : "Date unavailable";
              return <li key={event.id} className="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--info-soft)] text-[var(--info)]"><Icon aria-hidden="true" className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-xs font-medium text-text-secondary">{event.label}</p><p className="mt-1 break-words text-sm [overflow-wrap:anywhere]">{goalHref ? <Link href={goalHref} className="font-medium text-text-primary hover:text-brand-primary">{event.taskTitle}</Link> : <span className="font-medium text-text-primary">{event.taskTitle}</span>}</p></div><time dateTime={event.occurredAt} className="w-full pl-12 pt-0.5 text-left text-[11px] text-text-secondary sm:w-auto sm:pl-0 sm:text-right sm:text-xs">{readableTimestamp}</time></li>;
            })}</ol>}
          </SectionCard>
        )}

        {activeView !== "today" && activeView !== "home" && quickActions}
      </div>
    </AppShell>
  );
}
