// lib/registerUser.ts
import User, { IUser } from "@/models/User";

export interface UserDetails {
  fullname: string;
  email: string;
  password?: string;
  provider?: "local" | "google" | "github";
  providerId?: string;
}

const registerUser = async ({
  fullname,
  email,
  password,
  provider = "local",
  providerId,
}: UserDetails): Promise<IUser> => {
  const normalizedFullname = fullname.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedFullname) {
    const error = new Error("Fullname is required");
    error.cause = "VALIDATION";
    throw error;
  }

  if (!normalizedEmail) {
    const error = new Error("Email is required");
    error.cause = "VALIDATION";
    throw error;
  }

  if (provider === "local" && !password) {
    const error = new Error("Password is required");
    error.cause = "VALIDATION";
    throw error;
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error("User already exists");
    error.cause = "CONFLICT";
    throw error;
  }

  const newUser = new User({
    fullname: normalizedFullname,
    email: normalizedEmail,
    password,
    provider,
    providerId,
    role: "user",
  });

  await newUser.save();
  return newUser;
};

export default registerUser;
