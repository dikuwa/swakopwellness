import { cache } from "react";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export const getDb = cache(() => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required for database access.");
  }

  const queryClient = postgres(connectionString, { prepare: false });
  return drizzle(queryClient, { schema });
});
