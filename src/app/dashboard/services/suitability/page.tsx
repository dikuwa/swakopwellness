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

  return (
    <DashboardShell>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              Services
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.035em]">
              Suitability Questions
            </h1>
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
