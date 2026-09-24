import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { requireUserId } from "@/lib/auth/session";
import { Errors } from "@/lib/api/errors";
import { handleRouteError } from "@/lib/api/handle-route";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await dbConnect();
    const userId = await requireUserId();
    const { userId: targetUserId } = await params;

    if (targetUserId !== userId) {
      throw Errors.forbidden();
    }

    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw Errors.badRequest("Invalid input");
    }

    const currentPassword =
      typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword =
      typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) {
      throw Errors.badRequest("Current password and new password are required");
    }

    if (newPassword.length < 6) {
      throw Errors.badRequest("New password must be at least 6 characters long");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw Errors.notFound("User");
    }

    if (user.provider !== "local") {
      throw Errors.badRequest("Password update is only available for local accounts");
    }

    const matches = await user.comparePassword(currentPassword);
    if (!matches) {
      throw Errors.badRequest("Current password is incorrect");
    }

    user.password = newPassword;
    await user.save();

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    return handleRouteError(error);
  }
}
