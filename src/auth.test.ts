import { expect } from "expect";
import { after, before, describe, it, type Mock, mock } from "node:test";
import { initServerAuth } from "./auth.js";

const unmockedFetch = global.fetch;
let abortController: AbortController | undefined = undefined;
before(() => {
  abortController = new AbortController();
});

after(() => {
  abortController?.abort();
  global.fetch = unmockedFetch;
});

describe("initServerAuth test", () => {
  it("fetches token correctly", async () => {
    // mock fetch
    global.fetch = mock.fn((input: RequestInfo | URL, init?: RequestInit | undefined) => {
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
    });

    // check that it returns the token we expect
    expect(await getToken()).toEqual("test-token");

    // override global fetch to throw an error
    global.fetch = mock.fn((_input: RequestInfo | URL, _init?: RequestInit | undefined) => {
      throw Error("boom");
    }) as Mock<typeof fetch>;

    // call getToken again and check that it returns the same value without making a network request
    // which would explode
    expect(await getToken()).toEqual("test-token");
  });

  it("dedupes concurrent refresh requests", async () => {
    // mock fetch
    let count = 0;
    global.fetch = mock.fn(async (_input: RequestInfo | URL, _init?: RequestInit | undefined) => {
      // return mock response after 100ms
      const token = count;
      count++;
      await new Promise((resolve) => setTimeout(resolve, 100));
      return Promise.resolve({
        json: () => Promise.resolve({ access_token: `${token}`, expires_in: 100000 }),
      });
    }) as Mock<typeof fetch>;

    // generate the getToken func
    const getToken = initServerAuth({
      clientID: "test",
      clientSecret: "test",
      abortSignal: abortController?.signal,
    });

    const promises = Array.from(Array(10), async () => getToken());
    const results = await Promise.all(promises);
    for (const r of results) {
      expect(r).toEqual("0");
    }
  });

  it("expires auth based on response", async () => {
    // mock fetch
    let token = "test-token";
    global.fetch = mock.fn(async (_input: RequestInfo | URL, _init?: RequestInit | undefined) =>
      Promise.resolve({
        json: () => Promise.resolve({ access_token: `${token}`, expires_in: 0 }),
      }),
    ) as Mock<typeof fetch>;

    // generate the getToken func
    const getToken = initServerAuth({
      clientID: "test",
      clientSecret: "test",
      abortSignal: abortController?.signal,
    });

    expect(await getToken()).toEqual("test-token");
    token = "new-token";
    // allow some time for the token update to propagate
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(await getToken()).toEqual("new-token");
  });
});
