import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, LockKeyhole } from "lucide-react";
import CourseEnrollmentCTA from "@/modules/courses/components/CourseEnrollmentCTA";

export type CourseOverviewData = {
  course: {
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    description: string;
    thumbnail: string | null;
    price: number;
  };
  modules: Array<{
    id: string;
    title: string;
    description: string | null;
    order: number;
    lessons: Array<{
      id: string;
      lessonSlug: string | null;
      title: string;
      description: string | null;
      order: number;
      isFree: boolean;
    }>;
  }>;
};

export default function CourseOverview({ data }: { data: CourseOverviewData }) {
  const { course, modules } = data;
  const firstLesson = modules.flatMap((module) => module.lessons)[0];
  const firstLessonHref = firstLesson
    ? firstLesson.lessonSlug
      ? `/courses/${encodeURIComponent(course.slug)}/${encodeURIComponent(firstLesson.lessonSlug)}`
      : `/courses/${encodeURIComponent(course.slug)}?lessonId=${encodeURIComponent(firstLesson.id)}`
    : null;

  return (
    <main className="min-h-[calc(100vh-80px)] bg-background px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-brand-primary">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/courses" className="hover:text-brand-primary">Courses</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="break-words font-medium text-text-primary">{course.title}</li>
          </ol>
        </nav>

        <section className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)] lg:items-start lg:gap-12">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-primary">Course overview</p>
            <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">{course.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-text-secondary">{course.shortDescription}</p>
            <div className="prose-course mt-7 whitespace-pre-line text-base leading-8 text-text-secondary">{course.description}</div>
          </div>

          <aside className="min-w-0 overflow-hidden rounded-container border border-border bg-surface shadow-[var(--shadow-sm)]">
            <div className="aspect-[16/9] overflow-hidden bg-brand-primary-soft">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={`${course.title} course thumbnail`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-brand-primary"><BookOpen className="h-10 w-10" aria-hidden="true" /></div>
              )}
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-sm font-medium text-text-secondary">Course price</p>
              <p className="mt-1 text-2xl font-semibold text-text-primary">
                {course.price === 0 ? "Free" : `INR ${course.price.toLocaleString("en-IN")}`}
              </p>
              {course.price === 0 ? (
                firstLessonHref ? (
                  <Link href={firstLessonHref} className="ui-button mt-5 w-full no-underline" data-variant="primary">
                    Start learning <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <p className="mt-5 rounded-control bg-surface-subtle px-4 py-3 text-sm text-text-secondary">Lessons are being prepared.</p>
                )
              ) : (
                <CourseEnrollmentCTA
                  courseId={course.id}
                  courseTitle={course.title}
                  overviewHref={`/courses/${encodeURIComponent(course.slug)}`}
                  firstLessonHref={firstLessonHref}
                />
              )}
              <p className="mt-3 text-xs leading-5 text-text-muted">{course.price === 0 ? "Explore the course at no cost." : "Enroll to unlock the full learning experience."}</p>
            </div>
          </aside>
        </section>

        <section className="mt-12 border-t border-border pt-8 sm:mt-16" aria-labelledby="curriculum-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-primary">Learning path</p>
              <h2 id="curriculum-heading" className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">Course curriculum</h2>
            </div>
            <p className="text-sm text-text-secondary">{modules.length} {modules.length === 1 ? "module" : "modules"}</p>
          </div>

          {modules.length ? (
            <ol className="mt-6 space-y-4">
              {modules.map((module) => (
                <li key={module.id} className="rounded-container border border-border bg-surface p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-brand-primary-soft text-sm font-semibold text-brand-primary">{String(module.order).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-text-primary">{module.title}</h3>
                      {module.description && <p className="mt-1 text-sm leading-6 text-text-secondary">{module.description}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-text-muted">{module.lessons.length} {module.lessons.length === 1 ? "lesson" : "lessons"}</span>
                  </div>
                  {module.lessons.length ? (
                    <ol className="mt-4 divide-y divide-border border-t border-border">
                      {module.lessons.map((lesson) => {
                        const content = (
                          <>
                            <span className="min-w-0 flex-1">
                              <span className="block break-words font-medium text-text-primary">{String(lesson.order).padStart(2, "0")} · {lesson.title}</span>
                              {lesson.description && <span className="mt-1 block text-sm leading-6 text-text-secondary">{lesson.description}</span>}
                            </span>
                            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${lesson.isFree ? "bg-brand-primary-soft text-brand-primary" : "bg-surface-subtle text-text-secondary"}`}>
                              {lesson.isFree ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />}
                              {lesson.isFree ? "Free" : "Paid"}
                            </span>
                          </>
                        );

                        return (
                          <li key={lesson.id}>
                            {lesson.lessonSlug ? (
                              <Link href={`/courses/${encodeURIComponent(course.slug)}/${encodeURIComponent(lesson.lessonSlug)}`} className="flex min-h-16 items-center gap-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary">
                                {content}
                              </Link>
                            ) : (
                              <div className="flex min-h-16 items-center gap-4 py-3">{content}</div>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    <p className="mt-4 border-t border-border pt-4 text-sm text-text-muted">Lessons are being prepared.</p>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-6 rounded-container border border-dashed border-border-strong bg-surface-subtle p-6 text-sm text-text-secondary">Course content is being prepared.</p>
          )}
        </section>
      </div>
    </main>
  );
}
