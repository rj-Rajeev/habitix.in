import NextAuth from "next-auth/next";
import { authOptions } from "@/modules/auth/config/next-auth-options";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
