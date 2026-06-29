import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Implementation Scaffold",
  description: "Phase 0 application scaffold for the wellness centre platform.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
