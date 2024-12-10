import { ServiceImpl } from "@connectrpc/connect";
import { fastifyConnectPlugin } from "@connectrpc/connect-fastify";
import { expect } from "expect";
import fastify from "fastify";
import { afterEach, beforeEach, describe, it, type Mock, mock } from "node:test";
import { AuthService } from "./api/auth/service_pb.js";
import { accessKeyAuth, initServerAuth } from "./auth.js";

const unmockedFetch = global.fetch;
let abortController: AbortController | undefined = undefined;
beforeEach(() => {
  abortController = new AbortController();
});

afterEach(() => {
  abortController?.abort();
  global.fetch = unmockedFetch;
});

describe("initServerAuth test", () => {
  it("fetches token correctly", async () => {
    // mock fetch
    global.fetch = mock.fn((input: RequestInfo | URL, init?: RequestInit) => {
      // make assertions
      expect(input).toEqual("test-domain/oauth/token");
      expect(init).toHaveProperty("method", "POST");
      expect(init).toHaveProperty("cache", "no-store");
      expect(init).toHaveProperty("headers.Content-Type", "application/json");
      expect(JSON.parse(init!.body as string)).toEqual({
        client_id: "test-id",
        client_secret: "test-secret",
        audience: "test-audience",
        grant_type: "client_credentials",
      });
      // return mock response
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ access_token: "test-token", expires_in: 100000 }),
      });
    }) as Mock<typeof fetch>;

    // generate the getToken func
    const getToken = initServerAuth({
      clientID: "test-id",
      clientSecret: "test-secret",
      authDomain: "test-domain",
      audience: "test-audience",
      abortSignal: abortController?.signal,
    })();

    // check that it returns the token we expect
    expect(await getToken()).toEqual("test-token");

    // override global fetch to throw an error
    global.fetch = mock.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      throw Error("boom");
    }) as Mock<typeof fetch>;

    // call getToken again and check that it returns the same value without making a network request
    // which would explode
    expect(await getToken()).toEqual("test-token");
  });

  it("dedupes concurrent refresh requests", async () => {
    // mock fetch
    let count = 0;
    global.fetch = mock.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      // return mock response after 100ms
      const token = count;
      count++;
      await new Promise((resolve) => setTimeout(resolve, 100));
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ access_token: `${token}`, expires_in: 100000 }),
      });
    }) as Mock<typeof fetch>;

    // generate the getToken func
    const getToken = initServerAuth({
      clientID: "test",
      clientSecret: "test",
      abortSignal: abortController?.signal,
    })();

    const promises = Array.from(Array(10), async () => getToken());
    const results = await Promise.all(promises);
    for (const r of results) {
      expect(r).toEqual("0");
    }
  });

  it("expires auth based on response", async () => {
    // mock fetch
    let token = "test-token";
    global.fetch = mock.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ access_token: `${token}`, expires_in: 1 }),
      }),
    ) as Mock<typeof fetch>;

    // generate the getToken func
    const getToken = initServerAuth({
      clientID: "test",
      clientSecret: "test",
      abortSignal: abortController?.signal,
    })();

    expect(await getToken()).toEqual("test-token");
    token = "new-token";
    // immediately check the token again, before it expires
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(await getToken()).toEqual("test-token");

    // Now wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect(await getToken()).toEqual("new-token");
  });

  it("handles errors refreshing auth", async () => {
    // mock fetch
    const token = "test-token";
    let fail = true;
    global.fetch = mock.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      if (fail) {
        fail = false;
        return Promise.reject(new Error("Bogus"));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ access_token: `${token}`, expires_in: 1 }),
      });
    }) as Mock<typeof fetch>;

    // generate the getToken func
    const getToken = initServerAuth({
      clientID: "test",
      clientSecret: "test",
      abortSignal: abortController?.signal,
    })();

    expect(await getToken()).toEqual("test-token");
  });
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
  const getToken = accessKeyAuth({
    accessKey: "test-access-key",
    abortSignal: abortController?.signal,
  })(`http://localhost:${server.addresses()[0].port}`);

  return [
    getToken,
    async () => {
      abortController.abort();
      await server.close();
    },
  ] as const;
}
