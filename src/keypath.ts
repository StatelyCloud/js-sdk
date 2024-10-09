import { Code } from "@connectrpc/connect";
import { StatelyError } from "./errors.js";

export type KeyIDInput = string | number | bigint | Uint8Array;

/**
 * Convert a potential key ID into a string for a key path. Key IDs can be
 * strings, numbers, bigints, or Uint8Arrays representing binary (e.g. uuids).
 *
 * @example
 * keyId("123"); // "123"
 * keyId(123); // "123"
 * keyId(BigInt(123)); // "123"
 * keyId(new Uint8Array([1, 2, 3])); // "AQID"
 */
export function keyId(input: KeyIDInput): string {
  if (typeof input === "string") {
    return input;
  }
  if (typeof input === "number") {
    if (!Number.isInteger(input) || input < 0) {
      throw new StatelyError(
        "InvalidKeyId",
        `Key IDs must be positive integers, got: ${input}`,
        Code.InvalidArgument,
      );
    }
    return input.toString();
  }
  if (typeof input === "bigint") {
    return input.toString();
  }
  if (input instanceof Uint8Array) {
    return bytesToBase64(input);
  }
  throw new StatelyError(
    "InvalidKeyId",
    `Invalid key ID type: ${input as any}`,
    Code.InvalidArgument,
  );
}

/**
 * keyPath is a template string tag that can be used to create a key path from
 * strings and key IDs. Key IDs can be strings, numbers, bigints, or Uint8Arrays.
 * The key IDs will be converted to strings using keyId.
 * @example
 * const k = keyPath`/users-${userId}/posts-${postId}`;
 */
export function keyPath<T extends KeyIDInput[]>(strings: TemplateStringsArray, ...expr: T) {
  let result = "";
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < expr.length) {
      result += keyId(expr[i]);
    }
  }

  return result;
}

export function joinKeyPaths(...paths: string[]) {
  return paths
    .map((p) => {
      if (!p.startsWith("/")) {
        p = `/${p}`;
      }
      if (p.endsWith("/")) {
        p = p.slice(0, -1);
      }
      return p;
    })
    .join("");
}

// function base64ToBytes(base64: string): Uint8Array {
//   const binString = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
//   return Uint8Array.from(binString, (m) => m.codePointAt(0)!);
// }

function bytesToBase64(bytes: Uint8Array): string {
  let binString = "";
  for (const byte of bytes) {
    binString += String.fromCodePoint(byte);
  }
  return btoa(binString).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
