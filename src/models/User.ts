import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  fullname: string;
  email: string;
  password?: string;
  provider: "local" | "google" | "github";
  providerId: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Password is required only for local accounts.
    password: {
      type: String,
      required(this: IUser) {
        return this.provider === "local";
      },
    },
    provider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },
    providerId: {
      type: String,
    },
  },
  { timestamps: true }
);

// Pre-save middleware to hash password (only for local auth)
UserSchema.pre<IUser>("save", async function (next) {
  if (this.provider !== "local" || !this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    if (this.password) {
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method for comparing passwords during login.
UserSchema.methods.comparePassword = function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password as string);
};

export default mongoose.models?.User ||
  mongoose.model<IUser>("User", UserSchema);
