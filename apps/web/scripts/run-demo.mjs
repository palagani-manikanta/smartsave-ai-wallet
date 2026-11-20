// Starts the web app in demo mode on any OS (no cross-env needed).
// Usage: npm run demo            -> dev server
//        npm run demo -- build   -> production build in demo mode
import { spawn } from "node:child_process";

const cmd = process.argv[2] === "build" ? "next build" : "next dev";
const child = spawn(`npx ${cmd}`, {
  shell: true,
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_DEMO_MODE: "true" },
});
child.on("exit", (code) => process.exit(code ?? 0));
