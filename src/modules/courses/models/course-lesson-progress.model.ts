import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICourseLessonProgress extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId: Types.ObjectId;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CourseLessonProgressSchema: Schema<ICourseLessonProgress> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: "CourseLesson", required: true },
    completedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

CourseLessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

export default mongoose.models?.CourseLessonProgress ||
  mongoose.model<ICourseLessonProgress>("CourseLessonProgress", CourseLessonProgressSchema);
