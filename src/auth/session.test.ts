import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSessionToken, hashSessionToken } from "./token";

describe("session tokens", () => {
  it("creates opaque tokens and stable hashes", () => {
    const token = createSessionToken();

    assert.equal(token.length > 32, true);
    assert.equal(hashSessionToken(token), hashSessionToken(token));
    assert.notEqual(hashSessionToken(token), token);
  });
});
