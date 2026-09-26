import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { normalizeSlug } from "@/lib/courses";
import { getOptionalUserId } from "@/lib/auth/session";
import Course from "@/models/Course";
import CourseModule from "@/models/CourseModule";
import CourseLesson from "@/models/CourseLesson";
import Enrollment from "@/models/Enrollment";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await connectDb();
    const { courseId: slug } = await params;
    const course = await Course.findOne({ slug: normalizeSlug(slug), status: "published", delete: { $ne: true } });
    if (!course) throw Errors.notFound("Course");

    const userId = await getOptionalUserId();
    const hasPaidAccess = course.price === 0 || Boolean(
      userId && await Enrollment.exists({
        userId,
        courseId: course._id,
        status: "active",
        paymentStatus: "paid",
      })
    );

    const modules = await CourseModule.find({ courseId: course._id }).sort({ order: 1, createdAt: 1 });
    const lessons = await CourseLesson.find({ moduleId: { $in: modules.map((module) => module._id) } })
      .sort({ order: 1, createdAt: 1 });

    return jsonOk({
      course,
      modules: modules.map((module) => ({
        ...module.toObject(),
        lessons: lessons
          .filter((lesson) => lesson.moduleId.toString() === module._id.toString())
          .map((lesson) => hasPaidAccess || lesson.isFree
            ? lesson
            : {
                _id: lesson._id,
                moduleId: lesson.moduleId,
                title: lesson.title,
                description: lesson.description,
                order: lesson.order,
                isFree: lesson.isFree,
              }),
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
