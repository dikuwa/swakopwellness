import type { Metadata, Viewport } from "next";
import { Onest, Raleway } from "next/font/google";
import { AppToaster } from "@/ui/toaster";
import "./globals.css";

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const onest = Onest({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const title = "Swakop Wellness Centre";
const description = "Complementary wellness services and appointment requests in Swakopmund, Namibia.";

export const metadata: Metadata = {
  title: { default: title, template: "%s | Swakop Wellness Centre" },
  description,
  openGraph: {
    title: { default: title, template: "%s | Swakop Wellness Centre" },
    description,
    siteName: "Swakop Wellness Centre",
    locale: "en_NA",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: { default: title, template: "%s | Swakop Wellness Centre" },
    description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5ef" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${raleway.variable} ${onest.variable}`} data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
