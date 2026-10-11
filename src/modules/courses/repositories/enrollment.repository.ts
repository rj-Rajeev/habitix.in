import type { ClientSession } from "mongoose";
import Enrollment from "../models/enrollment.model";

export const enrollmentRepository = {
  findByUserAndCourse(userId: string, courseId: string) {
    return Enrollment.findOne({ userId, courseId });
  },

  findForUserCourse(userId: string, courseId: string, session?: ClientSession) {
    const query = Enrollment.findOne({ userId, courseId });
    if (session) query.session(session);
    return query;
  },

  findStatusForUser(userId: string, courseId: string) {
    return Enrollment.findOne({ userId, courseId }).select("status paymentStatus enrolledAt");
  },

  listForUser(userId: string) {
    return Enrollment.find({ userId })
      .populate({
        path: "courseId",
        select: "title slug thumbnail price",
        match: { status: "published", delete: { $ne: true } },
      })
      .sort({ enrolledAt: -1 });
  },

  create(data: Record<string, unknown>) {
    return Enrollment.create(data);
  },

  updateById(enrollmentId: string, data: Record<string, unknown>) {
    return Enrollment.findOneAndUpdate({ _id: enrollmentId }, data, { new: true });
  },

  save(enrollment: { save: () => Promise<unknown> }) {
    return enrollment.save();
  },
};
