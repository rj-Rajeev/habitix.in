import { connectDb } from "@/lib/db";
import { courseCatalogService } from "@/modules/courses/services/course-catalog.service";
import type { Metadata } from "next";
import CourseDetail from "@/modules/courses/components/CourseDetail";

const fallbackMetadata: Metadata = {
  title: "Course Lesson | Habitix",
  description: "Learn with Habitix courses.",
};

function normalizeMetadataText(value?: string | null) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function getMetaDescription(
  lessonDescription?: string | null,
  shortDescription?: string | null,
  description?: string | null,
) {
  const source = [lessonDescription, shortDescription, description]
    .map(normalizeMetadataText)
    .find(Boolean) ?? "Explore this course with Habitix.";
  if (source.length <= 160) return source;
  return `${source.slice(0, 157).trimEnd()}...`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}): Promise<Metadata> {
  const { slug, lessonSlug } = await params;

  try {
    await connectDb();
    const { course, modules } = await courseCatalogService.getPublishedCourseDetail(slug);
    const lesson = modules
      .flatMap((module) => module.lessons)
      .find((candidate) => candidate.lessonSlug === lessonSlug);
    if (!lesson) return fallbackMetadata;

    const lessonTitle = normalizeMetadataText(lesson.title) || "Lesson";
    const courseTitle = normalizeMetadataText(course.title) || "Course";

    return {
      title: `${lessonTitle} | ${courseTitle} | Habitix`,
      description: getMetaDescription(
        lesson.description,
        course.shortDescription,
        course.description,
      ),
    };
  } catch {
    // Metadata lookup must not replace the lesson page's existing unavailable state.
    return fallbackMetadata;
  }
}

export default async function CourseLessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug, lessonSlug } = await params;
  return <CourseDetail slug={slug} lessonSlug={lessonSlug} />;
}
