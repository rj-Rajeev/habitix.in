import { AppError } from "@/lib/api";
import { connectDb } from "@/lib/db";
import CourseOverview, {
  type CourseOverviewData,
} from "@/modules/courses/components/CourseOverview";
import CourseDetail from "@/modules/courses/components/CourseDetail";
import { courseCatalogService } from "@/modules/courses/services/course-catalog.service";
import { notFound } from "next/navigation";

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

export const metadata = {
  title: "Course | Habitix",
  description: "Learn with Habitix courses.",
};

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

  await connectDb();

  let result: Awaited<
    ReturnType<typeof courseCatalogService.getPublishedCourseDetail>
  >;
  try {
    result = await courseCatalogService.getPublishedCourseDetail(slug);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }

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
