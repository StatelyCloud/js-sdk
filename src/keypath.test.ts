import { expect } from "expect";
import { describe, it } from "node:test";
import { keyId, keyPath } from "./keypath.js";

describe("keyId", () => {
  it("should convert a string key ID to a string", () => {
    const result = keyId("123");
    expect(result).toBe("123");
  });

  it("should convert a number key ID to a string", () => {
    const result = keyId(123);
    expect(result).toBe("123");
  });

  it("should convert a bigint key ID to a string", () => {
    const result = keyId(BigInt(123));
    expect(result).toBe("123");
  });

  it("should convert a Uint8Array key ID to a string", () => {
    const result = keyId(new Uint8Array([1, 2, 3]));
    expect(result).toBe("~AQID");
  });
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
    expect(result).toBe("/users-~AQID/posts-~BAUG");
  });
});
