import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | undefined;

export function getEmailTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!host || !Number.isInteger(port) || port <= 0 || !user || !password) {
    throw new Error("Email service is not configured");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
  });
  return transporter;
}

export async function sendEmail({ to, subject, text, html }: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const user = process.env.SMTP_USER;
  if (!user) throw new Error("Email service is not configured");
  await getEmailTransporter().sendMail({ from: user, to, subject, text, html });
}
