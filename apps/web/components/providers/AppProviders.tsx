"use client";

import React, { useEffect } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { useAuth, useUser } from "@clerk/nextjs";
import { useSmartSaveStore, setTokenGetter } from "@/store/use-smartsave-store";
import { IS_DEMO, DEMO_TOKEN } from "@/lib/demo";

// Demo mode: no Clerk. Load the in-browser demo account straight away.
function DemoAuthBridge({ children }: { children: React.ReactNode }) {
  const setToken = useSmartSaveStore((s) => s.setToken);
  const syncUser = useSmartSaveStore((s) => s.syncUser);
  const fetchData = useSmartSaveStore((s) => s.fetchData);

  useEffect(() => {
    setToken(DEMO_TOKEN);
    syncUser({ firstName: "Demo", lastName: "User", email: "demo@smartsave.app" }).then(fetchData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <ThemeProvider>{children}</ThemeProvider>;
}

function ClerkAuthBridge({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId, getToken } = useAuth();
  const { user } = useUser();
  const setToken = useSmartSaveStore((s) => s.setToken);
  const syncUser = useSmartSaveStore((s) => s.syncUser);
  const fetchData = useSmartSaveStore((s) => s.fetchData);
  const resetAllData = useSmartSaveStore((s) => s.resetAllData);

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      // Signed out: forget any previous user's data.
      setTokenGetter(null);
      resetAllData();
      return;
    }

    // Clerk session tokens last about a minute, so every API call asks for a fresh one.
    setTokenGetter(() => getToken());

    (async () => {
      const token = await getToken();
      if (!token) return;
      setToken(token);
      await syncUser({
        firstName: user?.firstName || "User",
        lastName: user?.lastName || "",
        email: user?.primaryEmailAddress?.emailAddress || user?.emailAddresses[0]?.emailAddress || "",
        avatarUrl: user?.imageUrl,
      });
      await fetchData();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, userId]);

  return <ThemeProvider>{children}</ThemeProvider>;
}

export const AppProviders = IS_DEMO ? DemoAuthBridge : ClerkAuthBridge;
