import { describe, expect, test } from "@jest/globals";
import { itemKeyToString, parseKeyPath } from "./data.js";

describe("parseKeyPath", () => {
  test.each([
    ["/test-123", [{ itemType: "test", id: "123" }]],
    ["/test-", [{ itemType: "test", id: "" }]],
    ["/test", [{ itemType: "test", id: undefined }]],
    [
      "/test-123/test2-456",
      [
        { itemType: "test", id: "123" },
        { itemType: "test2", id: "456" },
      ],
    ],
    [
      "/test-123/-456",
      [
        { itemType: "test", id: "123" },
        { itemType: "", id: "456" },
      ],
    ],
  ])("parses %s", (keyPath, expected) => {
    expect(parseKeyPath(keyPath)).toEqual(expected);
  });
});

describe("itemKeyToString", () => {
  test.each([
    ["/test-123", [{ itemType: "test", id: "123" }]],
    ["/test", [{ itemType: "test", id: undefined }]],
    [
      "/test-123/test2-456",
      [
        { itemType: "test", id: "123" },
        { itemType: "test2", id: "456" },
      ],
    ],
    [
      "/test-123/-456",
      [
        { itemType: "test", id: "123" },
        { itemType: "", id: "456" },
      ],
    ],
  ])("formats to %s", (keyPathStr, keyPath) => {
    expect(itemKeyToString(keyPath)).toEqual(keyPathStr);
  });
});
