"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// In demo mode there are no accounts, so auth pages send you to the dashboard.
export function DemoRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return null;
}
