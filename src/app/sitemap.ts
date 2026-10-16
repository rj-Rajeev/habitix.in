import { unstable_cache } from "next/cache";
import { connection } from "next/server";
import { connectDb } from "@/lib/db";
import { courseCatalogService } from "@/modules/courses/services/course-catalog.service";

const CANONICAL_ORIGIN = "https://habitix.in";

const getPublishedCourseSitemapEntries = unstable_cache(
  async () => {
    await connectDb();
    return courseCatalogService.listPublishedSitemapEntries();
  },
  ["published-course-sitemap-v1"],
  { revalidate: 3600 },
);

export default async function sitemap() {
  await connection();

  const courses = await getPublishedCourseSitemapEntries();
  const urls = new Map<string, { url: string }>();

  for (const course of courses) {
    const coursePath = `/courses/${encodeURIComponent(course.courseSlug)}`;
    const courseUrl = new URL(coursePath, CANONICAL_ORIGIN).toString();
    urls.set(courseUrl, { url: courseUrl });

    for (const lessonSlug of course.lessonSlugs) {
      const lessonPath = `${coursePath}/${encodeURIComponent(lessonSlug)}`;
      const lessonUrl = new URL(lessonPath, CANONICAL_ORIGIN).toString();
      urls.set(lessonUrl, { url: lessonUrl });
    }
  }

  return [...urls.values()];
}
