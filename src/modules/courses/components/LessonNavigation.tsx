import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
} from "lucide-react";
import type { FlatCourseLesson } from "@/modules/courses/components/course-learning.types";

export default function LessonNavigation({
  previous,
  next,
  canComplete,
  currentComplete,
  completionPending,
  onPrevious,
  onNext,
  onComplete,
}: {
  previous?: FlatCourseLesson;
  next?: FlatCourseLesson;
  canComplete: boolean;
  currentComplete: boolean;
  completionPending: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
}) {
  return (
    <nav
      className="mt-12 border-t border-border pt-5"
      aria-label="Lesson navigation"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!previous}
          className="ui-button justify-start sm:min-w-36"
          data-variant="ghost"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={!canComplete || currentComplete || completionPending}
          className="ui-button order-first sm:order-none"
          data-variant={currentComplete ? "secondary" : "primary"}
        >
          {currentComplete ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : canComplete ? (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          )}
          {currentComplete
            ? "Completed"
            : completionPending
              ? "Saving…"
              : canComplete
                ? "Mark complete"
                : "Locked"}
        </button>
        {next ? (
          <button
            type="button"
            onClick={onNext}
            className="ui-button justify-end sm:min-w-36"
            data-variant="ghost"
          >
            Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <span className="text-right text-xs text-text-muted sm:min-w-36">
            Course complete
          </span>
        )}
      </div>
    </nav>
  );
}
