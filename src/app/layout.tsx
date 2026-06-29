import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swakop Wellness Centre",
  description: "Complementary wellness services and appointment requests in Swakopmund.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
