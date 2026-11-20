"use client";

import React from "react";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { useSmartSaveStore } from "@/store/use-smartsave-store";
import { IS_DEMO } from "@/lib/demo";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { wallet, normalSavings, strictSavings, user, notifications, resetAllData } = useSmartSaveStore();

  const totalBalance = wallet.balance + normalSavings.balance + strictSavings.balance;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Fixed Top Bar */}
      <TopBar
        totalBalance={totalBalance}
        notificationCount={unreadCount}
        userName={user.firstName}
        avatarUrl={user.avatarUrl}
      />

      {/* Page Content — padded for top/bottom bars */}
      <div
        className="pt-top-bar pb-nav-bottom min-h-dvh"
        style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}
      >
        {IS_DEMO && (
          <div className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-xl border border-border-default bg-bg-elevated px-3 py-2">
            <p className="text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">Demo mode.</span> Sample data, saved only in this browser.
            </p>
            <button
              onClick={async () => {
                await resetAllData();
                window.location.reload();
              }}
              className="shrink-0 text-xs font-medium text-accent-primary hover:underline"
            >
              Reset
            </button>
          </div>
        )}
        {children}
      </div>

      {/* Fixed Bottom Navigation */}
      <BottomNavigation />
    </>
  );
}
