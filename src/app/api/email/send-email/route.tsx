// File: /pages/api/send-email.ts (or /app/api/send-email/route.ts for App Router)

import { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, category, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ message: "Email and message are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: 'habitix.in@gmail.com', // e.g., your Gmail address
        pass: 'Rajeevjii@1234', // app password (not your Gmail password)
      },
    });

    await transporter.sendMail({
      from: `Habitix <${'habitix.in@gmail.com'}>`,
      to: email,
      subject: `Habitix Update - ${category}`,
      text: message,
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ message: "Failed to send email." });
  }
}
