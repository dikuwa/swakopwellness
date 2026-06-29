import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateEnv } from "./env";

describe("validateEnv", () => {
  it("accepts the required phase-zero environment shape", () => {
    const result = validateEnv({
      DATABASE_URL: "postgresql://user:password@example.com:5432/app",
      DIRECT_URL: "postgresql://user:password@example.com:5432/app",
      AUTH_SECRET: "a-secret-value-with-at-least-thirty-two-characters",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });

    assert.equal(result.success, true);
  });

  it("rejects missing required provider values", () => {
    const result = validateEnv({});

    assert.equal(result.success, false);
  });
});
