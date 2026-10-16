import { AppError } from "@/lib/api";
import { connectDb } from "@/lib/db";
import CourseOverview, {
  type CourseOverviewData,
} from "@/modules/courses/components/CourseOverview";
import CourseDetail from "@/modules/courses/components/CourseDetail";
import { courseCatalogService } from "@/modules/courses/services/course-catalog.service";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

const CANONICAL_ORIGIN = "https://habitix.in";

type PublishedCourseModule = {
  _id: { toString(): string };
  title: string;
  description?: string;
  order: number;
  lessons: Array<{
    _id: { toString(): string };
    lessonSlug?: string;
    title: string;
    description?: string;
    order: number;
    isFree: boolean;
  }>;
};

const loadPublishedCourse = cache(async (slug: string) => {
  await connectDb();
  return courseCatalogService.getPublishedCourseDetail(slug);
});

async function getPublishedCourseOrNotFound(slug: string) {
  try {
    return await loadPublishedCourse(slug);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
}

function normalizeMetadataText(value?: string | null) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function getMetaDescription(
  shortDescription?: string | null,
  description?: string | null,
) {
  const source = [shortDescription, description]
    .map(normalizeMetadataText)
    .find(Boolean) ?? "Explore this course with Habitix.";
  if (source.length <= 160) return source;
  return `${source.slice(0, 157).trimEnd()}...`;
}

function getSafeThumbnail(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return !url.username && !url.password &&
      (url.protocol === "https:" || url.protocol === "http:")
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublishedCourseOrNotFound(slug);
  const course = result.course;
  const courseTitle = normalizeMetadataText(course.title) || "Course";
  const title = `${courseTitle} | Habitix`;
  const description = getMetaDescription(
    course.shortDescription,
    course.description,
  );
  const canonicalUrl = new URL(
    `/courses/${encodeURIComponent(course.slug)}`,
    CANONICAL_ORIGIN,
  ).toString();
  const thumbnail = getSafeThumbnail(course.thumbnail);

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonicalUrl,
      siteName: "Habitix",
      ...(thumbnail ? { images: [thumbnail] } : {}),
    },
    twitter: {
      card: thumbnail ? "summary_large_image" : "summary",
      title,
      description,
      ...(thumbnail ? { images: [thumbnail] } : {}),
    },
  };
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lessonId?: string | string[] }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);

  // Preserve the existing ObjectId-based lesson selection URL.
  if (query.lessonId) return <CourseDetail slug={slug} />;

  const result = await getPublishedCourseOrNotFound(slug);

  const courseOverview: CourseOverviewData = {
    course: {
      id: result.course._id.toString(),
      title: result.course.title,
      slug: result.course.slug,
      shortDescription: result.course.shortDescription,
      description: result.course.description,
      thumbnail: result.course.thumbnail ?? null,
      price: result.course.price,
    },
    modules: result.modules.map((module: PublishedCourseModule) => ({
      id: module._id.toString(),
      title: module.title,
      description: module.description ?? null,
      order: module.order,
      lessons: module.lessons.map((lesson) => ({
        id: lesson._id.toString(),
        lessonSlug: lesson.lessonSlug ?? null,
        title: lesson.title,
        description: lesson.description ?? null,
        order: lesson.order,
        isFree: result.course.price === 0 || lesson.isFree,
      })),
    })),
  };

  return <CourseOverview data={courseOverview} />;
}
