import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sanitizeUrl } from "./storage";

describe("sanitizeUrl", () => {
  it("returns a normal https:// endpoint unchanged", () => {
    const url = "https://6e714696196c6df7447c42c5c32067e8.r2.cloudflarestorage.com";
    assert.equal(sanitizeUrl(url), url);
  });

  it("strips trailing slashes from https:// endpoint", () => {
    const url = "https://6e714696196c6df7447c42c5c32067e8.r2.cloudflarestorage.com";
    assert.equal(sanitizeUrl(`${url}/`), url);
    assert.equal(sanitizeUrl(`${url}//`), url);
    assert.equal(sanitizeUrl(`${url}///`), url);
  });

  it("fixes duplicate https:https:// protocol", () => {
    const url = "https://6e714696196c6df7447c42c5c32067e8.r2.cloudflarestorage.com";
    const malformed = `https:${url}`;
    assert.equal(sanitizeUrl(malformed), url);
  });

  it("fixes duplicate http:http:// protocol", () => {
    const url = "http://6e714696196c6df7447c42c5c32067e8.r2.cloudflarestorage.com";
    const malformed = `http:${url}`;
    assert.equal(sanitizeUrl(malformed), url);
  });

  it("fixes https:http:// mismatch", () => {
    const url = "http://6e714696196c6df7447c42c5c32067e8.r2.cloudflarestorage.com";
    const malformed = `https:${url}`;
    assert.equal(sanitizeUrl(malformed), url);
  });

  it("fixes duplicate with trailing slash", () => {
    const url = "https://6e714696196c6df7447c42c5c32067e8.r2.cloudflarestorage.com";
    const malformed = `https:${url}/`;
    assert.equal(sanitizeUrl(malformed), url);
  });

  it("returns plain account ID unchanged (no protocol)", () => {
    const id = "6e714696196c6df7447c42c5c32067e8";
    assert.equal(sanitizeUrl(id), id);
  });

  it("handles empty string", () => {
    assert.equal(sanitizeUrl(""), "");
  });

  it("handles http:// endpoint", () => {
    const url = "http://localhost:9000";
    assert.equal(sanitizeUrl(url), url);
  });

  it("fixes duplicate http:http:// on localhost", () => {
    const url = "http://localhost:9000";
    const malformed = `http:${url}`;
    assert.equal(sanitizeUrl(malformed), url);
  });
});
