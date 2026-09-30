// File: /app/api/send-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { requireAdminUser } from "@/lib/auth/admin";
import { AppError, handleRouteError } from "@/lib/api";

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

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT);
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    if (!host || !Number.isInteger(port) || port <= 0 || !user || !password) {
      return NextResponse.json(
        { message: "Email service is not configured." },
        { status: 503 }
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password },
    });

    await transporter.sendMail({
      from: user,
      to: email,
      subject: `Habitix Update - ${category || "No Category"}`,
      text: message,
    });

    return NextResponse.json({ message: "Email sent successfully" });
  } catch (error) {
    if (error instanceof AppError) {
      return handleRouteError(error);
    }
    return NextResponse.json(
      { message: "Failed to send email." },
      { status: 500 }
    );
  }
}
