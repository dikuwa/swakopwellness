import { asc, eq, isNull } from "drizzle-orm";
import type { Metadata } from "next";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { serviceQuestions, services } from "@/db/schema";
import { DashboardShell } from "@/dashboard/shell";
import {
  createSuitabilityQuestion,
  deleteSuitabilityQuestion,
  toggleSuitabilityQuestionActive,
  updateSuitabilityQuestion,
} from "@/services/actions";
import { SuitabilityForms } from "./suitability-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Suitability Questions — Dashboard",
};

export default async function ServiceSuitabilityPage() {
  await requirePermission("services:manage");
  const db = getDb();

  const [questions, serviceOptions] = await Promise.all([
    db
      .select({
        id: serviceQuestions.id,
        serviceId: serviceQuestions.serviceId,
        serviceName: services.name,
        question: serviceQuestions.question,
        flaggedAnswer: serviceQuestions.flaggedAnswer,
        sortOrder: serviceQuestions.sortOrder,
        active: serviceQuestions.active,
      })
      .from(serviceQuestions)
      .leftJoin(services, eq(serviceQuestions.serviceId, services.id))
      .orderBy(asc(serviceQuestions.sortOrder), asc(serviceQuestions.question)),
    db
      .select({ id: services.id, name: services.name })
      .from(services)
      .where(isNull(services.archivedAt))
      .orderBy(asc(services.sortOrder), asc(services.name)),
  ]);

  const totalQuestions = questions.length;
  const flaggedQuestions = questions.filter((q) => q.flaggedAnswer === "yes").length;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Services</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Suitability Questions</h1>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-3 max-w-lg">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span className="text-lg font-bold">{totalQuestions}</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="text-sm font-bold tracking-tight mt-0.5">Questions</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
            <span className="text-lg font-bold">{flaggedQuestions}</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Flagged</p>
            <p className="text-sm font-bold tracking-tight mt-0.5">Answers</p>
          </div>
        </div>
      </div>

      <SuitabilityForms
        questions={questions}
        serviceOptions={serviceOptions}
        createAction={createSuitabilityQuestion}
        updateAction={updateSuitabilityQuestion}
        toggleAction={toggleSuitabilityQuestionActive}
        deleteAction={deleteSuitabilityQuestion}
      />
    </DashboardShell>
  );
}
