import { handleRouteError, jsonOk } from "@/lib/api";
import { connectDb } from "@/lib/db";
import Course from "@/models/Course";

export async function GET() {
  try {
    await connectDb();
    const courses = await Course.find({ status: "published", delete: { $ne: true } })
      .select("title slug shortDescription thumbnail price status")
      .sort({ createdAt: -1 });
    return jsonOk(courses);
  } catch (error) {
    return handleRouteError(error);
  }
}
