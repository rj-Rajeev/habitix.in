// File: /app/api/send-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/admin";
import { AppError, handleRouteError } from "@/lib/api";
import { sendEmail } from "@/lib/email/transporter";

export async function POST(req: NextRequest) {
  try {
    await requireAdminUser();

    const body = await req.json();
    const { email, category, message } = body;

    if (!email || !message) {
      return NextResponse.json(
        { message: "Email and message are required." },
        { status: 400 }
      );
    }

    await sendEmail({ to: email, subject: `Habitix Update - ${category || "No Category"}`, text: message });

    return NextResponse.json({ message: "Email sent successfully" });
  } catch (error) {
    if (error instanceof AppError) {
      return handleRouteError(error);
    }
    if (error instanceof Error && error.message === "Email service is not configured") {
      return NextResponse.json({ message: "Email service is not configured." }, { status: 503 });
    }
    return NextResponse.json(
      { message: "Failed to send email." },
      { status: 500 }
    );
  }
}
