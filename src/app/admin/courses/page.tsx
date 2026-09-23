import CourseManagement from "@/components/admin/CourseManagement";

export const metadata = {
  title: "Courses | Habitix Admin",
  description: "Manage Habitix courses.",
};

export default function AdminCoursesPage() {
  return <CourseManagement />;
}
