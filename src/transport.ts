import { createClient, Transport, type Interceptor } from "@connectrpc/connect";
import { requestIdMiddleware } from "./middleware/request-id.js";
import type { ClientFactory } from "./types.js";

/**
 * Creates the endpoint URL from endpoint and region parameters
 */
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

/**
 * Creates the base interceptors array with common middleware
 */
export function createBaseInterceptors(): Interceptor[] {
  return [
    requestIdMiddleware,
    // retryMiddleware,
  ];
}

/**
 * Creates a client factory function from a transport
 */
export function createClientFactory(transport: Transport): ClientFactory {
  return (definition) => createClient(definition, transport);
}
