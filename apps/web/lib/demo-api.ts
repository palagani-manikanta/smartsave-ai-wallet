// In-browser stand-in for the Express API, used only in demo mode.
// It answers the same routes with the same JSON shapes, keeps its data in
// localStorage, and follows the same rules as the real services
// (balance checks, strict-savings verification, blocked withdrawals).

import { mockTransactions, mockNotifications, mockUser } from "@/lib/mock-data";
import { classifyExpense, extractReceiptFields } from "@/lib/expense-rules";
import type { Notification, Transaction } from "@/types";

const STORAGE_KEY = "smartsave-demo-db";

interface DemoRequest {
  id: string;
  amount: number;
  status: string;
  expiresAt: string;
  createdAt: string;
}

interface DemoDb {
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
    createdAt: string;
  };
  wallet: number;
  savings: number;
  strict: number;
  threshold: number;
  totalSaved: number;
  startDate: string;
  endDate: string;
  settings: Record<string, unknown>;
  transactions: Transaction[];
  notifications: Notification[];
  requests: DemoRequest[];
}

const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

function seed(): DemoDb {
  return {
    profile: {
      id: mockUser.id,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      email: mockUser.email,
      avatarUrl: null,
      createdAt: mockUser.joinedAt,
    },
    wallet: 2845.5,
    savings: 1320,
    strict: 4500,
    threshold: 500,
    totalSaved: 5200,
    startDate: daysFromNow(-60),
    endDate: daysFromNow(120),
    settings: {
      theme: "dark",
      biometricsEnabled: false,
      notificationsEnabled: true,
      strictModeEnabled: true,
    },
    transactions: mockTransactions.slice(0, 8),
    notifications: mockNotifications.slice(0, 3),
    requests: [],
  };
}

function load(): DemoDb {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DemoDb;
  } catch {
    /* fall through to a fresh seed */
  }
  const db = seed();
  save(db);
  return db;
}

function save(db: DemoDb) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* storage can be unavailable (private mode); the demo still works for this page view */
  }
}

export function resetDemoData() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const ok = (data: unknown) => json(200, { success: true, data });
const fail = (message: string) => json(400, { success: false, error: { message } });

function addTxn(db: DemoDb, t: Partial<Transaction> & Pick<Transaction, "type" | "direction" | "amount" | "walletType">) {
  db.transactions.unshift({
    id: id("txn"),
    currency: "USD",
    status: "COMPLETED",
    createdAt: new Date().toISOString(),
    ...t,
  } as Transaction);
}

function notify(db: DemoDb, type: Notification["type"], title: string, message: string) {
  db.notifications.unshift({
    id: id("ntf"),
    type,
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

type Pocket = "wallet" | "savings" | "strict";

function move(db: DemoDb, from: Pocket | null, to: Pocket | null, amount: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return "Enter an amount greater than zero.";
  if (from && db[from] < amount) return "Not enough money in that account.";
  if (from) db[from] = +(db[from] - amount).toFixed(2);
  if (to) db[to] = +(db[to] + amount).toFixed(2);
  return null;
}

async function readBody(init?: RequestInit): Promise<any> {
  if (!init?.body) return {};
  if (typeof init.body === "string") return JSON.parse(init.body);
  return init.body;
}

function profilePayload(db: DemoDb) {
  const now = new Date().toISOString();
  return {
    profile: {
      ...db.profile,
      wallet: { id: "wlt_demo", balance: db.wallet, currency: "USD", cardNumber: "**** 4291", updatedAt: now },
      normalSavings: { id: "sav_demo", balance: db.savings, currency: "USD", monthlyGrowth: 2.4, updatedAt: now },
      strictSavings: {
        id: "sst_demo",
        balance: db.strict,
        currency: "USD",
        withdrawalThreshold: db.threshold,
        totalSaved: db.totalSaved,
        startDate: db.startDate,
        endDate: db.endDate,
        updatedAt: now,
      },
      settings: db.settings,
    },
  };
}

export async function demoFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const path = url.replace(/^.*\/api\/v1/, "");
  const method = (init?.method || "GET").toUpperCase();
  const db = load();
  const body = await readBody(init);
  const amount = Number(body?.amount);

  // Small delay so loading states are visible, like a real network call.
  await new Promise((r) => setTimeout(r, 250));

  const done = (data: unknown) => {
    save(db);
    return ok(data);
  };

  switch (`${method} ${path}`) {
    case "POST /users/sync":
      return done({ profile: profilePayload(db).profile });

    case "GET /users/profile":
      return ok(profilePayload(db));

    case "PUT /users/settings":
      db.settings = { ...db.settings, ...body };
      return done(profilePayload(db));

    case "GET /transactions":
      return ok({ transactions: db.transactions });

    case "GET /notifications":
      return ok({ notifications: db.notifications });

    case "POST /notifications/read-all":
      db.notifications = db.notifications.map((n) => ({ ...n, read: true }));
      return done({});

    case "DELETE /notifications/clear-all":
      db.notifications = [];
      return done({});

    case "POST /wallet/deposit": {
      const err = move(db, null, "wallet", amount);
      if (err) return fail(err);
      addTxn(db, { type: "DEPOSIT", direction: "CREDIT", amount, walletType: "MAIN", description: body.description || "Added funds" });
      return done({});
    }

    case "POST /wallet/withdraw": {
      const err = move(db, "wallet", null, amount);
      if (err) return fail(err);
      addTxn(db, { type: "SEND", direction: "DEBIT", amount, walletType: "MAIN", description: body.description || "Sent funds" });
      return done({});
    }

    case "POST /savings/deposit": {
      const err = move(db, "wallet", "savings", amount);
      if (err) return fail(err);
      addTxn(db, { type: "TRANSFER_OUT", direction: "DEBIT", amount, walletType: "SAVINGS", description: "Moved to savings" });
      return done({});
    }

    case "POST /savings/withdraw": {
      const err = move(db, "savings", "wallet", amount);
      if (err) return fail(err);
      addTxn(db, { type: "TRANSFER_IN", direction: "CREDIT", amount, walletType: "SAVINGS", description: "Moved from savings" });
      return done({});
    }

    case "POST /strict-savings/deposit": {
      const err = move(db, "wallet", "strict", amount);
      if (err) return fail(err);
      db.totalSaved = +(db.totalSaved + amount).toFixed(2);
      addTxn(db, { type: "TRANSFER_OUT", direction: "DEBIT", amount, walletType: "STRICT", description: "Locked in strict savings" });
      return done({});
    }

    case "POST /strict-savings/withdraw": {
      if (!(amount > 0)) return fail("Enter an amount greater than zero.");
      if (db.strict < amount) return fail("Not enough money in strict savings.");
      const request: DemoRequest = {
        id: id("vr"),
        amount,
        status: "PENDING_VERIFICATION",
        expiresAt: daysFromNow(1 / 48),
        createdAt: new Date().toISOString(),
      };
      db.requests.push(request);
      notify(db, "WARNING", "Proof needed", `Upload a bill to withdraw $${amount.toFixed(2)} from strict savings.`);
      return done({
        status: "PENDING_VERIFICATION",
        requestId: request.id,
        message: "Every strict-savings withdrawal needs a bill or receipt.",
      });
    }

    case "POST /strict-savings/upload": {
      const form = init?.body as FormData;
      const file = form?.get("document") as File | null;
      if (!file) return fail("No document was uploaded.");
      // Real OCR is not available in the browser. Text files are read as-is;
      // for images and PDFs only the file name is used.
      const isText = file.type.startsWith("text/") || /\.txt$/i.test(file.name);
      const text = isText ? await file.text() : file.name.replace(/[_\-.]+/g, " ");
      const fields = extractReceiptFields(text);
      const ai = classifyExpense(text);
      return done({
        ocr: { rawText: text, fields, engine: isText ? "text-file (demo)" : "file-name only (demo)" },
        ai,
      });
    }

    case "POST /strict-savings/decide": {
      const request = db.requests.find((r) => r.id === body.requestId);
      if (!request) return fail("Verification request not found.");
      if (request.status !== "PENDING_VERIFICATION") return fail("This request was already decided.");
      request.status = body.status;
      if (body.status === "APPROVED") {
        const err = move(db, "strict", "wallet", request.amount);
        if (err) return fail(err);
        addTxn(db, {
          type: "WITHDRAWAL",
          direction: "CREDIT",
          amount: request.amount,
          walletType: "STRICT",
          classification: "ESSENTIAL",
          description: "Strict savings withdrawal (approved)",
        });
        notify(db, "SUCCESS", "Withdrawal approved", `$${request.amount.toFixed(2)} moved to your wallet.`);
      } else {
        addTxn(db, {
          type: "WITHDRAWAL",
          direction: "DEBIT",
          amount: request.amount,
          walletType: "STRICT",
          classification: "NON_ESSENTIAL",
          status: "FAILED",
          description: "Strict savings withdrawal blocked",
        });
        notify(db, "ERROR", "Withdrawal blocked", `$${request.amount.toFixed(2)} stays locked: the bill looked non-essential.`);
      }
      return done({ request });
    }

    case "POST /strict-savings/threshold": {
      if (!(amount >= 0)) return fail("Enter a valid amount.");
      db.threshold = amount;
      return done({});
    }

    default:
      return json(404, { success: false, error: { message: `Demo API has no route for ${method} ${path}` } });
  }
}
