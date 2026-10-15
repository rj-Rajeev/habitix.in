"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { enrollInCourse } from "@/modules/courses/client/enroll-client";
import { ArrowLeft, BookOpen, Menu } from "lucide-react";
import CourseBreadcrumbs from "@/modules/courses/components/CourseBreadcrumbs";
import CourseContentsDrawer from "@/modules/courses/components/CourseContentsDrawer";
import CourseCurriculumSidebar from "@/modules/courses/components/CourseCurriculumSidebar";
import LessonContent from "@/modules/courses/components/LessonContent";
import LessonNavigation from "@/modules/courses/components/LessonNavigation";
import type {
  CourseModule,
  CourseProgressSummary,
  FlatCourseLesson,
} from "@/modules/courses/components/course-learning.types";
import styles from "@/modules/courses/components/CourseDetail.module.css";

type Course = {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnail?: string;
  price: number;
  status: "published";
};

type CourseResponse = { course: Course; modules: CourseModule[] };
type CourseProgress = {
  completedLessonIds: string[];
  completedCount: number;
  totalCount: number;
  percentage: number;
};
type EnrollmentState = {
  enrolled: boolean;
  status?: "active" | "pending" | "cancelled";
  paymentStatus?: string;
};
function getProgressSummary(
  progress: CourseProgress | null,
  loading: boolean,
  error: string,
): CourseProgressSummary {
  if (loading) return { label: "Loading progress…" };
  if (error || !progress) return { label: "Progress unavailable" };
  if (!Number.isFinite(progress.totalCount) || progress.totalCount < 0)
    return { label: "Progress unavailable" };
  if (progress.totalCount === 0) return { label: "No lessons yet" };
  if (!Number.isFinite(progress.percentage))
    return { label: "Progress unavailable" };
  const value = Math.max(0, Math.min(100, Math.round(progress.percentage)));
  return { label: `${value}% complete`, value };
}

function findLessonByRouteIdentifier(
  modules: CourseModule[],
  identifier: string,
  identifierType: "slug" | "legacy",
) {
  const lessons = modules.flatMap((module) => module.lessons);
  if (identifierType === "slug")
    return lessons.find((lesson) => lesson.lessonSlug === identifier);
  return lessons.find((lesson) => lesson._id === identifier) ??
    lessons.find((lesson) => lesson.lessonSlug === identifier);
}

function scrollLessonWithinContainer(
  container: HTMLElement | null,
  lessonId: string,
) {
  if (!container || !lessonId) return;
  const lessonButton = Array.from(
    container.querySelectorAll<HTMLElement>("[data-lesson-id]"),
  ).find((element) => element.dataset.lessonId === lessonId);
  if (!lessonButton) return;

  const containerBounds = container.getBoundingClientRect();
  const lessonBounds = lessonButton.getBoundingClientRect();
  if (lessonBounds.top < containerBounds.top) {
    container.scrollTop -= containerBounds.top - lessonBounds.top;
  } else if (lessonBounds.bottom > containerBounds.bottom) {
    container.scrollTop += lessonBounds.bottom - containerBounds.bottom;
  }
}

async function loadCourse(slug: string): Promise<CourseResponse> {
  const response = await fetch(`/api/courses/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false)
    throw new Error(payload?.error?.message || "Unable to load this course.");
  return (payload?.data ?? payload) as CourseResponse;
}

export default function CourseDetail({
  slug,
  lessonSlug,
  legacyLessonIdentifier,
}: {
  slug: string;
  lessonSlug?: string;
  legacyLessonIdentifier?: string;
}) {
  const [data, setData] = useState<CourseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrollment, setEnrollment] = useState<EnrollmentState | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentMessage, setEnrollmentMessage] = useState("");
  const [activeLessonId, setActiveLessonId] = useState("");
  const [expandedModules, setExpandedModules] = useState<
    Record<string, boolean>
  >({});
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(
    null,
  );
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState("");
  const [completingLessonId, setCompletingLessonId] = useState("");
  const [contentsOpen, setContentsOpen] = useState(false);
  const desktopSidebarRef = useRef<HTMLElement>(null);
  const mobileSidebarRef = useRef<HTMLDivElement>(null);
  const { status: authStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryLessonId = searchParams.get("lessonId");
  const requestedLessonId = lessonSlug ?? legacyLessonIdentifier ?? queryLessonId;
  const requestedIdentifierType = lessonSlug ? "slug" : "legacy";
  const activeModule = data?.modules.find((module) =>
    module.lessons.some((lesson) => lesson._id === activeLessonId),
  );
  const activeModuleExpanded = activeModule
    ? (expandedModules[activeModule._id] ?? false)
    : false;

  useEffect(() => {
    let active = true;
    void loadCourse(slug)
      .then((result) => {
        if (!active) return;
        setData(result);
      })
      .catch((loadError) => {
        if (active)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load this course.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!data) return;
    const requestedLesson = requestedLessonId
      ? findLessonByRouteIdentifier(
          data.modules,
          requestedLessonId,
          requestedIdentifierType,
        )
      : undefined;
    const requestedModule = requestedLesson
      ? data.modules.find((module) =>
          module.lessons.some((lesson) => lesson._id === requestedLesson._id),
        )
      : undefined;
    if (requestedLesson && requestedModule) {
      setActiveLessonId(requestedLesson._id);
      setExpandedModules((current) => ({ ...current, [requestedModule._id]: true }));
      if (requestedLesson.lessonSlug) {
        const canonicalPath = `/courses/${encodeURIComponent(slug)}/${encodeURIComponent(requestedLesson.lessonSlug)}`;
        const currentPath = searchParams.toString()
          ? `${pathname}?${searchParams.toString()}`
          : pathname;
        if (currentPath !== canonicalPath) router.replace(canonicalPath);
      }
      return;
    }
    if (requestedLessonId) {
      setActiveLessonId("");
      return;
    }
    const firstModule = data.modules[0];
    setActiveLessonId(firstModule?.lessons[0]?._id ?? "");
    if (firstModule) {
      setExpandedModules((current) => ({ ...current, [firstModule._id]: true }));
    }
  }, [
    data,
    lessonSlug,
    pathname,
    requestedIdentifierType,
    requestedLessonId,
    router,
    searchParams,
    slug,
  ]);

  useEffect(() => {
    if (!data || !activeLessonId || !activeModuleExpanded) return;
    const frame = window.requestAnimationFrame(() => {
      scrollLessonWithinContainer(desktopSidebarRef.current, activeLessonId);
      if (contentsOpen) {
        scrollLessonWithinContainer(mobileSidebarRef.current, activeLessonId);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeLessonId, activeModuleExpanded, contentsOpen, data]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !data?.course._id) return;
    void fetch(`/api/courses/${data.course._id}/enrollment`)
      .then((response) => response.json())
      .then((payload) => {
        if (payload?.success) setEnrollment(payload.data);
      })
      .catch(() => undefined);
  }, [authStatus, data?.course._id]);

  useEffect(() => {
    if (!data?.course._id || authStatus === "loading") return;
    let active = true;
    setProgressLoading(true);
    setProgressError("");
    if (authStatus !== "authenticated") {
      setProgressError("Sign in to load and save your course progress.");
      setProgressLoading(false);
      return;
    }
    void fetch(`/api/courses/${encodeURIComponent(slug)}/progress`)
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || payload?.success === false)
          throw new Error(
            payload?.error?.message || "Unable to load course progress.",
          );
        return (payload?.data ?? payload) as CourseProgress;
      })
      .then((result) => {
        if (active) setCourseProgress(result);
      })
      .catch((loadError) => {
        if (active)
          setProgressError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load course progress.",
          );
      })
      .finally(() => {
        if (active) setProgressLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authStatus, data?.course._id, slug]);

  useEffect(() => {
    if (!contentsOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setContentsOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [contentsOpen]);

  async function enroll() {
    if (!data) return;
    if (authStatus !== "authenticated") {
      await signIn(undefined, {
        callbackUrl: `/courses/${encodeURIComponent(slug)}`,
      });
      return;
    }
    setEnrolling(true);
    setEnrollmentMessage("");
    try {
      await enrollInCourse(data.course._id, data.course.title);
      let refreshedCourse: CourseResponse;
      try {
        refreshedCourse = await loadCourse(slug);
      } catch {
        setEnrollmentMessage(
          "You are enrolled, but course content could not be refreshed. Refresh this page to continue.",
        );
        return;
      }
      setData(refreshedCourse);
      setEnrollment({
        enrolled: true,
        status: "active",
        paymentStatus: "paid",
      });
      setEnrollmentMessage("You are enrolled. Course content is ready.");
    } catch (enrollmentError) {
      setEnrollmentMessage(
        enrollmentError instanceof Error
          ? enrollmentError.message
          : "Unable to enroll.",
      );
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) return <PageState>Loading course</PageState>;
  if (error || !data)
    return (
      <PageState>
        <BookOpen
          className="mx-auto h-8 w-8 text-brand-primary"
          aria-hidden="true"
        />
        <h1 className="mt-4 font-semibold text-text-primary">
          Course unavailable
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {error || "This course could not be found."}
        </p>
        <Link
          href="/courses"
          className="ui-button mt-5 no-underline"
          data-variant="primary"
        >
          <ArrowLeft className="h-4 w-4" /> Browse courses
        </Link>
      </PageState>
    );

  if (
    requestedLessonId &&
    !findLessonByRouteIdentifier(
      data.modules,
      requestedLessonId,
      requestedIdentifierType,
    )
  ) {
    return (
      <PageState>
        <BookOpen
          className="mx-auto h-8 w-8 text-brand-primary"
          aria-hidden="true"
        />
        <h1 className="mt-4 font-semibold text-text-primary">
          Lesson unavailable
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          This lesson could not be found in this course.
        </p>
        <Link
          href={`/courses/${encodeURIComponent(slug)}`}
          className="ui-button mt-5 no-underline"
          data-variant="primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to course
        </Link>
      </PageState>
    );
  }

  const { course, modules } = data;
  const allLessons = modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      ...lesson,
      moduleTitle: module.title,
      moduleOrder: module.order,
    })),
  );
  const requestedLesson = requestedLessonId
    ? findLessonByRouteIdentifier(
        data.modules,
        requestedLessonId,
        requestedIdentifierType,
      )
    : undefined;
  const activeLesson =
    (requestedLesson
      ? allLessons.find((lesson) => lesson._id === requestedLesson._id)
      : undefined) ?? allLessons.find((lesson) => lesson._id === activeLessonId);
  const activeIndex = activeLesson
    ? allLessons.findIndex((lesson) => lesson._id === activeLesson._id)
    : -1;
  const hasAccess =
    course.price === 0 ||
    (enrollment?.status === "active" && enrollment.paymentStatus === "paid");
  const canAccessActiveLesson = hasAccess || Boolean(activeLesson?.isFree);
  const completedLessons = courseProgress?.completedLessonIds ?? [];
  const progressSummary = getProgressSummary(
    courseProgress,
    progressLoading,
    progressError,
  );

  const selectLesson = (lesson: FlatCourseLesson) => {
    setActiveLessonId(lesson._id);
    setExpandedModules((current) => ({ ...current, [lesson.moduleId]: true }));
    setContentsOpen(false);
    const nextPath = lesson.lessonSlug
      ? `/courses/${encodeURIComponent(slug)}/${encodeURIComponent(lesson.lessonSlug)}`
      : `/courses/${encodeURIComponent(slug)}?lessonId=${encodeURIComponent(lesson._id)}`;
    const currentPath = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    if (currentPath !== nextPath) router.push(nextPath);
  };

  const markComplete = async () => {
    if (
      !hasAccess ||
      !activeLesson ||
      progressLoading ||
      progressError ||
      completingLessonId ||
      completedLessons.includes(activeLesson._id)
    )
      return;
    setCompletingLessonId(activeLesson._id);
    setProgressError("");
    try {
      const response = await fetch(
        `/api/courses/${encodeURIComponent(slug)}/progress`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId: activeLesson._id }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.success === false)
        throw new Error(
          payload?.error?.message || "Unable to save lesson progress.",
        );
      setCourseProgress((payload?.data ?? payload) as CourseProgress);
    } catch (completionError) {
      setProgressError(
        completionError instanceof Error
          ? completionError.message
          : "Unable to save lesson progress.",
      );
    } finally {
      setCompletingLessonId("");
    }
  };

  return (
    <>
      <style jsx>{`\n        @keyframes course-drawer-in {\n          from { transform: translateX(100%); }\n          to { transform: translateX(0); }\n        }\n      `}</style>
      <main className="min-h-[calc(100vh-80px)] bg-background">
        <div className="mx-auto grid w-full min-w-0 grid-cols-1 min-[900px]:grid-cols-[300px_minmax(0,1fr)]">
          <aside
            ref={desktopSidebarRef}
            className={`${styles.curriculumScroll} hidden min-w-0 border-r border-border bg-surface min-[900px]:sticky min-[900px]:top-20 min-[900px]:block min-[900px]:h-[calc(100vh-5rem)] min-[900px]:self-start min-[900px]:overflow-y-auto`}
            tabIndex={0}
            aria-label="Course curriculum"
          >
            <CourseCurriculumSidebar
              courseTitle={course.title}
              modules={modules}
              activeLessonId={activeLesson?._id}
              expandedModules={expandedModules}
              setExpandedModules={setExpandedModules}
              completedLessons={completedLessons}
              onSelect={selectLesson}
              progressSummary={progressSummary}
              hasPaidAccess={hasAccess}
            />
          </aside>
          <section className="min-w-0 px-4 py-6 sm:px-6 min-[900px]:px-8 min-[900px]:py-8 2xl:px-12">
            <div className="mb-5 flex justify-end min-[900px]:hidden">
              <button
                type="button"
                onClick={() => setContentsOpen(true)}
                className="ui-button"
                data-variant="secondary"
                aria-label="Open course contents"
              >
                <Menu className="h-4 w-4" aria-hidden="true" /> Contents
              </button>
            </div>
            <div className="mx-auto w-full min-w-0 max-w-4xl">
              {activeLesson ? (
                <>
                  <CourseBreadcrumbs
                    courseTitle={course.title}
                    courseSlug={slug}
                    lessonTitle={activeLesson.title}
                  />
                  <LessonContent
                    lesson={activeLesson}
                    hasAccess={canAccessActiveLesson}
                    onEnroll={() => void enroll()}
                    enrolling={enrolling}
                  />
                  <LessonNavigation
                    previous={allLessons[activeIndex - 1]}
                    next={allLessons[activeIndex + 1]}
                    canComplete={hasAccess}
                    currentComplete={Boolean(
                      activeLesson &&
                      completedLessons.includes(activeLesson._id),
                    )}
                    completionPending={
                      Boolean(completingLessonId) ||
                      progressLoading ||
                      Boolean(progressError)
                    }
                    onPrevious={() =>
                      allLessons[activeIndex - 1] &&
                      selectLesson(allLessons[activeIndex - 1])
                    }
                    onNext={() =>
                      allLessons[activeIndex + 1] &&
                      selectLesson(allLessons[activeIndex + 1])
                    }
                    onComplete={() => void markComplete()}
                  />
                </>
              ) : (
                <EmptyCourseState />
              )}
              {progressError && (
                <p
                  className="mt-5 rounded-control border border-border bg-surface-subtle px-4 py-3 text-sm text-text-secondary"
                  role="alert"
                >
                  {progressError}
                </p>
              )}
              {progressLoading && (
                <p className="mt-5 text-sm text-text-muted" role="status">
                  Loading course progress…
                </p>
              )}
              {enrollmentMessage && (
                <p className="mt-5 text-sm text-text-secondary" role="status">
                  {enrollmentMessage}
                </p>
              )}
            </div>
          </section>
        </div>

        <CourseContentsDrawer
          open={contentsOpen}
          courseTitle={course.title}
          progressSummary={progressSummary}
          onClose={() => setContentsOpen(false)}
          scrollContainerRef={mobileSidebarRef}
        >
          <CourseCurriculumSidebar
            courseTitle={course.title}
            modules={modules}
            activeLessonId={activeLesson?._id}
            expandedModules={expandedModules}
            setExpandedModules={setExpandedModules}
            completedLessons={completedLessons}
            onSelect={selectLesson}
            progressSummary={progressSummary}
            hasPaidAccess={hasAccess}
            showHeading={false}
          />
        </CourseContentsDrawer>
      </main>
    </>
  );
}

function EmptyCourseState() {
  return (
    <div className="py-16 text-center">
      <BookOpen
        className="mx-auto h-8 w-8 text-brand-primary"
        aria-hidden="true"
      />
      <h2 className="mt-4 text-lg font-semibold text-text-primary">
        Course content is being prepared.
      </h2>
      <p className="mt-2 text-sm text-text-secondary">
        Check back soon for the learning path.
      </p>
    </div>
  );
}
function PageState({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-background px-4 py-12 text-center">
      <div className="rounded-container border border-border bg-surface p-8 shadow-[var(--shadow-sm)]">
        {children}
      </div>
    </main>
  );
}
