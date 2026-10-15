import type { Dispatch, SetStateAction } from "react";
import { BookOpen } from "lucide-react";
import CourseCurriculum from "@/modules/courses/components/CourseCurriculum";
import type {
  CourseModule,
  CourseProgressSummary,
  FlatCourseLesson,
} from "@/modules/courses/components/course-learning.types";

export default function CourseCurriculumSidebar({
  courseTitle,
  modules,
  activeLessonId,
  expandedModules,
  setExpandedModules,
  completedLessons,
  onSelect,
  progressSummary,
  hasPaidAccess,
  showHeading = true,
}: {
  courseTitle: string;
  modules: CourseModule[];
  activeLessonId?: string;
  expandedModules: Record<string, boolean>;
  setExpandedModules: Dispatch<SetStateAction<Record<string, boolean>>>;
  completedLessons: string[];
  onSelect: (lesson: FlatCourseLesson) => void;
  progressSummary: CourseProgressSummary;
  hasPaidAccess: boolean;
  showHeading?: boolean;
}) {
  return (
    <div className="flex min-h-full flex-col p-4">
      {showHeading && (
        <div className="mb-5 border-b border-border pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="mt-1 break-words text-base font-semibold text-text-primary">
                {courseTitle}
              </h2>
            </div>
            <BookOpen
              className="mt-1 h-5 w-5 shrink-0 text-brand-primary"
              aria-hidden="true"
            />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-text-primary">
              Course progress
            </span>
            <span className="text-right text-xs font-semibold text-brand-primary">
              {progressSummary.label}
            </span>
          </div>
          {progressSummary.value !== undefined && (
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-surface-subtle"
              role="progressbar"
              aria-label={`${courseTitle} completion`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressSummary.value}
            >
              <div
                className="h-full rounded-full bg-brand-primary transition-[width] duration-200"
                style={{ width: `${progressSummary.value}%` }}
              />
            </div>
          )}
        </div>
      )}
      <CourseCurriculum
        modules={modules}
        activeLessonId={activeLessonId}
        expandedModules={expandedModules}
        setExpandedModules={setExpandedModules}
        completedLessons={completedLessons}
        onSelect={onSelect}
        hasPaidAccess={hasPaidAccess}
      />
    </div>
  );
}
