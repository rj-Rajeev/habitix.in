import { handleRouteError, jsonOk } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { courseCatalogService } from "@/modules/courses/services/course-catalog.service";

export async function GET() {
  try {
    await connectDb();
    const courses = await courseCatalogService.listPublished();
    return jsonOk(courses);
  } catch (error) {
    return handleRouteError(error);
  }
}
