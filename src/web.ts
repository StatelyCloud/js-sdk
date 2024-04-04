import { deadlineMiddleware } from "nice-grpc-client-middleware-deadline";
import { retryMiddleware } from "nice-grpc-client-middleware-retry";
import { createChannel, createClientFactory } from "nice-grpc-web";
import { createAuthMiddleware } from "./auth-middleware.js";
import { devtoolsUnaryLoggingMiddleware } from "./devtools-middleware.js";
import { AllCallOptions, Client, ClientOptions } from "./index.js";
import { RawClient } from "./nice-types/client.js";
import { NormalizedServiceDefinition } from "./nice-types/service-definition.js";
import { requestIdMiddleware } from "./request-id-middleware.js";

export { ClientError, Status } from "nice-grpc-common";

/**
 * Creates a configuration for a Stately Cloud API client to be used from web
 * browsers and other environments that use the "fetch" API. This allows us to
 * share connections and structures between various API clients - it gets passed
 * into functions that construct clients for individual APIs.
 *
 * Note: This client cannot use the `transaction` API, as it requires a
 * full-duplex HTTP client library which is only available with the NodeJS
 * client.
 */
export function createWebClient({
  authTokenProvider,
  endpoint = "https://api.stately.cloud",
}: Partial<ClientOptions> = {}): Client {
  if (!authTokenProvider) {
    throw new Error("authTokenProvider is required for now");
  }
  const requiredOptions: ClientOptions = {
    authTokenProvider,
    endpoint,
  };

  // TODO: We're installing all the middlewares here by default, but in the
  // future we could expose a custom client builder that only installs (and pays
  // for in bundle size) the middlewares a user wants.

  const channel = createChannel(requiredOptions.endpoint);
  let clientFactory = createClientFactory()
    .use(requestIdMiddleware)
    .use(createAuthMiddleware(requiredOptions.authTokenProvider))
    // https://github.com/deeplay-io/nice-grpc/tree/master/packages/nice-grpc-client-middleware-retry
    .use(retryMiddleware)
    // https://github.com/deeplay-io/nice-grpc/tree/master/packages/nice-grpc-client-middleware-deadline
    .use(deadlineMiddleware);

  // https://github.com/deeplay-io/nice-grpc/tree/master/packages/nice-grpc-client-middleware-devtools
  // TODO: maybe require this to be passed in as an option? Or only include it in dev builds?
  // TODO: I'm only installing unary middleware to save bundle size, but if we
  // ever have stream APIs, switch to the combined middleware.
  if ("window" in globalThis && "__GRPCWEB_DEVTOOLS__" in globalThis.window) {
    // devtoolsUnaryLoggingMiddleware doesn't work on node envs so make sure that we're running in the browser
    // before we enable it
    clientFactory = clientFactory.use(devtoolsUnaryLoggingMiddleware);
  }

  return {
    create: (definition) => ({
      _client: clientFactory.create(definition, channel) as RawClient<
        NormalizedServiceDefinition<typeof definition>,
        AllCallOptions
      >,
      supportsBidi: false,
    }),
  };
}
