"use server";

import { revokeCurrentSession } from "@/auth/session";
import { redirect } from "next/navigation";

export async function logoutAction() {
  await revokeCurrentSession();
  redirect("/login");
}
