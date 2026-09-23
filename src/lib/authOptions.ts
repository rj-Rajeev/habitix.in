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
        let dbUser = await User.findOne({ email: normalizedEmail });

        if (!dbUser) {
          const provider = account?.provider === "github" ? "github" : account?.provider === "google" ? "google" : "local";
          dbUser = await registerUser({
            email: normalizedEmail,
            fullname: user.name?.trim() || "User",
            provider,
            providerId: account?.provider ? String(account.providerAccountId ?? user.id ?? "") : undefined,
          });
        }

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
