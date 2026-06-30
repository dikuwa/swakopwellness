"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      textAlign: "center"
    }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <svg width="80" height="80" viewBox="0 0 36 36" fill="none">
          <rect width="36" height="36" rx="8" fill="#2d6a4f"/>
          <path d="M18 8C14 12 10 16 10 20c0 4.4 3.6 8 8 8s8-3.6 8-8c0-4-4-8-8-8z" fill="#52b788" opacity="0.8"/>
          <path d="M18 10c-3 3.5-5.5 7-5.5 10 0 3.6 2.5 6 5.5 6s5.5-2.4 5.5-6c0-3-2.5-6.5-5.5-10z" fill="#95d5b2"/>
        </svg>
      </div>
      <h1 style={{ fontSize: "2rem", fontWeight: 600, margin: "0 0 0.5rem" }}>Something went wrong</h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem", maxWidth: "24rem" }}>
        An unexpected error occurred. Please try again or come back later.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "0.75rem 1.5rem",
            background: "#2d6a4f",
            color: "#fff",
            borderRadius: "0.75rem",
            border: "none",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "0.75rem 1.5rem",
            background: "#e5e7eb",
            color: "#374151",
            borderRadius: "0.75rem",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
