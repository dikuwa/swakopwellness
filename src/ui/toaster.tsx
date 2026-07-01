"use client";

import { Toaster } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4500,
        style: {
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          boxShadow: "0 16px 48px oklch(0.235 0.025 158 / 0.12)",
          color: "var(--foreground)",
          fontFamily: "var(--font-body), system-ui, sans-serif",
          fontSize: "0.875rem",
        },
        success: {
          iconTheme: {
            primary: "var(--success)",
            secondary: "var(--surface)",
          },
        },
        error: {
          iconTheme: {
            primary: "var(--destructive)",
            secondary: "var(--surface)",
          },
        },
      }}
    />
  );
}
