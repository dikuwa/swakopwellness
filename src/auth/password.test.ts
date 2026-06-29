import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies the original password and rejects a different password", async () => {
    const passwordHash = await hashPassword("correct horse battery staple");

    assert.equal(await verifyPassword("correct horse battery staple", passwordHash), true);
    assert.equal(await verifyPassword("incorrect horse battery staple", passwordHash), false);
  });
});
