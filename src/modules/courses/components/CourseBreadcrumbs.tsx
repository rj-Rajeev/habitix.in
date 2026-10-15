import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function CourseBreadcrumbs({
  courseTitle,
  courseSlug,
  lessonTitle,
}: {
  courseTitle: string;
  courseSlug: string;
  lessonTitle: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-text-muted">
        <li>
          <Link href="/" className="hover:text-brand-primary">
            Home
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        <li>
          <Link href="/courses" className="hover:text-brand-primary">
            Courses
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        <li className="min-w-0 max-w-full">
          <Link
            href={`/courses/${encodeURIComponent(courseSlug)}`}
            className="break-words hover:text-brand-primary"
          >
            {courseTitle}
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        <li
          aria-current="page"
          className="max-w-full break-words font-medium text-text-primary"
        >
          {lessonTitle}
        </li>
      </ol>
    </nav>
  );
}
