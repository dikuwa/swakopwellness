import { validateEnv } from "../src/lib/env";

const result = validateEnv(process.env);

if (!result.success) {
  console.error("Environment validation failed:");
  for (const issue of result.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

console.log("Environment validation passed.");
