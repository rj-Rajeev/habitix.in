import connectDb from "@/lib/db";
import User from "@/models/User";

export async function authorizeCredentials(
  credentials?: { email?: string; password?: string }
) {
  const email = credentials?.email?.trim().toLowerCase();
  const password = credentials?.password;
  if (!email || !password) return null;

  await connectDb();
  const user = await User.findOne({ email });
  if (!user || !user.password) return null;
  const isValid = await user.comparePassword(password);
  if (!isValid) return null;
  if (user.provider === "local" && user.emailVerified === false) return null;

  return {
    id: user._id.toString(),
    name: user.fullname,
    email: user.email,
  };
}
