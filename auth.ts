import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { z } from "zod";
import { UserRole, UserStatus } from "@prisma/client";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8)
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt"
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: parsed.data.email }
        });

        if (!user?.passwordHash) {
          return null;
        }

        const validPassword = await compare(parsed.data.password, user.passwordHash);

        if (!validPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: null,
          role: user.role,
          status: user.status
        };
      }
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await db.user.update({
          where: { email: user.email.toLowerCase() },
          data: {
            status: UserStatus.ACTIVE,
            emailVerified: new Date()
          }
        }).catch(() => null);
      }

      return true;
    },
    async jwt({ token, user }) {
      delete token.picture;

      if (user) {
        token.role = user.role ?? UserRole.STUDENT;
        token.status = user.status ?? UserStatus.ACTIVE;
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;
      } else if (token.email) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email.toLowerCase() },
          select: { role: true, status: true, name: true }
        }).catch(() => null);

        if (dbUser) {
          token.role = dbUser.role;
          token.status = dbUser.status;
          if (dbUser.name) token.name = dbUser.name;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as UserRole | undefined) ?? UserRole.STUDENT;
        session.user.status = (token.status as UserStatus | undefined) ?? UserStatus.ACTIVE;
        session.user.image = null;
      }

      return session;
    }
  }
});
