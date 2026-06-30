import Link from "next/link";
import { requirePermission } from "@/auth/session";
import { DashboardNav } from "@/dashboard/components";
import { getClients } from "@/dashboard/data";

export const dynamic = "force-dynamic";

export default async function DashboardClientsPage() {
  await requirePermission("clients:view");
  const clients = await getClients();

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto max-w-6xl rounded-[1.5rem] border border-border bg-surface p-6 shadow-[0_20px_80px_oklch(0.235_0.025_158_/_0.08)] sm:p-8">
        <DashboardNav />
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Clients</h1>
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
      </section>
    </main>
  );
}
