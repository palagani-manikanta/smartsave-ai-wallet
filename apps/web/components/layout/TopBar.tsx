"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

interface TopBarProps {
  totalBalance?: number;
  notificationCount?: number;
  userName?: string;
  avatarUrl?: string;
}

export function TopBar({
  notificationCount = 0,
  userName = "",
  avatarUrl,
}: TopBarProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header
      className={cn(
        "fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-app z-nav",
        "h-top-bar",
        "bg-bg-base",
        "border-b border-border-subtle"
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center justify-between h-full px-4">
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-accent-primary text-text-inverse text-xs font-bold flex items-center justify-center">
            S
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-text-primary">SmartSave</span>
        </Link>

        {/* Actions */}
        <motion.div
          className="flex items-center gap-1"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center",
              "bg-transparent hover:bg-bg-elevated",
              "text-text-tertiary hover:text-text-primary",
              "transition-all duration-150 active:scale-90"
            )}
            aria-label="Toggle theme"
          >
            <motion.div
              key={resolvedTheme}
              initial={{ rotate: -30, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {resolvedTheme === "dark" ? (
                <Sun size={18} strokeWidth={1.8} />
              ) : (
                <Moon size={18} strokeWidth={1.8} />
              )}
            </motion.div>
          </button>

          {/* Notifications */}
          <Link
            href="/notifications"
            className={cn(
              "relative w-9 h-9 rounded-full flex items-center justify-center",
              "bg-transparent hover:bg-bg-elevated",
              "text-text-tertiary hover:text-text-primary",
              "transition-all duration-150 active:scale-90"
            )}
            aria-label={`${notificationCount} notifications`}
          >
            <Bell size={18} strokeWidth={1.8} />
            {notificationCount > 0 && (
              <motion.span
                className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-error text-white text-2xs font-bold flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              >
                {notificationCount > 9 ? "9+" : notificationCount}
              </motion.span>
            )}
          </Link>

          {/* Avatar */}
          <Link href="/profile" className="block">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-border-default ml-0.5 cursor-pointer">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-bg-elevated flex items-center justify-center text-text-primary text-xs font-semibold">
                  {(userName.charAt(0) || "?").toUpperCase()}
                </div>
              )}
            </div>
          </Link>
        </motion.div>
      </div>
    </header>
  );
}
