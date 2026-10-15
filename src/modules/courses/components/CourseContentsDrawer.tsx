import type { ReactNode, Ref } from "react";
import { X } from "lucide-react";
import type { CourseProgressSummary } from "@/modules/courses/components/course-learning.types";
import styles from "@/modules/courses/components/CourseDetail.module.css";

export default function CourseContentsDrawer({
  open,
  courseTitle,
  progressSummary,
  onClose,
  scrollContainerRef,
  children,
}: {
  open: boolean;
  courseTitle: string;
  progressSummary: CourseProgressSummary;
  onClose: () => void;
  scrollContainerRef: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 top-20 z-[1200] min-[900px]:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/30 opacity-100 transition-opacity duration-200 motion-reduce:transition-none"
        onClick={onClose}
        aria-label="Close course contents"
      />
      <aside
        className="absolute right-0 top-0 flex h-full w-[min(92vw,380px)] max-w-full flex-col bg-surface shadow-[var(--shadow-md)] animate-[course-drawer-in_220ms_ease-out] motion-reduce:animate-none"
        role="dialog"
        aria-modal="true"
        aria-label="Course contents"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4">
          <div>
            <h2 className="max-w-[240px] truncate font-semibold text-text-primary">
              {courseTitle}
            </h2>
            <p className="mt-1 text-xs text-text-muted" role="status">
              {progressSummary.label}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 shrink-0 rounded-control p-2 text-text-muted hover:bg-surface-subtle"
            aria-label="Close course contents"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div
          ref={scrollContainerRef}
          className={`${styles.curriculumScroll} min-h-0 flex-1 overflow-y-auto`}
          tabIndex={0}
          role="region"
          aria-label="Course curriculum"
        >
          {children}
        </div>
      </aside>
    </div>
  );
}
