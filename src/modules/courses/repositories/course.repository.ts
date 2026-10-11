import Course from "../models/course.model";

export const courseRepository = {
  listPublished() {
    return Course.find({ status: "published", delete: { $ne: true } })
      .select("title slug shortDescription thumbnail price status")
      .sort({ createdAt: -1 });
  },

  findPublishedBySlug(slug: string) {
    return Course.findOne({ slug, status: "published", delete: { $ne: true } });
  },

  findPublishedById(courseId: string) {
    return Course.findOne({ _id: courseId, status: "published", delete: { $ne: true } });
  },

  findPublishedForAccess(courseId: string, session?: import("mongoose").ClientSession) {
    const query = Course.findOne({ _id: courseId, status: "published", delete: { $ne: true } })
      .select("price status");
    if (session) query.session(session);
    return query;
  },

  existsBySlug(slug: string) {
    return Course.exists({ slug });
  },

  listForAdmin() {
    return Course.find({ delete: { $ne: true } }).sort({ createdAt: -1 });
  },

  findForAdmin(courseId: string) {
    return Course.findOne({ _id: courseId, delete: { $ne: true } });
  },

  create(data: Record<string, unknown>, session?: import("mongoose").ClientSession) {
    if (!session) return Course.create(data);
    return Course.create([data], { session }).then(([course]) => course);
  },

  updateById(courseId: string, data: Record<string, unknown>) {
    return Course.findOneAndUpdate(
      { _id: courseId, delete: { $ne: true } },
      data,
      { new: true, runValidators: true }
    );
  },

  updateStatus(courseId: string, status: "draft" | "published") {
    return Course.findOneAndUpdate(
      { _id: courseId, delete: { $ne: true } },
      { status },
      { new: true, runValidators: true }
    );
  },

  deleteById(courseId: string) {
    return Course.findOneAndUpdate(
      { _id: courseId, delete: { $ne: true } },
      { delete: true },
      { new: true }
    );
  },

  deleteImportedCourse(courseId: unknown) {
    return Course.deleteOne({ _id: courseId });
  },
};
