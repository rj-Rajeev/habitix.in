import mongoose, { Document, Schema, Types } from "mongoose";

export type EnrollmentStatus = "active" | "pending" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface IEnrollment extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  status: EnrollmentStatus;
  paymentStatus: PaymentStatus;
  paymentProvider?: string;
  paymentOrderId?: string;
  paymentId?: string;
  enrolledAt: Date;
}

const EnrollmentSchema: Schema<IEnrollment> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    status: { type: String, enum: ["active", "pending", "cancelled"], required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], required: true },
    paymentProvider: { type: String, trim: true },
    paymentOrderId: { type: String, trim: true },
    paymentId: { type: String, trim: true },
    enrolledAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.models?.Enrollment || mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema);