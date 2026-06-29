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

export function PublicHeader({ business, communication }: { business: Business; communication: Communication }) {
  const showCall = communication.enableCalls;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="text-base font-semibold tracking-[-0.02em]">
          {business.businessName}
        </Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          <Link href="/services" className="hover:text-foreground">Services</Link>
          <Link href="/about" className="hover:text-foreground">About</Link>
          <Link href="/faqs" className="hover:text-foreground">FAQs</Link>
          <Link href="/contact" className="hover:text-foreground">Contact</Link>
          <Link href="/policies" className="hover:text-foreground">Policies</Link>
        </nav>
        <div className="flex items-center gap-2">
          {showCall ? (
            <a href={`tel:${communication.mainPhone.replaceAll(" ", "")}`} className="hidden h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-surface-muted sm:flex">
              Call
            </a>
          ) : null}
          <Link href="/book" className="flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Book
          </Link>
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
          <a href={`tel:${communication.mainPhone.replaceAll(" ", "")}`} className="flex h-11 items-center justify-center rounded-xl border border-border text-sm font-semibold">
            Call
          </a>
        ) : null}
        {methods.includes("whatsapp") && communication.whatsappNumber ? (
          <a href={`https://wa.me/${communication.whatsappNumber.replace(/\D/g, "")}`} className="flex h-11 items-center justify-center rounded-xl border border-border text-sm font-semibold">
            WhatsApp
          </a>
        ) : (
          <Link href="/faqs" className="flex h-11 items-center justify-center rounded-xl border border-border text-sm font-semibold">
            FAQs
          </Link>
        )}
        <Link href="/book" className="flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
          Book
        </Link>
      </div>
    </nav>
  );
}

export function PublicFooter({ business, communication }: { business: Business; communication: Communication }) {
  return (
    <footer className="border-t border-border bg-surface pb-24 pt-10 md:pb-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 text-sm text-muted-foreground sm:px-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-semibold text-foreground">{business.businessName}</p>
          <p className="mt-3 max-w-[52ch] leading-6">Complementary wellness services by appointment in Swakopmund. Not a replacement for medical diagnosis or treatment.</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Visit</p>
          <p className="mt-3 leading-6">{business.address}</p>
          <p className="mt-2 leading-6">{business.operatingHours}, {business.appointmentModel.toLowerCase()}</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Contact</p>
          <p className="mt-3 leading-6">{communication.mainPhone}</p>
          <p className="mt-2 leading-6">{communication.businessEmail}</p>
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ business, communication, children }: { business: Business; communication: Communication; children: React.ReactNode }) {
  return (
    <>
      <PublicHeader business={business} communication={communication} />
      {children}
      <PublicFooter business={business} communication={communication} />
      <MobileActionBar communication={communication} />
    </>
  );
}
