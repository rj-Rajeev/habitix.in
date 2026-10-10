import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { resendVerificationEmail } from "@/modules/auth/services/verification.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    await connectDb();
    if (email) await resendVerificationEmail(email);
  } catch {
    // Keep the response generic to avoid exposing whether an account exists.
  }
  return NextResponse.json({ message: "If the account needs verification, a new link will be sent shortly." });
}
