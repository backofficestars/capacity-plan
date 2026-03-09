export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    // Protect all routes except login, API auth, static files, and favicon
    "/((?!login|api/auth|_next/static|_next/image|favicon\\.ico|backofficestars\\.svg).*)",
  ],
};
