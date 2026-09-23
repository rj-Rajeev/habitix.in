import mongoose, { Document, Schema } from "mongoose";

export type CourseStatus = "draft" | "published";

export interface ICourse extends Document {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnail?: string;
  price: number;
  status: CourseStatus;
}

const CourseSchema: Schema<ICourse> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    shortDescription: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    thumbnail: { type: String, trim: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    status: { type: String, enum: ["draft", "published"], default: "draft", required: true },
  },
  { timestamps: true }
);

export default mongoose.models?.Course || mongoose.model<ICourse>("Course", CourseSchema);