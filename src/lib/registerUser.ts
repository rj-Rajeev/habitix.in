// lib/registerUser.ts
import User, { IUser } from "@/models/User";

export interface UserDetails {
  fullname: string;
  email: string;
  password?: string; // Not needed for OAuth users
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
  // Check whether a user already exists with the given email.
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    // Optionally update fields here if needed.
    return existingUser;
  }

  // Create a new user document.
  const newUser = new User({ fullname, email, password, provider, providerId });

  // Save the user record in your database.
  await newUser.save();
  return newUser;
};

export default registerUser;
