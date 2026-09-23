import CourseDetail from "@/components/courses/CourseDetail";

export const metadata = {
  title: "Course | Habitix",
  description: "Learn with Habitix courses.",
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CourseDetail slug={slug} />;
}
