import type { DescMessage, DescService, MessageShape } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";
import type { SortDirection } from "./api/db/list_pb.js";

// typed IDs
export type StoreID = bigint;
export type SchemaVersionID = number;
export type AuthTokenProvider = () => Promise<string>;

// TODO: RetryOptions with max retries, backoff params, and per-call timeout
// (automatic based on deadline?). See nice-grpc-client-middleware-retry for
// inspiration.

/**
 * All of the per-call client options that could be set. We'll only expose some
 * of these.
 * @private
 */
export interface CallOptions {
  /**
   * Timeout in milliseconds. Each call made from this client will be canceled
   * `timeoutMs` milliseconds after it starts. If cancelled, the call will throw
   * an StatelyError with the Status.Canceled status.
   *
   * Set to <= 0 to disable the default timeout.
   */
  timeoutMs?: number;

  /**
   * Absolute deadline for calls. If set, all calls made from this client will
   * be canceled at this time. This is useful for passing along an overall
   * deadline for a request through multiple database calls. If cancelled, the
   * call will throw an StatelyError with the Status.Canceled status.
   */
  deadline?: Date;

  /**
   * An optional AbortSignal to cancel the call. If cancelled, the call will
   * throw an StatelyError with the Status.Canceled status.
   */
  signal?: AbortSignal;

  /**
   * If true, you're okay with getting a slightly stale item - that is, if you
   * had just changed an item and then call get or list on it, you might get the
   * old version of the item. This can result in improved performance,
   * availability, and cost. This affects get and list operations.
   */
  allowStale?: boolean;
}

export interface ClientOptions {
  /**
   * The Stately Cloud API endpoint to use. If not set, this will use the
   * default endpoint.
   */
  endpoint?: string;

  /**
   * The region to use for the Stately Cloud API. If not set, this will use a
   * default region. You should set this if your store is regional.
   */
  region?: string;

  /**
   * An async function that returns the auth token to use for requests. We
   * provide some common implementations of this, but you may want to provide
   * your own.
   */
  authTokenProvider?: (transport: Transport, close: () => void) => AuthTokenProvider;
}

/**
 * A factory function for creating Connect clients that talk to Stately
 * services.
 */
export type ClientFactory = <Service extends DescService>(definition: Service) => Client<Service>;

/**
 * Item represents an item that can be stored in the database. Item types are
 * generated from your schema definition.
 */
export type Item<TypeMap extends ItemTypeMap, T extends keyof TypeMap> = MessageShape<TypeMap[T]>;

/**
 * An ItemTypeMap is a map of item type names to their corresponding proto
 * message schemas. These aren't meant to be used directly - you should use the
 * generated `createClient` function to create a client for a specific schema.
 */
export type ItemTypeMap = Record<string, DescMessage>;

/**
 * AnyItem is a union of all item shapes in your schema.
 */
export type AnyItem<TypeMap extends ItemTypeMap, AllItemTypes extends keyof TypeMap> = MessageShape<
  TypeMap[AllItemTypes]
>;

// These options are defined here to consolidate their documentation.

export interface ListOptions {
  /**
   * limit is the maximum number of items to return. If this is not specified or
   * set to 0, it will default to 100. Fewer items than the limit may be
   * returned even if there are more items to get - make sure to check
   * token.can_continue.
   */
  limit?: number;
  /** The direction to sort the results in. If this is not set, we will sort in ascending order. */
  sortDirection?: SortDirection;
}
