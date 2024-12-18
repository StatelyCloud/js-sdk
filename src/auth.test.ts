import { ServiceImpl } from "@connectrpc/connect";
import { fastifyConnectPlugin } from "@connectrpc/connect-fastify";
import { createConnectTransport, Http2SessionManager } from "@connectrpc/connect-node";
import { expect } from "expect";
import fastify from "fastify";
import { afterEach, beforeEach, describe, it } from "node:test";
import { AuthService } from "./api/auth/service_pb.js";
import { accessKeyAuth } from "./auth.js";

const unmockedFetch = global.fetch;
let abortController: AbortController | undefined = undefined;
beforeEach(() => {
  abortController = new AbortController();
});

afterEach(() => {
  abortController?.abort();
  global.fetch = unmockedFetch;
});

describe("accessKeyAuth test", () => {
  it("fetches token correctly", async () => {
    let error = false;

    const [getToken, close] = await mockAuthServer(async (_request, _context) => {
      if (error) {
        throw Error("boom");
      } else {
        return {
          authToken: "test-token",
          expiresInS: 100000n,
        };
      }
    });

    try {
      // check that it returns the token we expect
      expect(await getToken()).toEqual("test-token");

      error = true;

      // call getToken again and check that it returns the same value without making a network request
      // which would explode
      expect(await getToken()).toEqual("test-token");
    } finally {
      await close();
    }
  });

  it("dedupes concurrent refresh requests", async () => {
    let count = 0;
    const [getToken, close] = await mockAuthServer(async (_request, _context) => {
      // return mock response after 100ms
      const token = count;
      count++;
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        authToken: `${token}`,
        expiresInS: 100000n,
      };
    });
    try {
      const promises = Array.from(Array(10), async () => getToken());
      const results = await Promise.all(promises);
      for (const r of results) {
        expect(r).toEqual("0");
      }
    } finally {
      await close();
    }
  });

  it("expires auth based on response", async () => {
    // mock fetch
    let token = "test-token";
    const [getToken, close] = await mockAuthServer(async (_request, _context) => ({
      authToken: `${token}`,
      expiresInS: 1n,
    }));
    try {
      expect(await getToken()).toEqual("test-token");
      token = "new-token";
      // immediately check the token again, before it expires
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(await getToken()).toEqual("test-token");

      // Now wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));
      expect(await getToken()).toEqual("new-token");
    } finally {
      await close();
    }
  });

  it("handles errors refreshing auth", async () => {
    // mock fetch
    const token = "test-token";
    let fail = true;
    const [getToken, close] = await mockAuthServer(async (_request, _context) => {
      if (fail) {
        fail = false;
        throw Error("Bogus");
      }
      return {
        authToken: `${token}`,
        expiresInS: 1n,
      };
    });

    try {
      expect(await getToken()).toEqual("test-token");
    } finally {
      await close();
    }
  });
});

async function mockAuthServer(fn: ServiceImpl<typeof AuthService>["getAuthToken"]) {
  const abortController = new AbortController();

  const server = fastify({
    http2: true,
  });
  await server.register(fastifyConnectPlugin, {
    routes: (router) => {
      router.service(
        AuthService,
        {
          getAuthToken: fn,
        },
        { shutdownSignal: abortController.signal },
      );
    },
  });
  await server.listen({ host: "localhost", port: 0, signal: abortController.signal });

  // generate the getToken func
  const baseUrl = `http://localhost:${server.addresses()[0].port}`;
  const sessionManager = new Http2SessionManager(baseUrl);
  const authTransport = createConnectTransport({
    baseUrl,
    httpVersion: "2",
    sessionManager,
  });
  const getToken = accessKeyAuth({
    accessKey: "test-access-key",
    abortSignal: abortController?.signal,
  })(authTransport, () => sessionManager.abort());

  return [
    getToken,
    async () => {
      abortController.abort();
      await server.close();
    },
  ] as const;
}
