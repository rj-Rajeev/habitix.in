import CourseDetail from "@/modules/courses/components/CourseDetail";

export const metadata = {
  title: "Course Lesson | Habitix",
  description: "Learn with Habitix courses.",
};

export default async function CourseLessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug, lessonSlug } = await params;
  return <CourseDetail slug={slug} lessonSlug={lessonSlug} />;
}
