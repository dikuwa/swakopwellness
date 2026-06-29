"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { verifyPassword } from "@/auth/password";
import { createSession } from "@/auth/session";
import { loginSchema } from "@/auth/validation";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";

export async function loginAction(formData: FormData) {
  const db = getDb();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) redirect("/login?error=invalid");

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash, active: users.active })
    .from(users)
    .where(eq(sql`lower(${users.email})`, parsed.data.email.toLowerCase()))
    .limit(1);

  if (!user || !user.active || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    redirect("/login?error=invalid");
  }

  await createSession(user.id);
  redirect("/dashboard");
}
