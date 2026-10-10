// NextAuth configuration and framework callback wiring.
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import connectDb from "@/lib/db";
import { authorizeCredentials } from "@/modules/auth/services/credentials.service";
import {
  isVerifiedOAuthSignIn,
  resolveAuthenticatedUser,
} from "@/modules/auth/services/oauth.service";

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
        return authorizeCredentials(credentials);
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
    async signIn({ user, account, profile }) {
      return isVerifiedOAuthSignIn({ account, email: user.email, profile });
    },
    async jwt({ token, user, account }) {
      await connectDb();

      if (user && user.email) {
        const dbUser = await resolveAuthenticatedUser({
          email: user.email,
          name: user.name,
          provider: account?.provider,
          providerAccountId: account?.providerAccountId,
        });
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
