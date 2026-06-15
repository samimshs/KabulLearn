import type { NextAuthConfig } from "next-auth";
import type { UserRole, UserStatus } from "@prisma/client";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? "STUDENT";
        token.status = user.status ?? "ACTIVE";
        token.sessionVersion = user.sessionVersion ?? 0;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as UserRole | undefined) ?? "STUDENT";
        session.user.status = (token.status as UserStatus | undefined) ?? "ACTIVE";
        session.user.sessionVersion = typeof token.sessionVersion === "number" ? token.sessionVersion : undefined;
        session.user.sessionInvalid = Boolean(token.sessionInvalid);
      }

      return session;
    }
  },
  providers: []
} satisfies NextAuthConfig;
