import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string; // from authorize() or db
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}