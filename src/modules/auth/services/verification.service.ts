import { createHash, randomBytes } from "crypto";
import type { IUser } from "@/models/User";
import User from "@/models/User";
import { sendEmail } from "@/lib/email/transporter";
import { verificationEmail } from "@/lib/email/templates";

const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueVerificationEmail(user: IUser) {
  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) throw new Error("Application URL is not configured");
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_LIFETIME_MS);
  const staged = await User.updateOne(
    { _id: user._id, emailVerified: false },
    {
      $set: {
        pendingVerificationTokenHash: tokenHash,
        pendingVerificationTokenExpiresAt: expiresAt,
        verificationEmailSentAt: now,
      },
    }
  );
  if (staged.modifiedCount !== 1) return;

  const url = new URL("/verify-email", baseUrl);
  url.searchParams.set("token", token);
  try {
    await sendEmail({ to: user.email, ...verificationEmail(url.toString()) });
  } catch (error) {
    console.error("[auth] Verification email delivery failed");
    await User.updateOne(
      { _id: user._id, pendingVerificationTokenHash: tokenHash },
      { $unset: { pendingVerificationTokenHash: 1, pendingVerificationTokenExpiresAt: 1 } }
    );
    throw error;
  }

  // Activate only after delivery succeeds, leaving the previous active token
  // usable if SMTP fails. The pending token is also accepted during this brief
  // promotion window so a fast click cannot race the database update.
  await User.updateOne(
    { _id: user._id, pendingVerificationTokenHash: tokenHash, emailVerified: false },
    {
      $set: { verificationTokenHash: tokenHash, verificationTokenExpiresAt: expiresAt },
      $unset: { pendingVerificationTokenHash: 1, pendingVerificationTokenExpiresAt: 1 },
    }
  );
}

export async function verifyEmailToken(token: string) {
  if (!/^[a-f\d]{64}$/i.test(token)) return "invalid" as const;
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    $or: [{ verificationTokenHash: tokenHash }, { pendingVerificationTokenHash: tokenHash }],
  }).select("+verificationTokenHash +verificationTokenExpiresAt +pendingVerificationTokenHash +pendingVerificationTokenExpiresAt");
  if (!user) return "invalid" as const;
  const isPending = user.pendingVerificationTokenHash === tokenHash;
  const expiresAt = isPending ? user.pendingVerificationTokenExpiresAt : user.verificationTokenExpiresAt;
  const tokenField = isPending ? "pendingVerificationTokenHash" : "verificationTokenHash";
  if (!expiresAt || expiresAt <= new Date()) {
    await User.updateOne({ _id: user._id, [tokenField]: tokenHash }, {
      $unset: isPending
        ? { pendingVerificationTokenHash: 1, pendingVerificationTokenExpiresAt: 1 }
        : { verificationTokenHash: 1, verificationTokenExpiresAt: 1 },
    });
    return "expired" as const;
  }

  const result = await User.updateOne(
    {
      _id: user._id,
      [tokenField]: tokenHash,
      [isPending ? "pendingVerificationTokenExpiresAt" : "verificationTokenExpiresAt"]: { $gt: new Date() },
      emailVerified: false,
    },
    {
      $set: { emailVerified: true },
      $unset: {
        verificationTokenHash: 1,
        verificationTokenExpiresAt: 1,
        pendingVerificationTokenHash: 1,
        pendingVerificationTokenExpiresAt: 1,
      },
    }
  );
  return result.modifiedCount === 1 ? "verified" as const : "invalid" as const;
}

export async function resendVerificationEmail(email: string) {
  const user = await User.findOne({ email: email.trim().toLowerCase(), provider: "local", emailVerified: false })
    .select("+verificationEmailSentAt +verificationTokenHash +verificationTokenExpiresAt +pendingVerificationTokenHash +pendingVerificationTokenExpiresAt");
  if (!user) return;
  const now = new Date();
  const cutoff = new Date(now.getTime() - 60_000);
  const reserved = await User.updateOne(
    { _id: user._id, emailVerified: false, $or: [{ verificationEmailSentAt: null }, { verificationEmailSentAt: { $lte: cutoff } }] },
    { $set: { verificationEmailSentAt: now } }
  );
  if (reserved.modifiedCount !== 1) return;
  await issueVerificationEmail(user);
}
