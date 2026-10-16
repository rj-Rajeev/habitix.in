import { AppError } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { getOptionalUserId } from "@/lib/auth/session";
import { courseCatalogService } from "@/modules/courses/services/course-catalog.service";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import CourseDetail, {
  type CourseDetailInitialData,
} from "@/modules/courses/components/CourseDetail";

const fallbackMetadata: Metadata = {
  title: "Course Lesson | Habitix",
  description: "Learn with Habitix courses.",
};

type PublishedCourseLesson = {
  _id: { toString(): string };
  lessonSlug?: string;
  moduleId: { toString(): string };
  title: string;
  description?: string;
  order: number;
  markdownContent?: string;
  videoUrl?: string;
  pdfUrl?: string;
  isFree?: boolean;
};

type PublishedCourseDetail = {
  course: {
    _id: { toString(): string };
    title: string;
    slug: string;
    shortDescription: string;
    description: string;
    thumbnail?: string;
    price: number;
  };
  modules: Array<{
    _id: { toString(): string };
    title: string;
    description?: string;
    order: number;
    lessons: PublishedCourseLesson[];
  }>;
};

const loadPublishedCourse = cache(
  async (slug: string, userId: string | null): Promise<PublishedCourseDetail> => {
    await connectDb();
    return courseCatalogService.getPublishedCourseDetail(slug, userId ?? undefined);
  },
);

function toCourseDetailInitialData(
  result: Awaited<ReturnType<typeof loadPublishedCourse>>,
): CourseDetailInitialData {
  return {
    course: {
      _id: result.course._id.toString(),
      title: result.course.title,
      slug: result.course.slug,
      shortDescription: result.course.shortDescription,
      description: result.course.description,
      ...(result.course.thumbnail ? { thumbnail: result.course.thumbnail } : {}),
      price: result.course.price,
      status: "published",
    },
    modules: result.modules.map((courseModule) => ({
      _id: courseModule._id.toString(),
      title: courseModule.title,
      ...(courseModule.description
        ? { description: courseModule.description }
        : {}),
      order: courseModule.order,
      lessons: courseModule.lessons.map((lesson) => ({
        _id: lesson._id.toString(),
        ...(lesson.lessonSlug ? { lessonSlug: lesson.lessonSlug } : {}),
        moduleId: lesson.moduleId.toString(),
        title: lesson.title,
        ...(lesson.description ? { description: lesson.description } : {}),
        order: lesson.order,
        ...(lesson.markdownContent !== undefined
          ? { markdownContent: lesson.markdownContent }
          : {}),
        ...(lesson.videoUrl !== undefined ? { videoUrl: lesson.videoUrl } : {}),
        ...(lesson.pdfUrl !== undefined ? { pdfUrl: lesson.pdfUrl } : {}),
        ...(lesson.isFree !== undefined ? { isFree: lesson.isFree } : {}),
      })),
    })),
  };
}

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
    const userId = await getOptionalUserId();
    const { course, modules } = await loadPublishedCourse(slug, userId);
    const lesson = modules
      .flatMap((module) => module.lessons)
      .find((candidate) => candidate.lessonSlug === lessonSlug);
    if (!lesson?.lessonSlug) return fallbackMetadata;

    const lessonTitle = normalizeMetadataText(lesson.title) || "Lesson";
    const courseTitle = normalizeMetadataText(course.title) || "Course";
    const canonicalUrl = new URL(
      `/courses/${encodeURIComponent(course.slug)}/${encodeURIComponent(lesson.lessonSlug)}`,
      "https://habitix.in",
    ).toString();

    return {
      title: `${lessonTitle} | ${courseTitle} | Habitix`,
      description: getMetaDescription(
        lesson.description,
        course.shortDescription,
        course.description,
      ),
      alternates: { canonical: canonicalUrl },
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
  const userId = await getOptionalUserId();

  let result: Awaited<ReturnType<typeof loadPublishedCourse>>;
  try {
    result = await loadPublishedCourse(slug, userId);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }

  const lessonExists = result.modules.some((courseModule) =>
    courseModule.lessons.some((lesson) => lesson.lessonSlug === lessonSlug),
  );
  if (!lessonExists) notFound();

  return (
    <CourseDetail
      slug={slug}
      lessonSlug={lessonSlug}
      initialData={toCourseDetailInitialData(result)}
    />
  );
}
