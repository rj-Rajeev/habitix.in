import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { AppError, Errors } from "@/lib/api";

export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    throw Errors.unauthorized();
  }
  return userId;
}

export async function getOptionalUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
