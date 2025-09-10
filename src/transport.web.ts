import { Code } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { StatelyError } from "./errors.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { createBaseInterceptors, createClientFactory, makeEndpoint } from "./transport.js";
import type { ClientFactory, TransportOptions } from "./types.js";

/**
 * Creates a configuration for a Stately Cloud API client, to be used from
 * web browsers and web workers. This allows us to share connections and
 * structures between various API clients - it gets passed into functions
 * that construct clients for individual APIs.
 */
export function webTransport({
  authTokenProvider,
  endpoint,
  region,
}: Omit<TransportOptions, "noAuth"> = {}): ClientFactory {
  // Check for browser/web worker environment
  if (typeof fetch === "undefined") {
    throw new StatelyError(
      "IncompatibleEnvironment",
      "webTransport can only be used in environments with native `fetch` support (modern browsers, web workers, or Node.js 18+).",
      Code.FailedPrecondition,
    );
  }

  // TODO: We're installing all the middlewares here by default, but in the
  // future we could expose a custom client builder that only installs (and pays
  // for in bundle size) the middlewares a user wants.

  if (!authTokenProvider) {
    throw new StatelyError(
      "MissingAuthTokenProvider",
      "An auth token provider is required to create a web client.",
      Code.InvalidArgument,
    );
  }

  const baseUrl = makeEndpoint(endpoint, region);

  // Create a simple transport for auth token retrieval (no auth required)
  const authTransport = createConnectTransport({
    baseUrl,
    // Use fetch directly - no session management needed for web
    fetch: globalThis.fetch,
    interceptors: [requestIdMiddleware],
  });

  const interceptors = createBaseInterceptors();
  interceptors.push(
    createAuthMiddleware(
      authTokenProvider(authTransport, () => {
        // In web environments, connection cleanup is handled by the browser
        // We could potentially implement request cancellation here if needed
      }),
    ),
  );

  const transport = createConnectTransport({
    baseUrl,
    // fetch: globalThis.fetch as typeof fetch,
    interceptors,
  });

  return createClientFactory(transport);
}
