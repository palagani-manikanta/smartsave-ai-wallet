// Demo mode runs the whole app in the browser: no Clerk, no API server,
// no database and no Gemini key. Turn it on with NEXT_PUBLIC_DEMO_MODE=true
// (or `npm run demo`).
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const DEMO_TOKEN = "demo";
