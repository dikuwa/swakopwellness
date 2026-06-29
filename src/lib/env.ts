import { z } from "zod";

const optionalString = z.string().trim().optional().or(z.literal(""));

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters."),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  R2_ACCOUNT_ID: optionalString,
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  R2_BUCKET_NAME: optionalString,
  R2_PUBLIC_BASE_URL: optionalString,
  RESEND_API_KEY: optionalString,
  RESEND_FROM_EMAIL: optionalString,
  OPENAI_API_KEY: optionalString,
  OPENAI_MODEL: optionalString,
  SENTRY_DSN: optionalString,
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(input: Record<string, string | undefined>) {
  return envSchema.safeParse(input);
}
