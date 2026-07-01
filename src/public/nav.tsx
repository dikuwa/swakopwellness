"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export type NavLink = {
  href: string;
  label: string;
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PrimaryNavLinks({ links, mobile = false, onNavigate }: { links: NavLink[]; mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={
              mobile
                ? `block rounded-xl px-4 py-3 text-base font-semibold transition-colors ${
                    active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-surface-muted"
                  }`
                : `rounded-xl px-3 py-2 transition-colors ${
                    active ? "bg-surface-muted text-foreground" : "hover:bg-surface-muted hover:text-foreground"
                  }`
            }
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

export function MobileNavDrawer({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border transition-colors hover:bg-surface-muted lg:hidden"
        aria-label="Open navigation menu"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5 text-foreground" aria-hidden="true" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-label="Site navigation">
          <button type="button" className="absolute inset-0 h-full w-full cursor-default" aria-label="Close navigation menu" onClick={() => setOpen(false)} />
          <nav aria-label="Mobile navigation" className="relative ml-auto flex h-dvh w-[min(22rem,calc(100vw-2rem))] flex-col border-l border-border bg-surface p-5 shadow-[0_8px_32px_oklch(0.235_0.025_158_/_0.12)]">
            <div className="mb-6 flex items-center justify-between gap-4">
              <Image
                src="/brand/logo-green.svg"
                alt="Swakop Wellness Centre"
                width={150}
                height={88}
                className="h-12 w-auto shrink-0 object-contain sm:h-14"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border transition-colors hover:bg-surface-muted"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5 text-foreground" aria-hidden="true" />
              </button>
            </div>
            <div className="grid gap-1">
              <PrimaryNavLinks links={links} mobile onNavigate={() => setOpen(false)} />
            </div>
            <div className="mt-auto grid gap-3 border-t border-border pt-5">
              <Link
                href="/book"
                onClick={() => setOpen(false)}
                className="flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                Book Appointment
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
