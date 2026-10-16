import { AppError } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { getOptionalUserId } from "@/lib/auth/session";
import CourseOverview, {
  type CourseOverviewData,
} from "@/modules/courses/components/CourseOverview";
import CourseDetail, {
  type CourseDetailInitialData,
} from "@/modules/courses/components/CourseDetail";
import { courseCatalogService } from "@/modules/courses/services/course-catalog.service";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

const CANONICAL_ORIGIN = "https://habitix.in";

type PublishedCourseModule = {
  _id: { toString(): string };
  title: string;
  description?: string;
  order: number;
  lessons: Array<{
    _id: { toString(): string };
    moduleId: { toString(): string };
    lessonSlug?: string;
    title: string;
    description?: string;
    order: number;
    isFree: boolean;
    markdownContent?: string;
    videoUrl?: string;
    pdfUrl?: string;
  }>;
};

const loadPublishedCourse = cache(async (slug: string, userId: string | null = null) => {
  await connectDb();
  return courseCatalogService.getPublishedCourseDetail(slug, userId ?? undefined);
});

async function getPublishedCourseOrNotFound(slug: string, userId: string | null = null) {
  try {
    return await loadPublishedCourse(slug, userId);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
}

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
    modules: result.modules.map((courseModule: PublishedCourseModule) => ({
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

function getCanonicalCourseUrl(courseSlug: string) {
  return new URL(
    `/courses/${encodeURIComponent(courseSlug)}`,
    CANONICAL_ORIGIN,
  ).toString();
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lessonId?: string | string[] }>;
}): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const result = await getPublishedCourseOrNotFound(slug);
  const course = result.course;
  const courseTitle = normalizeMetadataText(course.title) || "Course";
  const title = `${courseTitle} | Habitix`;
  const description = getMetaDescription(
    course.shortDescription,
    course.description,
  );
  const canonicalUrl = getCanonicalCourseUrl(course.slug);
  const thumbnail = getSafeThumbnail(course.thumbnail);

  const metadata: Metadata = {
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

  if (typeof query.lessonId === "string" && query.lessonId) {
    const lesson = result.modules
      .flatMap((courseModule) => courseModule.lessons)
      .find((courseLesson) => courseLesson._id.toString() === query.lessonId);

    if (lesson && !lesson.lessonSlug) {
      return { ...metadata, robots: { index: false, follow: true } };
    }
  }

  return metadata;
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lessonId?: string | string[] }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);

  // Preserve the ObjectId-based lesson selection URL while validating it server-side.
  if (query.lessonId !== undefined) {
    if (typeof query.lessonId !== "string" || !query.lessonId) notFound();

    const userId = await getOptionalUserId();
    const result = await getPublishedCourseOrNotFound(slug, userId);
    const lesson = result.modules
      .flatMap((courseModule) => courseModule.lessons)
      .find((courseLesson) => courseLesson._id.toString() === query.lessonId);

    if (!lesson) notFound();
    if (lesson.lessonSlug) {
      redirect(
        `/courses/${encodeURIComponent(result.course.slug)}/${encodeURIComponent(lesson.lessonSlug)}`,
      );
    }

    return (
      <CourseDetail
        slug={slug}
        legacyLessonIdentifier={query.lessonId}
        initialData={toCourseDetailInitialData(result)}
      />
    );
  }

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

  const canonicalUrl = getCanonicalCourseUrl(result.course.slug);
  const thumbnail = getSafeThumbnail(result.course.thumbnail);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: courseOverview.course.title,
    description: getMetaDescription(
      courseOverview.course.shortDescription,
      courseOverview.course.description,
    ),
    url: canonicalUrl,
    ...(thumbnail ? { image: thumbnail } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <CourseOverview data={courseOverview} />
    </>
  );
}
