// Fill in safe defaults for non-secret settings when they are missing.
// Secret keys are never hard-coded here: set CLERK_SECRET_KEY in apps/web/.env.local
// (see .env.example at the repository root).
if (!process.env.NEXT_PUBLIC_API_URL) {
  process.env.NEXT_PUBLIC_API_URL = "/api/v1";
}
if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
  console.warn(
    "[env] Clerk keys are missing. Copy .env.example to apps/web/.env.local and add your Clerk test keys."
  );
}
