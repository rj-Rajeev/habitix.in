import registerUser from "@/modules/auth/repositories/account.repository";
import User from "@/models/User";

type OAuthSignInInput = {
  account?: {
    type: string;
    provider: string;
    access_token?: string;
  } | null;
  email?: string | null;
  profile?: unknown;
};

export async function isVerifiedOAuthSignIn({ account, email, profile }: OAuthSignInInput) {
  if (!account || account.type !== "oauth") return true;

  if (account.provider === "google") {
    return (profile as Record<string, unknown> | undefined)?.email_verified === true;
  }

  if (account.provider !== "github") return false;
  if (!email || !account.access_token) return false;

  const response = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) return false;
  const emails: unknown = await response.json();
  if (!Array.isArray(emails)) return false;

  return emails.some((entry) =>
    entry &&
    typeof entry === "object" &&
    "email" in entry &&
    typeof entry.email === "string" &&
    entry.email.trim().toLowerCase() === email.trim().toLowerCase() &&
    "verified" in entry &&
    entry.verified === true
  );
}

export async function resolveAuthenticatedUser({
  email,
  name,
  provider,
  providerAccountId,
}: {
  email: string;
  name?: string | null;
  provider?: string;
  providerAccountId?: string;
}) {
  const normalizedEmail = email.trim().toLowerCase();

  if (provider !== "google" && provider !== "github") {
    return User.findOne({ email: normalizedEmail });
  }

  const providerId = String(providerAccountId ?? "");
  if (!providerId) throw new Error("OAuth provider did not return an account ID");
  const providerField = provider === "google" ? "googleProviderId" : "githubProviderId";

  // Prefer the provider identity, including records created before the
  // dedicated identity fields existed.
  let dbUser = await User.findOne({
    $or: [
      { [providerField]: providerId },
      { provider, providerId },
    ],
  });
  const emailUser = await User.findOne({ email: normalizedEmail });
  if (dbUser && emailUser && dbUser._id.toString() !== emailUser._id.toString()) {
    throw new Error("OAuth identity and email belong to different accounts");
  }
  dbUser ??= emailUser ?? undefined;

  if (!dbUser) {
    try {
      dbUser = await registerUser({
        email: normalizedEmail,
        fullname: name?.trim() || "User",
        provider,
        providerId,
        googleProviderId: provider === "google" ? providerId : undefined,
        githubProviderId: provider === "github" ? providerId : undefined,
        emailVerified: true,
      });
    } catch (error) {
      // Unique email/provider indexes arbitrate concurrent first logins.
      if ((error as { code?: number }).code !== 11000) throw error;
      const identityOwner = await User.findOne({
        $or: [{ [providerField]: providerId }, { provider, providerId }],
      });
      const emailOwner = await User.findOne({ email: normalizedEmail });
      if (identityOwner && emailOwner && identityOwner._id.toString() !== emailOwner._id.toString()) {
        throw new Error("OAuth identity and email belong to different accounts");
      }
      dbUser = identityOwner ?? emailOwner ?? undefined;
      if (!dbUser) throw error;
    }
  }

  const linkedId = provider === "google" ? dbUser.googleProviderId : dbUser.githubProviderId;
  if (linkedId && linkedId !== providerId) {
    throw new Error("OAuth provider identity is already linked to another account");
  }
  if (dbUser.provider === provider && dbUser.providerId && dbUser.providerId !== providerId && !linkedId) {
    throw new Error("OAuth provider identity conflicts with an existing account link");
  }

  // Conditional update prevents an identity from being transferred if
  // another callback linked it to a different account concurrently.
  const linkedUser = await User.findOneAndUpdate(
    {
      _id: dbUser._id,
      $or: [{ [providerField]: { $exists: false } }, { [providerField]: null }, { [providerField]: providerId }],
    },
    { $set: { [providerField]: providerId, emailVerified: true } },
    { new: true }
  );
  if (linkedUser) return linkedUser;

  const identityOwner = await User.findOne({ [providerField]: providerId });
  if (!identityOwner || identityOwner._id.toString() !== dbUser._id.toString()) {
    throw new Error("OAuth provider identity is already linked to another account");
  }
  return identityOwner;
}
