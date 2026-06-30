import Link from "next/link";
import { requirePermission } from "@/auth/session";
import { DashboardLayout } from "@/dashboard/components";
import { getClients } from "@/dashboard/data";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function DashboardClientsPage() {
  await requirePermission("clients:view");
  const clients = await getClients();

  return (
    <DashboardLayout signOutForm={<form action={logoutAction}><button type="submit" className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-muted">Sign out</button></form>}>
      <div>
        <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Management</p>
        <h1 className="mt-2 text-2xl sm:text-3xl tracking-[-0.03em]">Clients</h1>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-3">Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Preferred Contact</th>
              <th>Last Booking</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-t border-border">
                <td className="py-3 font-medium">
                  <Link href={`/dashboard/clients/${client.id}`} className="hover:underline">
                    {client.fullName}
                  </Link>
                </td>
                <td>{client.phone ?? "—"}</td>
                <td>{client.email ?? "—"}</td>
                <td>{client.preferredContactMethod.replaceAll("_", " ")}</td>
                <td>{client.lastBookingAt ? client.lastBookingAt.toLocaleString("en-NA") : "—"}</td>
                <td>{client.createdAt.toLocaleString("en-NA")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {clients.length === 0 && <p className="mt-6 text-muted-foreground">No clients found.</p>}
    </DashboardLayout>
  );
}
