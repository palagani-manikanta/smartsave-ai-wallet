"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { IS_DEMO } from "@/lib/demo";
import { DemoRedirect } from "@/components/providers/DemoRedirect";

// Finishes a Google sign-in. If it fails, Clerk sends the user back to /sign-in;
// it never falls back to a fake session.
function SSOCallbackPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-bg-base">
      <p className="text-sm text-text-secondary">Signing you in…</p>
      <AuthenticateWithRedirectCallback signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/" />
    </main>
  );
}

export default IS_DEMO ? DemoRedirect : SSOCallbackPage;
