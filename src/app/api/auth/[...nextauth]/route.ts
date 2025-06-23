// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import connectDb from "@/lib/db";
import registerUser from "@/lib/registerUser";
import User from "@/models/User";

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials ?? {};

        // Verify that email and password are provided.
        if (!email || !password) return null;

        // Ensure connection to the database.
        await connectDb();

        // Find a user with the given email.
        const user = await User.findOne({ email });
        if (!user || !user.password) return null;

        // Use comparePassword method from the User model.
        const isValid = await user.comparePassword(password);
        if (!isValid) return null;

        // Return basic user information.
        return {
          id: user._id.toString(),
          name: user.fullname,
          email: user.email,
        };
      },
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Ensure database connection.
      await connectDb();

      try {
        // Save or update the OAuth user using your custom registerUser function.
        await registerUser({
          fullname: user.name || "OAuth User", // Fallback if name is missing.
          email: user.email!,
          // No password is provided for OAuth users.
          provider: account?.provider as "google" | "github",
          providerId: String(account?.id),
        });
        return true;
      } catch (error) {
        console.error("Error registering OAuth user:", error);
        return false;
      }
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
