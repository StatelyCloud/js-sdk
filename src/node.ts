import { Code, createClient, type Interceptor } from "@connectrpc/connect";
import { createConnectTransport, Http2SessionManager } from "@connectrpc/connect-node";
import { accessKeyAuth } from "./auth.js";
import { StatelyError } from "./errors.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import type { ClientFactory, ClientOptions } from "./types.js";

/**
 * Creates a configuration for a Stately Cloud API client, to be used from
 * NodeJS. This allows us to share connections and structures between various
 * API clients - it gets passed into functions that construct clients for
 * individual APIs.
 */
export function createNodeClient({
  authTokenProvider,
  endpoint,
  region,
}: ClientOptions = {}): ClientFactory {
  if (!("Headers" in global)) {
    throw new StatelyError(
      "IncompatibleEnvironment",
      "createNodeClient can only be used in environments with a `Headers` constructor that's globally available. You may need a newer Node version, or to install a polyfill for `fetch`.",
      Code.FailedPrecondition,
    );
  }
  // TODO: We're installing all the middlewares here by default, but in the
  // future we could expose a custom client builder that only installs (and pays
  // for in bundle size) the middlewares a user wants.

  if (!authTokenProvider) {
    // try and create an access key auth provider.
    // this will read the access key from the environment variable STATELY_ACCESS_KEY
    // and throw an error if it is not set.
    authTokenProvider = accessKeyAuth();
  }

  const baseUrl = makeEndpoint(endpoint, region);

  const sessionManager = new Http2SessionManager(baseUrl);
  const authTransport = createConnectTransport({
    baseUrl,
    httpVersion: "2",
    interceptors: [requestIdMiddleware],
    sessionManager,
  });

  const interceptors: Interceptor[] = [
    requestIdMiddleware,
    createAuthMiddleware(authTokenProvider(authTransport, () => sessionManager.abort())),
    // retryMiddleware,
  ];

  const transport = createConnectTransport({
    baseUrl,
    httpVersion: "2",
    interceptors,
  });

  return (definition) => createClient(definition, transport);
}

export function makeEndpoint(endpoint: string | undefined, region: string | undefined): string {
  if (endpoint) {
    return endpoint;
  }
  if (!region) {
    return "https://api.stately.cloud";
  }
  if (region.startsWith("aws-")) {
    region = region.slice(4);
  }
  return `https://${region}.aws.api.stately.cloud`;
}
