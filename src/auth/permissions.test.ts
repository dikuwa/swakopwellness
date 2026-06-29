import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasPermission, permissionCodes, rolePermissionDefaults } from "./permissions";

describe("permissions", () => {
  it("gives Owner every defined permission", () => {
    assert.deepEqual(new Set(rolePermissionDefaults.Owner), new Set(permissionCodes));
  });

  it("does not give Staff sensitive financial permissions", () => {
    assert.equal(hasPermission(rolePermissionDefaults.Staff, "financials:view"), false);
    assert.equal(hasPermission(rolePermissionDefaults.Staff, "payments:record"), false);
  });
});
