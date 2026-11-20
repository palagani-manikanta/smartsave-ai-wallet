"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Wallet,
  PiggyBank,
  Shield,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    match: /^\/$/,
  },
  {
    label: "Wallet",
    href: "/wallet",
    icon: Wallet,
    match: /^\/wallet/,
  },
  {
    label: "Savings",
    href: "/savings",
    icon: PiggyBank,
    match: /^\/savings(?!\/strict)/,
  },
  {
    label: "Strict",
    href: "/savings/strict",
    icon: Shield,
    match: /^\/(savings\/strict|strict-savings)/,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    match: /^\/(settings|profile|history)/,
  },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app z-nav">
      <div
        className={cn(
          "px-2 pb-safe-bottom",
          "bg-bg-surface",
          "border-t border-border-subtle",
          "h-bottom-nav"
        )}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      >
        <ul className="flex items-center h-full">
          {navItems.map((item) => {
            const isActive = item.match.test(pathname);
            const Icon = item.icon;

            return (
              <li key={item.href} className="flex-1">
                <Link href={item.href} className="relative flex flex-col items-center gap-1 py-2 group">
                  {/* Active dot indicator */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        layoutId="nav-indicator"
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-accent-primary"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        exit={{ scaleX: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Icon container */}
                  <motion.div
                    className="relative"
                    animate={{ y: isActive ? -1 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.5 : 1.8}
                      className={cn(
                        "transition-colors duration-200",
                        isActive
                          ? "text-accent-primary"
                          : "text-text-tertiary group-hover:text-text-secondary"
                      )}
                    />
                  </motion.div>

                  {/* Label */}
                  <span
                    className={cn(
                      "text-2xs font-medium transition-colors duration-200",
                      isActive ? "text-accent-primary" : "text-text-tertiary"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
