// File: /app/api/send-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, category, message } = body;

  if (!email || !message) {
    return NextResponse.json(
      { message: "Email and message are required." },
      { status: 400 }
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "habitix.in@gmail.com",
        pass: "Rajeevjii@1234", // ⚠️ WARNING: Store this securely in env file
      },
    });

    await transporter.sendMail({
      from: `Habitix <habitix.in@gmail.com>`,
      to: email,
      subject: `Habitix Update - ${category || "No Category"}`,
      text: message,
    });

    return NextResponse.json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("Email error:", err);
    return NextResponse.json(
      { message: "Failed to send email." },
      { status: 500 }
    );
  }
}
