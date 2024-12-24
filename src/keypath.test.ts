import { expect } from "expect";
import { describe, it } from "node:test";
import { keyId, keyPath } from "./keypath.js";

describe("keyId", () => {
  for (const [name, input, expected] of [
    ["string", "123", "123"],
    ["number", 123, "123"],
    ["bigint", 123n, "123"],
    ["Uint8Array", new Uint8Array([1, 2, 3]), "AQID"],
    ["string with slashes", "foo/bar", "foo%/bar"],
    ["string with percents", "foo%bar", "foo%%bar"],
  ] as const) {
    it(`should convert a ${name} key ID to a string`, () => {
      const result = keyId(input);
      expect(result).toBe(expected);
    });
  }
});

describe("keyPath", () => {
  it("should create a key path with string and number key IDs", () => {
    const userId = "user123";
    const postId = 456;
    const result = keyPath`/users-${userId}/posts-${postId}`;
    expect(result).toBe("/users-user123/posts-456");
  });

  it("should create a key path with bigint key IDs", () => {
    const userId = BigInt(123);
    const postId = BigInt(456);
    const result = keyPath`/users-${userId}/posts-${postId}`;
    expect(result).toBe("/users-123/posts-456");
  });

  it("should create a key path with Uint8Array key IDs", () => {
    const userId = new Uint8Array([1, 2, 3]);
    const postId = new Uint8Array([4, 5, 6]);
    const result = keyPath`/users-${userId}/posts-${postId}`;
    expect(result).toBe("/users-AQID/posts-BAUG");
  });
});
