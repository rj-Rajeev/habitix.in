"use client";

import type { Dispatch, SetStateAction } from "react";
import { Check, CheckCircle2, ChevronDown, LockKeyhole } from "lucide-react";
import type {
  CourseModule,
  FlatCourseLesson,
} from "@/modules/courses/components/course-learning.types";

export default function CourseCurriculum({
  modules,
  activeLessonId,
  expandedModules,
  setExpandedModules,
  completedLessons,
  onSelect,
  hasPaidAccess,
}: {
  modules: CourseModule[];
  activeLessonId?: string;
  expandedModules: Record<string, boolean>;
  setExpandedModules: Dispatch<SetStateAction<Record<string, boolean>>>;
  completedLessons: string[];
  onSelect: (lesson: FlatCourseLesson) => void;
  hasPaidAccess: boolean;
}) {
  return (
    <div className="space-y-2">
      {modules.map((module) => {
        const expanded = expandedModules[module._id] ?? false;
        const completed = module.lessons.filter((lesson) =>
          completedLessons.includes(lesson._id),
        ).length;
        return (
          <section key={module._id}>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-control px-2 py-2 text-left hover:bg-surface-subtle"
              onClick={() =>
                setExpandedModules((current) => ({
                  ...current,
                  [module._id]: !expanded,
                }))
              }
              aria-expanded={expanded}
              aria-controls={`module-${module._id}`}
            >
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${expanded ? "rotate-0" : "-rotate-90"}`}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-text-primary">
                  {String(module.order).padStart(2, "0")} {module.title}
                </span>
                <span className="mt-0.5 block text-xs text-text-muted">
                  {completed}/{module.lessons.length} complete
                </span>
              </span>
            </button>
            {expanded && (
              <div
                id={`module-${module._id}`}
                className="ml-3 border-l border-border pl-3"
              >
                {module.lessons.map((lesson) => {
                  const lessonLocked = !hasPaidAccess && !lesson.isFree;
                  const lessonSelected = activeLessonId === lesson._id;
                  return (
                    <button
                      type="button"
                      key={lesson._id}
                      data-lesson-id={lesson._id}
                      onClick={() =>
                        onSelect({
                          ...lesson,
                          moduleTitle: module.title,
                          moduleOrder: module.order,
                        })
                      }
                      className={`flex w-full items-start gap-2 rounded-control px-2 py-2 text-left text-sm ${lessonSelected ? "bg-brand-primary-soft font-semibold text-brand-primary" : "text-text-secondary hover:bg-surface-subtle"}`}
                      aria-current={lessonSelected ? "page" : undefined}
                    >
                      {lessonSelected ? (
                        <span
                          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-brand-primary bg-brand-primary"
                          aria-hidden="true"
                        >
                          {lessonLocked ? (
                            <LockKeyhole className="h-2.5 w-2.5 text-white" />
                          ) : completedLessons.includes(lesson._id) ? (
                            <Check className="h-2.5 w-2.5 text-white" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </span>
                      ) : lessonLocked ? (
                        <LockKeyhole
                          className="mt-0.5 h-4 w-4 shrink-0 text-text-muted"
                          aria-label="Preview; enrollment required"
                        />
                      ) : completedLessons.includes(lesson._id) ? (
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary"
                          aria-label="Completed"
                        />
                      ) : (
                        <span
                          className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-border-strong"
                          aria-hidden="true"
                        />
                      )}
                      <span className="min-w-0 break-words">{lesson.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
