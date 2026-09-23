import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { requireUserId } from "@/lib/auth/session";
import { Errors } from "@/lib/api/errors";
import { handleRouteError } from "@/lib/api/handle-route";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await dbConnect();
    const userId = await requireUserId();
    const { userId: targetUserId } = await params;

    if (targetUserId !== userId) {
      throw Errors.forbidden();
    }

    const user = await User.findById(userId).select("_id fullname email role");

    if (!user) {
      throw Errors.notFound("User");
    }

    return NextResponse.json({
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      role: user.role ?? "user",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

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

    const fields = Object.keys(body);
    if (fields.some((field) => field !== "fullname")) {
      throw Errors.badRequest("Only fullname can be updated");
    }

    if (typeof body.fullname !== "string") {
      throw Errors.badRequest("Fullname must be a string");
    }

    const fullname = body.fullname.trim();

    if (!fullname) {
      throw Errors.badRequest("Fullname is required");
    }

    if (fullname.length > 100) {
      throw Errors.badRequest("Fullname must be 100 characters or fewer");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw Errors.notFound("User");
    }

    user.fullname = fullname;
    await user.save();

    return NextResponse.json({
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}