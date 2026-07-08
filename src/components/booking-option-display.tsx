import type { ReactNode } from "react";

type BookingDisplayInput = {
  reference?: unknown;
  bookingReference?: unknown;
  id?: unknown;
  clientName?: unknown;
  serviceName?: unknown;
};

export function bookingDisplayParts(booking: unknown) {
  const source = (booking ?? {}) as BookingDisplayInput;
  return {
    reference: String(source.reference ?? source.bookingReference ?? source.id ?? "Unknown booking"),
    clientName: String(source.clientName ?? "Unknown client"),
    serviceName: String(source.serviceName ?? "Unknown service"),
  };
}

export function bookingSearchLabel(booking: unknown) {
  const { reference, clientName, serviceName } = bookingDisplayParts(booking);
  return `${reference} ${clientName} ${serviceName}`;
}

export function BookingOptionDisplay({ booking, selected = false }: { booking: unknown; selected?: boolean }) {
  const { reference, clientName, serviceName } = bookingDisplayParts(booking);
  const secondaryClass = selected ? "text-primary-foreground/80" : "text-muted-foreground";

  return (
    <div className="flex min-w-0 flex-col gap-0.5 py-1 text-left leading-tight">
      <span className="truncate text-sm font-semibold text-inherit">{reference}</span>
      <span className={`truncate text-xs ${secondaryClass}`}>{clientName}</span>
      <span className={`truncate text-xs ${secondaryClass}`}>{serviceName}</span>
    </div>
  );
}

export function BookingSelectedDisplay({ booking }: { booking: unknown }): ReactNode {
  return <BookingOptionDisplay booking={booking} />;
}
