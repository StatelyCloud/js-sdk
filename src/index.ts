import type { DeadlineOptions } from "nice-grpc-client-middleware-deadline";
import type { RetryOptions } from "nice-grpc-client-middleware-retry";
import type { CallOptions as NiceCallOptions } from "nice-grpc-common";
import type { Client as NiceClient } from "./nice-types/client.js";
import type { CompatServiceDefinition } from "./nice-types/service-definition.js";

export { ClientError, Status } from "nice-grpc-common";

// typed IDs
export type StoreID = bigint;
export type ProjectID = bigint;
export type OrganizationID = bigint;
export type UserID = bigint;

export type AuthTokenProvider = () => Promise<string>;

/**
 * All of the per-call client options that could be set. We'll only expose some
 * of these.
 * @private
 */
export type AllCallOptions = NiceCallOptions & RetryOptions & DeadlineOptions;

export type NiceServiceClient<Service extends CompatServiceDefinition> = NiceClient<
  Service,
  AllCallOptions
>;

/**
 * A ServiceClient is effectively an opaque handle that can be passed to service
 * functions. We invert this call pattern instead of exposing all the service
 * operations as methods so that we can enable tree-shaking to not include code
 * for operations you don't use. See README for more details.
 * @example
 * const client = createNodeClient({ ... });
 * const dataClient = createDataClient(client, 1234n);
 * const result = await get(dataClient, "/jedi-luke/equipment-lightsaber");
 */
export interface ServiceClient<Service extends CompatServiceDefinition> {
  /** @private */
  readonly _client: NiceServiceClient<Service>;
  /**
   * Options that will be used for all calls from this service. Use functions
   * like {@linkcode withAbortSignal} or {@linkcode withTimeoutMs} to create a new
   * client with different options (even for just one call!).
   */
  readonly callOptions?: Readonly<AllCallOptions>;

  /**
   * Whether this client supports bidirectional streaming. This is required for
   * the transaction API.
   */
  readonly supportsBidi: boolean;
}

/**
 * Set an abortSignal to cancel the call. This is helpful in scenarios where the
 * result is no longer needed. If you want to cancel the call after a certain
 * amount of time, use {@linkcode withTimeoutMs} instead. If an abortSignal and
 * a timeout/deadline are both set, whichever fires first will cancel the
 * request.
 */
export function withAbortSignal<Service extends CompatServiceDefinition>(
  client: ServiceClient<Service>,
  signal: AbortSignal,
): ServiceClient<Service> {
  return {
    ...client,
    callOptions: {
      ...client.callOptions,
      signal,
    },
  };
}

/**
 * Set a timeout in milliseconds to cancel the call. Most APIs have a default
 * timeout but this allows you to customize it. If you have an absolute deadline
 * (e.g. as part of an overall request deadline) use {@linkcode withDeadline}
 * instead.
 */
export function withTimeoutMs<Service extends CompatServiceDefinition>(
  client: ServiceClient<Service>,
  timeoutMs: number,
): ServiceClient<Service> {
  return {
    ...client,
    callOptions: {
      ...client.callOptions,
      deadline: timeoutMs,
    },
  };
}

/**
 * Set an absolute deadline to cancel the call. This is helpful in scenarios
 * where you have an overall request deadline, or want to cancel the call at a
 * specific time. If you want to cancel the call after a certain amount of time,
 * use {@linkcode withTimeoutMs} instead.
 */
export function withDeadline<Service extends CompatServiceDefinition>(
  client: ServiceClient<Service>,
  deadline: Date,
): ServiceClient<Service> {
  return {
    ...client,
    callOptions: {
      ...client.callOptions,
      deadline,
    },
  };
}

/**
 * Set how many retries (not including the original attempt) this call will
 * make. Most retryable APIs have a default retry policy set.
 */
export function withRetryAttempts<Service extends CompatServiceDefinition>(
  client: ServiceClient<Service>,
  retryAttempts: number,
): ServiceClient<Service> {
  return {
    ...client,
    callOptions: {
      ...client.callOptions,
      retryMaxAttempts: retryAttempts,
    },
  };
}

export interface ClientOptions {
  /**
   * The Stately Cloud API endpoint to use. If not set, this will use a
   * default.
   */
  endpoint: string;

  /**
   * An async function that returns the auth token to use for requests. We
   * provide some common implementations of this, but you may want to provide
   * your own.
   */
  authTokenProvider: AuthTokenProvider;
}

/**
 * An effectively opaque handle to the Stately Cloud API client's configuration.
 * This allows us to share connections and structures between various API
 * clients - it gets passed into functions that construct clients for individual
 * APIs.
 */
export interface Client {
  /**
   * A bound factory function for creating service clients.
   * @private
   */
  create: <Service extends CompatServiceDefinition>(definition: Service) => ServiceClient<Service>;
}
