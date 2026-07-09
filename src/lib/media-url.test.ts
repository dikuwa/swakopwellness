import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getMediaUrl } from "./media-url";

describe("getMediaUrl", () => {
  it("uses the media proxy when an asset id exists", () => {
    assert.equal(getMediaUrl({ id: "asset-id", publicUrl: "/uploads/avatar.png" }), "/api/media/asset-id");
  });

  it("falls back to public URLs when no asset id exists", () => {
    assert.equal(getMediaUrl({ id: null, publicUrl: "/uploads/avatar.png" }), "/uploads/avatar.png");
  });
});
