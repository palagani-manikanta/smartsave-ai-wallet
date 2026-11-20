import "./env-bootstrap";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { IS_DEMO } from "./lib/demo";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/api/webhooks(.*)",
]);

const authMiddleware = clerkMiddleware(async (auth, request) => {
  // Developer bypass: only honoured in local development, never in production builds
  if (
    process.env.NODE_ENV === "development" &&
    request.cookies.get("dev_bypass")?.value === "true"
  ) {
    return;
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

// Demo mode has no accounts, so every page is open.
export default IS_DEMO ? () => NextResponse.next() : authMiddleware;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.[\\w]+$).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
