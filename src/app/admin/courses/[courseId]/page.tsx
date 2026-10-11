import CourseBuilder from "@/modules/courses/components/admin/CourseBuilder";

export const metadata = {
  title: "Course Builder | Habitix Admin",
  description: "Build Habitix course content.",
};

export default async function CourseBuilderPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return <CourseBuilder courseId={courseId} />;
}
