import { connectDb } from "@/lib/db";
import CourseCatalog from "@/modules/courses/components/CourseCatalog";
import type { CourseCatalogItem } from "@/modules/courses/components/CourseCatalog";
import { courseCatalogService } from "@/modules/courses/services/course-catalog.service";
import { connection } from "next/server";

export const metadata = {
  title: "Courses | Habitix",
  description: "Explore Habitix courses for steady, practical growth.",
};

export default async function CoursesPage() {
  let initialCourses: CourseCatalogItem[] | undefined;

  try {
    await connection();
    await connectDb();
    const courses = await courseCatalogService.listPublished();
    initialCourses = courses.map((course) => ({
      _id: course._id.toString(),
      title: course.title,
      slug: course.slug,
      shortDescription: course.shortDescription,
      ...(course.thumbnail ? { thumbnail: course.thumbnail } : {}),
      price: course.price,
    }));
  } catch {
    // Keep the existing client fetch and its local error state as a fallback.
  }

  return <CourseCatalog initialCourses={initialCourses} />;
}
