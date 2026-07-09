import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Mail, MapPin, Phone } from "lucide-react";
import { getPublicServices } from "@/public/data";
import { MobileNavDrawer, PrimaryNavLinks, type NavLink } from "@/public/nav";
import { ChatWidget } from "./chat-widget";

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

const primaryNavLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/faqs", label: "FAQs" },
  { href: "/book", label: "Book" },
  { href: "/contact", label: "Contact" },
];

const footerNavLinks: NavLink[] = [
  ...primaryNavLinks,
  { href: "/policies", label: "Policies" },
];

function BrandLogo({ variant = "green", className = "" }: { variant?: "green" | "white"; className?: string }) {
  const src = variant === "white" ? "/brand/logo-white.svg" : "/brand/logo-green.svg";

  return (
    <Image
      src={src}
      alt="Swakop Wellness Centre"
      width={150}
      height={88}
      priority={variant === "green"}
      className={`h-12 w-auto shrink-0 object-contain sm:h-14 ${className}`}
    />
  );
}

export function PublicHeader({ business, communication }: { business: Business; communication: Communication }) {
  const showCall = communication.enableCalls;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-6xl px-5 pt-4 sm:px-8">
        <div className="flex min-h-18 items-center justify-between gap-4 rounded-2xl border border-border bg-background/95 px-6 shadow-[0_4px_24px_oklch(0.235_0.025_158_/_0.04)] backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <Link href="/" className="flex min-w-0 items-center py-2 pr-2" aria-label={business.businessName}>
            <BrandLogo />
          </Link>
          <nav aria-label="Primary navigation" className="hidden items-center gap-1 text-sm text-muted-foreground lg:flex">
            <PrimaryNavLinks links={primaryNavLinks} />
          </nav>
          <div className="flex items-center gap-2">
            {showCall ? (
              <a href={`tel:${communication.mainPhone.replaceAll(" ", "")}`} className="hidden h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted sm:flex">
                Call
              </a>
            ) : null}
            <Link href="/book" className="flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_2px_8px_oklch(0.355_0.074_159_/_0.25)] transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_4px_12px_oklch(0.355_0.074_159_/_0.35)]">
              <span className="sm:hidden">Book</span>
              <span className="hidden sm:inline">Book Appointment</span>
            </Link>
            <MobileNavDrawer links={primaryNavLinks} />
          </div>
        </div>
      </div>
    </header>
  );
}

export function MobileActionBar({ communication }: { communication: Communication }) {
  return (
    <nav aria-label="Quick contact actions" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface p-2 shadow-[0_-10px_40px_oklch(0.235_0.025_158_/_0.08)] md:hidden">
      <div className="grid grid-cols-3 gap-2">
        {communication.enableCalls ? (
          <a href={`tel:${communication.mainPhone.replaceAll(" ", "")}`} className="flex h-10 items-center justify-center rounded-xl border border-border text-sm font-semibold transition-colors hover:bg-surface-muted">
            Call
          </a>
        ) : null}
        <Link href="/chat" className="flex h-10 items-center justify-center rounded-xl border border-border text-sm font-semibold transition-colors hover:bg-surface-muted">
          Chat
        </Link>
        <Link href="/book" className="flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_2px_8px_oklch(0.355_0.074_159_/_0.25)] transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_4px_12px_oklch(0.355_0.074_159_/_0.35)]">
          Book
        </Link>
      </div>
    </nav>
  );
}

export function PublicFooter({ business, communication, services }: { business: Business; communication: Communication; services: { slug: string; name: string }[] }) {
  return (
    <footer className="border-t border-border bg-primary pb-28 pt-12 text-primary-foreground md:pb-12">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.35fr_0.85fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="inline-flex items-center" aria-label={business.businessName}>
              <BrandLogo variant="white" className="w-32 sm:w-36" />
            </Link>
            <p className="mt-4 max-w-[34ch] text-sm leading-6 text-primary-foreground/75">
              Carefully designed assessment and frequency-based support to help you feel more balanced and in control of your wellbeing.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Quick Links</p>
            <div className="mt-3 grid gap-2 text-sm text-primary-foreground/75">
              {footerNavLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-primary-foreground">{link.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Our Services</p>
            <div className="mt-3 grid gap-2 text-sm text-primary-foreground/75">
              {services.slice(0, 5).map((service) => (
                <Link key={service.slug} href={`/services/${service.slug}`} className="hover:text-primary-foreground">{service.name}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Contact Us</p>
            <div className="mt-3 space-y-3 text-sm leading-6 text-primary-foreground/75">
              <p className="flex gap-2"><MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />{business.address}</p>
              {communication.enableCalls ? <p className="flex gap-2"><Phone className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />{communication.mainPhone}</p> : null}
              {communication.enableEmailContact ? <p className="flex gap-2"><Mail className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />{communication.businessEmail}</p> : null}
              <p className="flex gap-2"><CalendarDays className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />{business.operatingHours}<br />{business.appointmentModel}</p>
            </div>
          </div>
        </div>
        <div className="mt-10 grid gap-4 border-t border-primary-foreground/20 pt-6 text-sm leading-6 text-primary-foreground/70 md:grid-cols-[1fr_auto_1fr]">
          <p>&copy; {new Date().getFullYear()} {business.businessName}. All rights reserved.</p>
          <p className="text-center">Services are complementary wellness support and do not replace medical diagnosis or treatment.</p>
          <div className="flex gap-4 md:text-right">
            <Link href="/login" className="hover:text-primary-foreground">Staff Login</Link>
            <Link href="/policies" className="hover:text-primary-foreground">Policies &amp; Disclaimers</Link>
            <a href="https://www.flextech-media.com" target="_blank" rel="noreferrer" className="hover:text-primary-foreground">Flextech Media</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export async function PageShell({
  business,
  communication,
  children,
  flushTop = false,
}: {
  business: Business;
  communication: Communication;
  children: React.ReactNode;
  flushTop?: boolean;
}) {
  const services = await getPublicServices();

  return (
    <>
      <PublicHeader business={business} communication={communication} />
      <div className={flushTop ? "" : "pt-20"}>{children}</div>
      <PublicFooter business={business} communication={communication} services={services} />
      <MobileActionBar communication={communication} />
      <ChatWidget />
    </>
  );
}
