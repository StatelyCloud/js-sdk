import { expect } from "expect";
import { describe, it } from "node:test";
import { makeEndpoint } from "./node.js";

describe("makeEndpoint", () => {
  describe("makeEndpoint", () => {
    it("should return the provided endpoint if it is defined", () => {
      const endpoint = "https://custom.endpoint";
      const result = makeEndpoint(endpoint, "foo");
      expect(result).toBe(endpoint);
    });

    it("should return the default endpoint if neither endpoint nor region is defined", () => {
      const result = makeEndpoint(undefined, undefined);
      expect(result).toBe("https://api.stately.cloud");
    });

    it("should return the region-based endpoint if region is defined", () => {
      const region = "us-west-1";
      const result = makeEndpoint(undefined, region);
      expect(result).toBe(`https://${region}.aws.api.stately.cloud`);
    });

    it("should strip 'aws-' prefix from region if it starts with 'aws-'", () => {
      const region = "aws-us-west-1";
      const result = makeEndpoint(undefined, region);
      expect(result).toBe("https://us-west-1.aws.api.stately.cloud");
    });
  });
});
