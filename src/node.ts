import { Code, createClient, type Interceptor } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";
import { initServerAuth } from "./auth.js";
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
  authTokenProvider = initServerAuth(),
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
    throw new StatelyError(
      "InvalidArgument",
      "authTokenProvider is required",
      Code.InvalidArgument,
    );
  }

  // TODO: We're installing all the middlewares here by default, but in the
  // future we could expose a custom client builder that only installs (and pays
  // for in bundle size) the middlewares a user wants.

  const interceptors: Interceptor[] = [
    requestIdMiddleware,
    createAuthMiddleware(authTokenProvider),
    // retryMiddleware,
  ];

  const transport = createConnectTransport({
    baseUrl: makeEndpoint(endpoint, region),
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
