"use client";

import { useEffect, useActionState, useState, startTransition } from "react";
import toast from "react-hot-toast";
import { Select } from "@/ui/components";

interface ServiceOption {
  id: string;
  name: string;
}

interface QuestionRow {
  id: string;
  serviceId: string | null;
  serviceName: string | null;
  question: string;
  flaggedAnswer: string;
  sortOrder: number;
  active: boolean;
}

export function SuitabilityForms({
  questions,
  serviceOptions,
  createAction,
  updateAction,
  toggleAction,
  deleteAction,
}: {
  questions: QuestionRow[];
  serviceOptions: ServiceOption[];
  createAction: (data: FormData) => Promise<{ ok: boolean; error?: string }>;
  updateAction: (id: string, data: FormData) => Promise<{ ok: boolean; error?: string }>;
  toggleAction: (id: string) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
}) {
  const [createServiceId, setCreateServiceId] = useState("");
  const [createFlaggedAnswer, setCreateFlaggedAnswer] = useState("yes");

  // Edit state per question
  const [editStates, setEditStates] = useState<Record<string, { serviceId: string; flaggedAnswer: string }>>({});

  const getEditState = (q: QuestionRow) =>
    editStates[q.id] ?? { serviceId: q.serviceId ?? "", flaggedAnswer: q.flaggedAnswer };

  const setEditState = (id: string, patch: Partial<{ serviceId: string; flaggedAnswer: string }>) => {
    setEditStates((prev) => ({
      ...prev,
      [id]: { ...getEditState(questions.find((q) => q.id === id)!), ...patch },
    }));
  };

  const [createState, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      return createAction(formData);
    },
    null as { ok: boolean; error?: string } | null,
  );

  useEffect(() => {
    if (createState?.ok) {
      toast.success("Question created");
      startTransition(() => {
        setCreateServiceId("");
        setCreateFlaggedAnswer("yes");
      });
    } else if (createState?.ok === false && createState.error) {
      toast.error(createState.error);
    }
  }, [createState]);

  return (
    <>
      {/* Create form */}
      <form
        action={formAction}
        className="mt-6 grid items-end gap-4 rounded-xl border border-border bg-background p-5 lg:grid-cols-[1.5fr_3fr_140px_100px_auto]"
      >
        <div>
          <label htmlFor="serviceId" className="mb-1.5 block text-sm font-semibold">
            Service
          </label>
          <Select
            id="serviceId"
            name="serviceId"
            value={createServiceId}
            onChange={setCreateServiceId}
            options={[
              { value: "", label: "All services" },
              ...serviceOptions.map((s) => ({ value: s.id, label: s.name })),
            ]}
            placeholder="All services"
          />
        </div>
        <div>
          <label htmlFor="question" className="mb-1.5 block text-sm font-semibold">
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
          <label htmlFor="flaggedAnswer" className="mb-1.5 block text-sm font-semibold">
            Flagged answer
          </label>
          <Select
            id="flaggedAnswer"
            name="flaggedAnswer"
            value={createFlaggedAnswer}
            onChange={setCreateFlaggedAnswer}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            placeholder="Yes"
          />
        </div>
        <div>
          <label htmlFor="sortOrder" className="mb-1.5 block text-sm font-semibold">
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
        <button
          type="submit"
          disabled={isPending}
          className="flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {isPending ? "Creating..." : "Create"}
        </button>
      </form>

      {/* Question list */}
      <div className="mt-6 space-y-3">
        {questions.map((q) => {
          const editState = getEditState(q);

          return (
            <div key={q.id} className="rounded-xl border border-border bg-background p-5">
              <form
                action={async (formData) => {
                  const result = await updateAction(q.id, formData);
                  if (result?.ok) {
                    toast.success("Question updated");
                  } else if (result?.error) {
                    toast.error(result.error);
                  }
                }}
                className="grid items-end gap-4 lg:grid-cols-[1.5fr_3fr_140px_100px_auto]"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Service</label>
                  <Select
                    name="serviceId"
                    value={editState.serviceId}
                    onChange={(v) => setEditState(q.id, { serviceId: v })}
                    options={[
                      { value: "", label: "All services" },
                      ...serviceOptions.map((s) => ({ value: s.id, label: s.name })),
                    ]}
                    placeholder="All services"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Question</label>
                  <input
                    name="question"
                    defaultValue={q.question}
                    required
                    aria-label="Suitability question"
                    className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Flagged answer</label>
                  <Select
                    name="flaggedAnswer"
                    value={editState.flaggedAnswer}
                    onChange={(v) => setEditState(q.id, { flaggedAnswer: v })}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                    ]}
                    placeholder="Yes"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Sort</label>
                  <input
                    name="sortOrder"
                    type="number"
                    defaultValue={q.sortOrder}
                    aria-label="Question sort order"
                    className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <button
                  type="submit"
                  className="flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold transition-colors hover:bg-surface-muted"
                >
                  Update
                </button>
              </form>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">
                  Applies to: {q.serviceName ?? "All services"}
                </span>
                <form action={toggleAction.bind(null, q.id)}>
                  <button
                    type="submit"
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      q.active
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${q.active ? "bg-green-600" : "bg-red-600"}`} />
                    {q.active ? "Active" : "Inactive"}
                  </button>
                </form>
                <form action={deleteAction.bind(null, q.id)}>
                  <button
                    type="submit"
                    className="flex h-8 items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          );
        })}
        {questions.length === 0 && (
          <div className="rounded-xl border border-border bg-background p-8 text-center text-sm text-muted-foreground">
            No suitability questions yet.
          </div>
        )}
      </div>
    </>
  );
}
