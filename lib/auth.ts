import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

function hasFacebook() {
  return !!process.env.FACEBOOK_CLIENT_ID && !!process.env.FACEBOOK_CLIENT_SECRET;
}

function hasTwitter() {
  // X/Twitter OAuth 2.0
  return !!process.env.TWITTER_CLIENT_ID && !!process.env.TWITTER_CLIENT_SECRET;
}

function hasGithub() {
  return !!process.env.GITHUB_ID && !!process.env.GITHUB_SECRET;
}

function hasGoogle() {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
}

function hasEmail() {
  return !!process.env.EMAIL_SERVER && !!process.env.EMAIL_FROM;
}

function hasDb() {
  return !!process.env.DATABASE_URL;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "dev-secret",
  session: { strategy: "jwt" },
adapter: hasDb() ? PrismaAdapter(prisma) : undefined,
providers: [

    ...(hasGoogle()
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    ...(hasEmail() && hasDb()
      ? [
          EmailProvider({
            server: process.env.EMAIL_SERVER!,
            from: process.env.EMAIL_FROM!,
          }),
        ]
      : []),
    ...(process.env.DEV_LOGIN_PASSWORD
      ? [
        CredentialsProvider({
          name: "Dev Login",
          credentials: {
            email: { label: "Email", type: "email", placeholder: "tu@correo.com" },
            password: { label: "Password", type: "password" },
          },
          async authorize(credentials) {
            const pass = process.env.DEV_LOGIN_PASSWORD;
            if (!pass) return null;
            const email = (credentials?.email || "").toString().toLowerCase().trim();
            const password = (credentials?.password || "").toString();
            if (!email || password !== pass) return null;
            return { id: email, email, name: email.split("@")[0] };
          },
        }),
      ]
      : []),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist user id into the token
      if (user?.id) token.sub = user.id;
      return token;
    },

    async session({ session, user, token }) {
      // When using JWT strategy, user may not exist; map id if present
      if (session.user) {
        // @ts-expect-error
        session.user.id = user?.id ?? token?.sub ?? undefined;
      }
      return session;
    },
  },
};
