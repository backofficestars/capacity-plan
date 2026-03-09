import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const hasDatabase = !!process.env.DATABASE_URL;

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Only use DrizzleAdapter when a database is configured
  ...(hasDatabase ? { adapter: DrizzleAdapter(db) } : {}),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const email = user.email.toLowerCase();
      if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
        return false;
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user && hasDatabase) {
        session.user.id = user.id;
        try {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.id, user.id),
          });
          if (dbUser) {
            (session.user as unknown as Record<string, unknown>).role =
              dbUser.role;
          }
        } catch {
          // DB not available - continue without role
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
