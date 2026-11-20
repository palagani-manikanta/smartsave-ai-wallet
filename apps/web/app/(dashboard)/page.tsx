"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Lock, Plus } from "lucide-react";
import { TransactionList } from "@/components/shared/Lists";
import { useSmartSaveStore } from "@/store/use-smartsave-store";
import { formatCurrency } from "@/lib/format";

function AccountRow({
  href,
  name,
  note,
  amount,
  dot,
}: {
  href: string;
  name: string;
  note: string;
  amount: number;
  dot: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 group"
    >
      <span className={`w-2 h-2 rounded-full ${dot}`} aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{name}</p>
        <p className="text-xs text-text-tertiary">{note}</p>
      </div>
      <p className="text-sm font-semibold text-text-primary number-font">{formatCurrency(amount)}</p>
      <ChevronRight size={16} className="text-text-tertiary group-hover:text-text-secondary" />
    </Link>
  );
}

export default function DashboardPage() {
  const { wallet, normalSavings, strictSavings, transactions } = useSmartSaveStore();

  const total = wallet.balance + normalSavings.balance + strictSavings.balance;
  const share = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  // "This month" numbers come from the user's own transactions, not canned text.
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const recent = transactions.filter((t) => new Date(t.createdAt) >= since);
  const moneyIn = recent
    .filter((t) => t.status === "COMPLETED" && t.direction === "CREDIT" && t.walletType === "MAIN")
    .reduce((s, t) => s + Number(t.amount), 0);
  const moneyOut = recent
    .filter((t) => t.status === "COMPLETED" && t.direction === "DEBIT" && t.walletType === "MAIN")
    .reduce((s, t) => s + Number(t.amount), 0);
  const blocked = recent.filter((t) => t.walletType === "STRICT" && t.status === "FAILED");

  return (
    <div className="px-4 py-5 flex flex-col gap-5">
      {/* ── Total balance ─────────────────────────────────────── */}
      <section className="rounded-2xl bg-bg-surface border border-border-subtle p-5">
        <p className="text-xs text-text-tertiary">Total balance</p>
        <p className="mt-1 text-[34px] leading-none font-semibold tracking-tight text-text-primary number-font">
          {formatCurrency(total)}
        </p>

        {/* Split bar: where the money sits */}
        <div className="mt-4 flex h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated" aria-hidden>
          <span className="bg-text-primary/80" style={{ width: `${share(wallet.balance)}%` }} />
          <span className="bg-success" style={{ width: `${share(normalSavings.balance)}%` }} />
          <span className="bg-accent-secondary" style={{ width: `${share(strictSavings.balance)}%` }} />
        </div>

        <div className="mt-4 divide-y divide-border-subtle">
          <AccountRow href="/wallet" name="Wallet" note="Everyday spending" amount={wallet.balance} dot="bg-text-primary/80" />
          <AccountRow
            href="/savings/normal"
            name="Flexible savings"
            note="Withdraw any time"
            amount={normalSavings.balance}
            dot="bg-success"
          />
          <AccountRow
            href="/savings/strict"
            name="Strict savings"
            note="Needs a bill to withdraw"
            amount={strictSavings.balance}
            dot="bg-accent-secondary"
          />
        </div>
      </section>

      {/* ── Actions ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        <Link
          href="/wallet"
          className="flex flex-col items-center gap-1.5 rounded-xl bg-bg-surface border border-border-subtle py-3 text-xs font-medium text-text-primary hover:bg-bg-elevated"
        >
          <ArrowUpRight size={18} /> Send
        </Link>
        <Link
          href="/savings"
          className="flex flex-col items-center gap-1.5 rounded-xl bg-bg-surface border border-border-subtle py-3 text-xs font-medium text-text-primary hover:bg-bg-elevated"
        >
          <Plus size={18} /> Save
        </Link>
        <Link
          href="/savings/strict/withdraw"
          className="flex flex-col items-center gap-1.5 rounded-xl bg-bg-surface border border-border-subtle py-3 text-xs font-medium text-text-primary hover:bg-bg-elevated"
        >
          <Lock size={18} /> Unlock
        </Link>
      </div>

      {/* ── Last 30 days ──────────────────────────────────────── */}
      <section className="rounded-2xl bg-bg-surface border border-border-subtle p-5">
        <h2 className="text-sm font-semibold text-text-primary">Last 30 days</h2>
        <dl className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <dt className="text-xs text-text-tertiary">Money in</dt>
            <dd className="mt-0.5 text-sm font-semibold text-success number-font">{formatCurrency(moneyIn, { compact: true })}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-tertiary">Money out</dt>
            <dd className="mt-0.5 text-sm font-semibold text-text-primary number-font">{formatCurrency(moneyOut, { compact: true })}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-tertiary">Blocked</dt>
            <dd className="mt-0.5 text-sm font-semibold text-text-primary number-font">
              {blocked.length} {blocked.length === 1 ? "try" : "tries"}
            </dd>
          </div>
        </dl>
        {blocked.length > 0 && (
          <p className="mt-3 text-xs text-text-secondary">
            Strict savings stopped {formatCurrency(blocked.reduce((s, t) => s + Number(t.amount), 0))} of non-essential
            spending.
          </p>
        )}
      </section>

      {/* ── Activity ──────────────────────────────────────────── */}
      <TransactionList transactions={transactions} title="Recent activity" seeAllHref="/history" limit={5} />
    </div>
  );
}
