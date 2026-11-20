import React from "react";

// Clerk's own <SignIn/> and <SignUp/> handle every step (email codes, Google,
// 2FA, password reset). We only style them to match the app.
export const clerkAppearance = {
  variables: {
    colorPrimary: "#246754",
    colorText: "#1d1b19",
    colorTextSecondary: "#5f5a54",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#1d1b19",
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none border border-border-subtle rounded-2xl",
    card: "shadow-none",
    footer: "bg-bg-surface",
  },
};

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-bg-base px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-7 h-7 rounded-md bg-accent-primary text-text-inverse text-sm font-bold flex items-center justify-center">
            S
          </span>
          <span className="text-lg font-semibold tracking-tight text-text-primary">SmartSave</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h1>
        <p className="mt-1 mb-6 text-sm text-text-secondary">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}
