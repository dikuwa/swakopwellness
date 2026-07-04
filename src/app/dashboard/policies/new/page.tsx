import type { Metadata } from "next";
import { requirePermission } from "@/auth/session";
import { createPolicy } from "@/policies/actions";
import { PolicyForm } from "../policy-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Policy — Dashboard",
};

export default async function NewPolicyPage() {
  await requirePermission("settings:manage");
  return <PolicyForm action={createPolicy} />;
}
