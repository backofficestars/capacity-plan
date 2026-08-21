import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { NextResponse } from "next/server";

const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const email = user.email.toLowerCase();
      if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
        return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.picture = user.image;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.image = token.picture as string | null | undefined;
        session.user.name = token.name as string | null | undefined;
        session.user.email = (token.email as string | null | undefined) ?? "";
      }
      return session;
    },
    authorized({ auth: session, request }) {
      // Dev-only: skip auth when BYPASS_AUTH is set
      if (process.env.BYPASS_AUTH === "true") return true;

      const { pathname } = request.nextUrl;
      const isApiRoute = pathname.startsWith("/api/");

      // Server-to-server calls (e.g. the nightly FC check) authenticate with a
      // shared secret instead of a browser session.
      if (isApiRoute && process.env.CRON_SECRET) {
        const authHeader = request.headers.get("authorization");
        if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
      }

      const isLoggedIn = !!session?.user;
      const isOnLogin = pathname.startsWith("/login");
      if (isOnLogin) return true;
      if (isLoggedIn) return true;

      // For API routes, respond with JSON instead of redirecting to the HTML
      // login page — client code calling fetch() would otherwise try to
      // JSON.parse() the login page's HTML and crash with a confusing error.
      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      return false;
    },
  },
  pages: {
    signIn: "/login",
  },
});
