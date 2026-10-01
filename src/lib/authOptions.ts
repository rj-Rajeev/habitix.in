// src/lib/authOptions.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import connectDb from "@/lib/db";
import registerUser from "@/lib/registerUser";
import User from "@/models/User";

const nextAuthSecret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        await connectDb();
        const user = await User.findOne({ email });
        if (!user || !user.password) return null;
        const isValid = await user.comparePassword(password);
        if (!isValid) return null;
        if (user.provider === "local" && user.emailVerified === false) return null;

        return {
          id: user._id.toString(),
          name: user.fullname,
          email: user.email,
        };
      },
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      await connectDb();

      if (user && user.email) {
        const normalizedEmail = user.email.trim().toLowerCase();
        const provider = account?.provider;
        let dbUser;

        if (provider === "google" || provider === "github") {
          const providerId = String(account?.providerAccountId ?? "");
          if (!providerId) throw new Error("OAuth provider did not return an account ID");
          const providerField = provider === "google" ? "googleProviderId" : "githubProviderId";

          // Prefer the provider identity, including records created before the
          // dedicated identity fields existed.
          dbUser = await User.findOne({
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
                fullname: user.name?.trim() || "User",
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
          if (!linkedUser) {
            const identityOwner = await User.findOne({ [providerField]: providerId });
            if (!identityOwner || identityOwner._id.toString() !== dbUser._id.toString()) {
              throw new Error("OAuth provider identity is already linked to another account");
            }
            dbUser = identityOwner;
          } else {
            dbUser = linkedUser;
          }
        } else {
          // Credentials still resolve only by the local email record and retain
          // their established provider/password semantics.
          dbUser = await User.findOne({ email: normalizedEmail });
        }

        if (!dbUser) throw new Error("Habitix user could not be resolved");
        token.sub = dbUser._id.toString();
      }

      if (!token.sub && token.id) {
        token.sub = String(token.id);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub ?? token.id ?? session.user.id) as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
  secret: nextAuthSecret,
};
