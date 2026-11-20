"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { cardVariants, cardHoverVariants } from "@/lib/animations";

// ── Glass Card ────────────────────────────────────────────────────

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: "none" | "sm" | "md" | "lg";
  glow?: "violet" | "emerald" | "none";
  animate?: boolean;
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function GlassCard({
  children,
  className,
  hover = false,
  onClick,
  padding = "md",
  glow = "none",
  animate = true,
}: GlassCardProps) {
  const glowClass = {
    violet: "glow-violet",
    emerald: "glow-emerald",
    none: "",
  }[glow];

  return (
    <motion.div
      variants={animate ? cardVariants : undefined}
      initial={animate ? "initial" : undefined}
      animate={animate ? "animate" : undefined}
      whileHover={hover ? { scale: 1.015, y: -2 } : undefined}
      whileTap={hover ? { scale: 0.98, y: 0 } : undefined}
      onClick={onClick}
      className={cn(
        "glass rounded-2xl",
        paddingMap[padding],
        glowClass,
        hover && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// ── Wallet Card (Main Wallet — violet gradient) ───────────────────

interface WalletCardProps {
  balance: number;
  currency?: string;
  cardNumber?: string;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function WalletCard({
  balance,
  currency = "USD",
  cardNumber = "**** 4291",
  isVisible = true,
  onToggleVisibility,
  className,
  children,
}: WalletCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      className={cn(
        "relative overflow-hidden rounded-2xl p-6",
        "gradient-wallet",
        "border border-violet-800/30",
        "glow-violet",
        className
      )}
    >
      {/* Decorative circles */}

      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

// ── Savings Card (Normal Savings — emerald gradient) ──────────────

interface SavingsCardProps {
  balance: number;
  currency?: string;
  monthlyGrowth?: number;
  className?: string;
  children?: React.ReactNode;
}

export function SavingsCard({
  balance,
  currency = "USD",
  monthlyGrowth = 0,
  className,
  children,
}: SavingsCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      className={cn(
        "relative overflow-hidden rounded-2xl p-6",
        "gradient-savings",
        "border border-emerald-800/30",
        "glow-emerald",
        className
      )}
    >
      {/* Decorative elements */}

      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

// ── Strict Savings Card (dark + shimmer + AI) ─────────────────────

interface StrictSavingsCardProps {
  balance: number;
  threshold?: number;
  currency?: string;
  className?: string;
  children?: React.ReactNode;
}

export function StrictSavingsCard({
  balance,
  threshold = 500,
  currency = "USD",
  className,
  children,
}: StrictSavingsCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      className={cn(
        "relative overflow-hidden rounded-2xl p-6",
        "gradient-strict",
        
        className
      )}
    >

      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon,
  className,
}: StatCardProps) {
  const changeColor = {
    positive: "text-success",
    negative: "text-error",
    neutral: "text-text-tertiary",
  }[changeType];

  return (
    <GlassCard className={cn("flex flex-col gap-2", className)} padding="sm">
      <div className="flex items-start justify-between">
        <p className="text-xs text-text-tertiary font-medium">{label}</p>
        {icon && (
          <div className="text-text-tertiary">{icon}</div>
        )}
      </div>
      <p className="text-xl font-bold text-text-primary number-font">{value}</p>
      {change && (
        <p className={cn("text-xs font-medium", changeColor)}>{change}</p>
      )}
    </GlassCard>
  );
}
