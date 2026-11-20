"use client";

import { SignIn } from "@clerk/nextjs";
import { IS_DEMO } from "@/lib/demo";
import { DemoRedirect } from "@/components/providers/DemoRedirect";
import { AuthShell, clerkAppearance } from "@/components/auth/AuthShell";

function SignInPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to see your wallet and savings.">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
        appearance={clerkAppearance}
      />
    </AuthShell>
  );
}

export default IS_DEMO ? DemoRedirect : SignInPage;
