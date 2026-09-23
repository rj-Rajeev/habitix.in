import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICourseModule extends Document {
  courseId: Types.ObjectId;
  title: string;
  description?: string;
  order: number;
}

const CourseModuleSchema: Schema<ICourseModule> = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    order: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models?.CourseModule || mongoose.model<ICourseModule>("CourseModule", CourseModuleSchema);