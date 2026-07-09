"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Select } from "@/ui/components";

interface Role {
  id: string;
  name: string;
}

interface UserFormData {
  userId?: string;
  name: string;
  email: string;
  active: boolean;
  roleName: string;
}

interface Props {
  roles: Role[];
  action: (
    data: FormData,
  ) => Promise<{ ok: boolean; error?: string; userId?: string }>;
  initialData?: UserFormData;
}

export function UserForm({ roles, action, initialData }: Props) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [roleValue, setRoleValue] = useState(initialData?.roleName ?? "");

  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => action(formData),
    null as { ok: boolean; error?: string; userId?: string } | null,
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success(isEdit ? "User updated" : "User created");
      router.push("/dashboard/users");
    } else if (state?.ok === false && state.error) {
      toast.error(state.error);
    }
  }, [state, router, isEdit]);

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-[-0.035em]">
          {isEdit ? "Edit User" : "New User"}
        </h1>

        {state?.ok === false && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <form action={formAction} className="mt-8 space-y-8">
          {isEdit && (
            <input type="hidden" name="userId" value={initialData!.userId} />
          )}

          <div className="space-y-6 rounded-xl border border-border bg-background p-6">
            <h2 className="text-lg font-semibold">Account Details</h2>

            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-semibold">
                Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={initialData?.name ?? ""}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={initialData?.email ?? ""}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
                Password {isEdit ? "" : "*"}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                {...(isEdit ? {} : { required: true })}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {isEdit && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Leave blank to keep current password.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="mb-1.5 block text-sm font-semibold">
                Role *
              </label>
              <Select
                id="role"
                name="role"
                required
                value={roleValue}
                onChange={setRoleValue}
                options={roles.map((r) => ({ value: r.name, label: r.name }))}
                placeholder="Select role"
              />
            </div>

            {isEdit && (
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={initialData?.active ?? true}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                Active
              </label>
            )}
          </div>

          <div className="flex items-center gap-4 border-t border-border pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? "Saving..." : isEdit ? "Update User" : "Create User"}
            </button>
            <Link
              href="/dashboard/users"
              className="flex h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
            >
              Cancel
            </Link>
          </div>
        </form>
    </>
  );
}
