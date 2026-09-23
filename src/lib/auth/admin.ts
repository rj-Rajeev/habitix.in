import { Errors } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import User from "@/models/User";

export async function requireAdminUser(): Promise<string> {
  const userId = await requireUserId();
  await connectDb();

  const user = await User.findById(userId).select("role");
  if (!user || user.role !== "admin") {
    throw Errors.forbidden();
  }

  return userId;
}