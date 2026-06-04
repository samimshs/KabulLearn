import type { NextAuthConfig } from "next-auth";
import type { UserRole, UserStatus } from "@prisma/client";

export const authConfig = {
  pages: {
    signIn: "/login"
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? "STUDENT";
        token.status = user.status ?? "ACTIVE";
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as UserRole | undefined) ?? "STUDENT";
        session.user.status = (token.status as UserStatus | undefined) ?? "ACTIVE";
      }

      return session;
    }
  },
  providers: []
} satisfies NextAuthConfig;
