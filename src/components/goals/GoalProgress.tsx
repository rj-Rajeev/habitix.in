"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Badge } from "@/components/ui";

type GoalProgressData = {
  _id: string;
  title: string;
  completed: boolean;
  status: "active" | "completed" | "archived";
  progress: { total: number; completed: number; remaining: number; percentage: number };
  courseId?: string | { _id?: string };
};

type CourseProgressData = {
  title: string;
  slug: string;
  completedCount: number;
  totalCount: number;
};

export function GoalProgress({ goalId }: { goalId: string }) {
  const [goal, setGoal] = useState<GoalProgressData | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCourseProgress(null);

    try {
      const response = await fetch(`/api/v1/goals/${goalId}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        throw new Error(payload?.error?.message || "Failed to load goal progress");
      }

      const goalData = payload.data as GoalProgressData;
      setGoal(goalData);

      const rawCourseId = goalData.courseId;
      const courseId = typeof rawCourseId === "string" ? rawCourseId : rawCourseId?._id;
      if (!courseId) return;

      try {
        const coursesResponse = await fetch("/api/courses");
        const coursesPayload = await coursesResponse.json();
        const courses = coursesPayload?.data;
        const course = Array.isArray(courses)
          ? courses.find((item: { _id?: string }) => item._id === courseId)
          : undefined;
        if (!course?.slug) return;

        const progressResponse = await fetch(
          `/api/courses/${encodeURIComponent(course.slug)}/progress`
        );
        const progressPayload = await progressResponse.json().catch(() => null);
        const progress = progressPayload?.data;
        if (
          progress &&
          Number.isFinite(progress.completedCount) &&
          Number.isFinite(progress.totalCount)
        ) {
          setCourseProgress({
            title: course.title,
            slug: course.slug,
            completedCount: progress.completedCount,
            totalCount: progress.totalCount,
          });
        }
      } catch {
        // Course progress is optional; keep the Goal progress available.
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load goal progress");
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  const goalStatus = goal?.status === "archived"
    ? "Archived"
    : goal?.completed || goal?.status === "completed"
      ? "Completed"
      : "In progress";
  const coursePercentage = courseProgress?.totalCount
    ? Math.round((courseProgress.completedCount / courseProgress.totalCount) * 100)
    : 0;

  return (
    <AppShell
      eyebrow="Goal Progress"
      title={goal?.title ?? "Goal Progress"}
      action={
        <Link
          href={`/goals/${goalId}`}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Goal
        </Link>
      }
    >
      {loading ? (
        <div className="mx-auto max-w-5xl space-y-4" aria-label="Loading goal progress">
          <div className="rounded-2xl border border-border bg-white p-6">
            <span className="ui-skeleton h-5 w-1/3" />
            <span className="ui-skeleton mt-4 h-12 w-full" />
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-error/20 bg-error/5 p-4 text-sm text-error">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => void loadProgress()}
            className="min-h-10 rounded-control border border-error/20 bg-white px-3 font-semibold"
          >
            Retry
          </button>
        </div>
      ) : goal ? (
        <div className="mx-auto max-w-5xl space-y-5">
          <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Goal Progress</h2>
                <p className="mt-1 text-sm text-text-secondary">Your executable tasks toward this goal.</p>
              </div>
              <Badge tone={goalStatus === "Completed" ? "success" : "neutral"}>{goalStatus}</Badge>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-text-secondary">
                {goal.progress.completed} of {goal.progress.total} tasks complete
              </span>
              <span className="font-semibold text-text-primary">{goal.progress.percentage}%</span>
            </div>
            <div className="ui-progress mt-2">
              <span style={{ width: `${goal.progress.percentage}%` }} />
            </div>
            <p className="mt-4 text-sm text-text-secondary">
              {goal.progress.remaining} remaining
            </p>
          </section>

          {courseProgress && (
            <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-text-primary">Course Progress</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Lesson completion in the linked course, separate from Goal task progress.
              </p>
              <p className="mt-3 text-sm font-medium text-text-primary">{courseProgress.title}</p>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-text-secondary">
                  {courseProgress.completedCount} of {courseProgress.totalCount} lessons complete
                </span>
                <span className="font-semibold text-text-primary">{coursePercentage}%</span>
              </div>
              <div className="ui-progress mt-3">
                <span style={{ width: `${coursePercentage}%` }} />
              </div>
            </section>
          )}
        </div>
      ) : null}
    </AppShell>
  );
}
