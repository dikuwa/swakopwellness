import Link from "next/link";
import { Activity, Cpu, ShieldCheck, Sparkles, Sprout, Zap } from "lucide-react";
import type { BusinessSettingsWithImage } from "@/public/data";

const features = [
  { icon: Activity, label: "Non-invasive full-body scan" },
  { icon: Cpu, label: "FCC-certified Diacom device" },
  { icon: Zap, label: "Harmless frequency signals" },
  { icon: Sparkles, label: "Identifies root cause imbalances" },
  { icon: ShieldCheck, label: "No needles or radiation" },
];

export function DiacomSection({ business }: { business: BusinessSettingsWithImage }) {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-10">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase text-primary">
          <Sprout className="h-4 w-4" /> Diacom Technology
        </p>
        <h2 className="display-tight mt-3 text-3xl font-semibold">Our Technology</h2>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="overflow-hidden rounded-xl bg-surface-muted">
            {business.technologyImage?.publicUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.technologyImage.publicUrl}
                alt={business.technologyImage.altText ?? "Diacom device"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/images/diacom-technology-device.webp"
                alt="Diacom device"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            )}
          </div>
          <div className="flex flex-col justify-center gap-4">
            <p className="text-sm leading-7 text-muted-foreground">
              The Diacom Lite Freq Utium sends harmless electromagnetic signals to read frequency patterns
              from your organs and cells, identifying imbalances and root causes long before symptoms appear.
              It is FCC-certified, non-invasive and does not involve needles or radiation.
            </p>
            <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
              {features.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-surface-muted/60 px-3.5 py-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-medium leading-tight text-foreground">{label}</span>
                </div>
              ))}
            </div>
            <aside className="mt-2 rounded-xl border border-warning/25 bg-warning/10 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold text-warning">
                <ShieldCheck className="h-3.5 w-3.5" /> Important &mdash; please read
              </p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {business.medicalDisclaimer}
              </p>
            </aside>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/book"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
              >
                Book appointment
              </Link>
              <Link
                href="/services"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold"
              >
                View services
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
