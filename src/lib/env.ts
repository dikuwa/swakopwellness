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
  R2_ENDPOINT: optionalString,
  R2_PUBLIC_BASE_URL: optionalString,
  RESEND_API_KEY: optionalString,
  RESEND_FROM_EMAIL: optionalString,
  OPENAI_API_KEY: optionalString,
  OPENAI_MODEL: optionalString,
  SENTRY_DSN: optionalString,
  CRON_SECRET: optionalString,
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(input: Record<string, string | undefined>) {
  return envSchema.safeParse(input);
}

export const env = {
  get RESEND_API_KEY() {
    return process.env.RESEND_API_KEY || "";
  },
  get RESEND_FROM_EMAIL() {
    return process.env.RESEND_FROM_EMAIL || "";
  },
  get DATABASE_URL() {
    return process.env.DATABASE_URL || "";
  },
  get NEXT_PUBLIC_APP_URL() {
    return process.env.NEXT_PUBLIC_APP_URL || "";
  },
  get R2_ACCOUNT_ID() {
    return process.env.R2_ACCOUNT_ID || "";
  },
  get R2_ACCESS_KEY_ID() {
    return process.env.R2_ACCESS_KEY_ID || "";
  },
  get R2_SECRET_ACCESS_KEY() {
    return process.env.R2_SECRET_ACCESS_KEY || "";
  },
  get R2_BUCKET_NAME() {
    return process.env.R2_BUCKET_NAME || "";
  },
  get R2_ENDPOINT() {
    return process.env.R2_ENDPOINT || "";
  },
  get R2_PUBLIC_BASE_URL() {
    return process.env.R2_PUBLIC_BASE_URL || "";
  },
};
