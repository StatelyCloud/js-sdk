import { createChannel, createClientFactory } from "nice-grpc";
import { deadlineMiddleware } from "nice-grpc-client-middleware-deadline";
import { retryMiddleware } from "nice-grpc-client-middleware-retry";
import { createAuthMiddleware } from "./auth-middleware.js";
import { initServerAuth } from "./auth.js";
import { AllCallOptions, Client, ClientOptions } from "./index.js";
import { RawClient } from "./nice-types/client.js";
import { NormalizedServiceDefinition } from "./nice-types/service-definition.js";
import { requestIdMiddleware } from "./request-id-middleware.js";

/**
 * Creates a configuration for a Stately Cloud API client, to be used from
 * NodeJS. This allows us to share connections and structures between various
 * API clients - it gets passed into functions that construct clients for
 * individual APIs.
 */
export function createNodeClient({
  authTokenProvider = initServerAuth(),
  endpoint = "https://api.stately.cloud",
}: Partial<ClientOptions> = {}): Client {
  const requiredOptions: ClientOptions = {
    authTokenProvider,
    endpoint,
  };

  // TODO: We're installing all the middlewares here by default, but in the
  // future we could expose a custom client builder that only installs (and pays
  // for in bundle size) the middlewares a user wants.

  const channel = createChannel(requiredOptions.endpoint);
  const clientFactory = createClientFactory()
    .use(requestIdMiddleware)
    .use(createAuthMiddleware(requiredOptions.authTokenProvider))
    // https://github.com/deeplay-io/nice-grpc/tree/master/packages/nice-grpc-client-middleware-retry
    .use(retryMiddleware)
    // https://github.com/deeplay-io/nice-grpc/tree/master/packages/nice-grpc-client-middleware-deadline
    .use(deadlineMiddleware);

  return {
    create: (definition) => ({
      _client: clientFactory.create(definition, channel) as RawClient<
        NormalizedServiceDefinition<typeof definition>,
        AllCallOptions
      >,
      supportsBidi: true,
    }),
  };
}
