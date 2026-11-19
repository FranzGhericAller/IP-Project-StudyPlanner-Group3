import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validators";
import Google from "next-auth/providers/google";

// Auth.js (NextAuth v5) setup. AUTH_SECRET is read from .env
export const { handlers, auth, signIn, signOut } = NextAuth({



  events: {
    // keep Google tokens + scopes fresh on every Google sign-in
    async signIn({ account }) {
      if (account?.provider !== "google") return;
      await prisma.account.updateMany({
        where: { provider: "google", providerAccountId: account.providerAccountId },
        data: {
          access_token: account.access_token,
          refresh_token: account.refresh_token ?? undefined, // undefined = leave as is
          expires_at: account.expires_at,
          scope: account.scope,
          id_token: account.id_token,
        },
      });
    },
  },

  // lets Auth.js save Google accounts in our db once we add Google login
  adapter: PrismaAdapter(prisma),

  // login is kept in a signed cookie (JWT). email/pw login needs this
  session: { strategy: "jwt" },

  providers: [

      Google({
    authorization: {
      params: {
        scope: "openid email profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks",
        access_type: "offline", // gives us a refresh_token
        prompt: "consent",      // makes Google re-send it
      },
    },
    }),

    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // runs on login. return the user = logged in, return null = wrong email or pw
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        // no account, or a Google only account (no pw saved)
        if (!user?.passwordHash) return null;

        const matches = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!matches) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],

  pages: { signIn: "/login" },

  callbacks: {
    // put the db user id on the session so the API routes can use it
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
