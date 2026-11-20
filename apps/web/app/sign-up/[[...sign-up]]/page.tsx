"use client";

import { SignUp } from "@clerk/nextjs";
import { IS_DEMO } from "@/lib/demo";
import { DemoRedirect } from "@/components/providers/DemoRedirect";
import { AuthShell, clerkAppearance } from "@/components/auth/AuthShell";

function SignUpPage() {
  return (
    <AuthShell title="Create your account" subtitle="New accounts start with $1,000 of test money.">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
        appearance={clerkAppearance}
      />
    </AuthShell>
  );
}

export default IS_DEMO ? DemoRedirect : SignUpPage;
