import CoursePreview from "@/modules/courses/components/admin/CoursePreview";

export default function CoursePreviewPage({ params }: { params: Promise<{ courseId: string }> }) {
  return <CoursePreview params={params} />;
}
