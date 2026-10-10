// Persist a new local or OAuth account.
import User, { IUser } from "@/models/User";

export interface UserDetails {
  fullname: string;
  email: string;
  password?: string;
  provider?: "local" | "google" | "github";
  providerId?: string;
  googleProviderId?: string;
  githubProviderId?: string;
  emailVerified?: boolean;
}

const registerUser = async ({
  fullname,
  email,
  password,
  provider = "local",
  providerId,
  googleProviderId,
  githubProviderId,
  emailVerified,
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
    googleProviderId,
    githubProviderId,
    role: "user",
    emailVerified: emailVerified ?? provider !== "local",
  });

  await newUser.save();
  return newUser;
};

export default registerUser;
