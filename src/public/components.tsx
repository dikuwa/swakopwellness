import Link from "next/link";
import { getEnabledContactMethods } from "@/settings/communication";

type Business = {
  businessName: string;
  telephone: string;
  address: string;
  operatingHours: string;
  appointmentModel: string;
};

type Communication = {
  enableCalls: boolean;
  enableEmailContact: boolean;
  enableWhatsapp: boolean;
  mainPhone: string;
  businessEmail: string;
  whatsappNumber: string | null;
};

const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/faqs", label: "FAQs" },
  { href: "/chat", label: "Chat to Book" },
  { href: "/contact", label: "Contact" },
  { href: "/policies", label: "Policies" },
];

function BrandMark() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold tracking-wider text-primary-foreground">
      SW
    </span>
  );
}

function MobileNav() {
  return (
    <details className="group md:hidden">
      <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-border transition-colors hover:bg-surface-muted" aria-label="Toggle navigation menu">
        <svg className="h-5 w-5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path className="block group-open:hidden" d="M4 6l16 0M4 12l16 0M4 18l16 0" />
          <path className="hidden group-open:block" d="M18 6L6 18M6 6l12 12" />
        </svg>
      </summary>
      <div className="absolute inset-x-0 top-full z-50 mt-2 px-5">
        <nav aria-label="Mobile navigation" className="rounded-2xl border border-border bg-surface p-4 shadow-[0_8px_32px_oklch(0.235_0.025_158_/_0.08)]">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="block rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-muted">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </details>
  );
}

export function PublicHeader({ business, communication }: { business: Business; communication: Communication }) {
  const showCall = communication.enableCalls;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-6xl px-5 pt-4 sm:px-8">
        <div className="flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-border bg-background/95 px-5 shadow-[0_4px_24px_oklch(0.235_0.025_158_/_0.04)] backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <Link href="/" className="flex items-center gap-3 text-base font-semibold">
            <BrandMark />
            <span className="hidden sm:inline">{business.businessName}</span>
          </Link>
          <nav aria-label="Primary navigation" className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-xl px-3 py-2 transition-colors hover:bg-surface-muted hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {showCall ? (
              <a href={`tel:${communication.mainPhone.replaceAll(" ", "")}`} className="hidden h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted sm:flex">
                Call
              </a>
            ) : null}
            <Link href="/book" className="flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_2px_8px_oklch(0.355_0.074_159_/_0.25)] transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_4px_12px_oklch(0.355_0.074_159_/_0.35)]">
              Book
            </Link>
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}

export function MobileActionBar({ communication }: { communication: Communication }) {
  const methods = getEnabledContactMethods(communication);

  return (
    <nav aria-label="Quick contact actions" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface p-2 shadow-[0_-10px_40px_oklch(0.235_0.025_158_/_0.08)] md:hidden">
      <div className="grid grid-cols-3 gap-2">
        {methods.includes("phone") ? (
          <a href={`tel:${communication.mainPhone.replaceAll(" ", "")}`} className="flex h-10 items-center justify-center rounded-xl border border-border text-sm font-semibold transition-colors hover:bg-surface-muted">
            Call
          </a>
        ) : null}
        {methods.includes("whatsapp") && communication.whatsappNumber ? (
          <a href={`https://wa.me/${communication.whatsappNumber.replace(/\D/g, "")}`} className="flex h-10 items-center justify-center rounded-xl border border-border text-sm font-semibold transition-colors hover:bg-surface-muted">
            WhatsApp
          </a>
        ) : (
          <Link href="/chat" className="flex h-10 items-center justify-center rounded-xl border border-border text-sm font-semibold transition-colors hover:bg-surface-muted">
            Chat
          </Link>
        )}
        <Link href="/book" className="flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_2px_8px_oklch(0.355_0.074_159_/_0.25)] transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_4px_12px_oklch(0.355_0.074_159_/_0.35)]">
          Book
        </Link>
      </div>
    </nav>
  );
}

export function PublicFooter({ business, communication }: { business: Business; communication: Communication }) {
  return (
    <footer className="border-t border-border bg-surface pb-28 pt-12 md:pb-12">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-3 text-base font-semibold">
              <BrandMark />
              {business.businessName}
            </Link>
            <p className="mt-4 max-w-[52ch] text-sm leading-6 text-muted-foreground">
              Complementary wellness services by appointment in Swakopmund. Not a replacement for medical diagnosis or treatment.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Visit</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{business.address}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{business.operatingHours}, {business.appointmentModel.toLowerCase()}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Contact</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{communication.mainPhone}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{communication.businessEmail}</p>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center text-sm leading-6 text-muted-foreground">
          &copy; {new Date().getFullYear()} {business.businessName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ business, communication, children }: { business: Business; communication: Communication; children: React.ReactNode }) {
  return (
    <>
      <PublicHeader business={business} communication={communication} />
      <div className="pt-20">{children}</div>
      <PublicFooter business={business} communication={communication} />
      <MobileActionBar communication={communication} />
    </>
  );
}
