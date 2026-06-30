import { asc, eq, isNull } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { serviceQuestions, services } from "@/db/schema";
import { DashboardNav } from "@/dashboard/components";
import {
  createSuitabilityQuestion,
  deleteSuitabilityQuestion,
  toggleSuitabilityQuestionActive,
  updateSuitabilityQuestion,
} from "@/services/actions";

export const dynamic = "force-dynamic";

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
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto max-w-6xl rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
        <DashboardNav />
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

        <form
          action={async (formData) => { "use server"; await createSuitabilityQuestion(formData); }}
          className="mt-6 grid gap-4 rounded-xl border border-border bg-background p-4 lg:grid-cols-[1.5fr_3fr_140px_100px_auto]"
        >
          <div>
            <label
              htmlFor="serviceId"
              className="mb-1.5 block text-sm font-semibold"
            >
              Service
            </label>
            <select
              id="serviceId"
              name="serviceId"
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All services</option>
              {serviceOptions.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="question"
              className="mb-1.5 block text-sm font-semibold"
            >
              Question *
            </label>
            <input
              id="question"
              name="question"
              required
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label
              htmlFor="flaggedAnswer"
              className="mb-1.5 block text-sm font-semibold"
            >
              Flagged answer
            </label>
            <select
              id="flaggedAnswer"
              name="flaggedAnswer"
              defaultValue="yes"
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="sortOrder"
              className="mb-1.5 block text-sm font-semibold"
            >
              Sort
            </label>
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              defaultValue={0}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Create
            </button>
          </div>
        </form>

        <div className="mt-6 space-y-3">
          {questions.map((question) => (
            <div
              key={question.id}
              className="rounded-xl border border-border bg-background p-4"
            >
              <form
                action={async (formData) => { "use server"; await updateSuitabilityQuestion(question.id, formData); }}
                className="grid gap-4 lg:grid-cols-[1.5fr_3fr_140px_100px_auto]"
              >
                <select
                  name="serviceId"
                  defaultValue={question.serviceId ?? ""}
                  aria-label="Question service"
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">All services</option>
                  {serviceOptions.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
                <input
                  name="question"
                  defaultValue={question.question}
                  required
                  aria-label="Suitability question"
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <select
                  name="flaggedAnswer"
                  defaultValue={question.flaggedAnswer}
                  aria-label="Flagged answer"
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={question.sortOrder}
                  aria-label="Question sort order"
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="submit"
                  className="flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
                >
                  Update
                </button>
              </form>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Applies to: {question.serviceName ?? "All services"}
                </span>
                <form action={toggleSuitabilityQuestionActive.bind(null, question.id)}>
                  <button
                    type="submit"
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                      question.active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {question.active ? "Active" : "Inactive"}
                  </button>
                </form>
                <form action={deleteSuitabilityQuestion.bind(null, question.id)}>
                  <button
                    type="submit"
                    className="flex h-8 items-center rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
          {questions.length === 0 && (
            <div className="rounded-xl border border-border bg-background p-8 text-center text-sm text-muted-foreground">
              No suitability questions yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
