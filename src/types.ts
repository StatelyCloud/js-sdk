import type { DescMessage, DescService, MessageShape } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";
import type { SortDirection } from "./api/db/list_pb.js";

// typed IDs
export type StoreID = bigint | number;
export type SchemaVersionID = number;
export type SchemaID = bigint | number;
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

/**
 * ClientOptions are passed by the customer into the generated `createClient`
 * function to configure the client. This is the single top level configuration
 * that a customer interacts with.
 */
export interface ClientOptions extends TransportOptions {
  /**
   * The store ID to use for this client - all calls this client
   * is passed into will be targeted to this store.
   */
  storeId: StoreID;

  /**
   * Transport function to use - pass nodeTransport or webTransport.
   */
  transport: TransportFactory;
}

/**
 * InternalClientOptions are the options passed into the SDK client. These
 * options are derived from the ClientOptions in the generated createClient
 * function.
 * @private
 */
export interface InternalClientOptions<TypeMap extends ItemTypeMap> {
  /**
   * The store ID to use for this client - all calls this client
   * is passed into will be targeted to this store.
   */
  storeId: StoreID;

  /**
   * The map of item type names to their corresponding proto message schemas.
   */
  itemTypeMap: TypeMap;

  /**
   * The schema version ID for this client.
   */
  schemaVersionID: SchemaVersionID;

  /**
   * The schema ID for this client.
   */
  schemaID: SchemaID;
  /**
   * A factory function for creating Connect clients that talk to Stately
   * services.
   */
  clientFactory: ClientFactory;
}

/**
 * A factory function for creating a web Connect client. noAuth is not supported on the web.
 */
export type WebTransportFactory = (options: Omit<TransportOptions, "noAuth">) => ClientFactory;

/**
 * A factory function for creating a Node.js Connect client.
 */
export type NodeTransportFactory = (options: TransportOptions) => ClientFactory;

/**
 * A transport factory is a function that is used to create a Connect client.
 */
export type TransportFactory = WebTransportFactory | NodeTransportFactory;

/**
 * Options for configuring the transport used by the client.
 */
export interface TransportOptions {
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
   * NoAuth is a flag to indicate that the client should not attempt to get an
   * auth token. This is used when talking to the Stately BYOC Data Plane on
   * localhost.
   */
  noAuth?: boolean;

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

export interface ListOptions<AllItemTypes extends string> {
  /**
   * limit is the maximum number of items to return. If this is not specified or
   * set to 0, it will default to 100. Fewer items than the limit may be
   * returned even if there are more items to get - make sure to check
   * token.can_continue.
   */
  limit?: number;

  /**
   * The direction to sort the results in. If this is not set, we will sort in
   * ascending order.
   */
  sortDirection?: SortDirection;

  /**
   * itemTypes is a list of item types to filter the scan by. If this is not
   * specified, all item types will be fetched.
   */
  itemTypes?: AllItemTypes[];

  /**
   * celFilters are an optional list of item type, CEL expression tuples to filter the
   * results set by.
   *
   * CEL expressions are only evaluated for the item type they are defined for, and
   * do not affect other item types in the result set. This means if an item type has
   * no CEL filter and there are no itemTypes filter constraints, it will be included
   * in the result set.
   *
   * In the context of a CEL expression, the key-word `this` refers to the item being
   * evaluated, and property properties should be accessed by the names as they appear
   * in schema -- not necessarily as they appear in the generated code for a particular
   * language. For example, if you have a `Movie` item type with the property `rating`,
   * you could write a CEL expression like `this.rating == 'R'` to return only movies
   * that are rated `R`.
   *
   * Find the full CEL language definition here:
   *  https://github.com/google/cel-spec/blob/master/doc/langdef.md
   */
  celFilters?: [AllItemTypes, string][];

  // The following options are used to filter the results based on the key path.
  // Wherever possible, stately will apply these key conditions at the DB layer
  // to optimize the list operation latency and cost.
  // Key conditions may be combined with a key_path_prefix to further
  // optimize the list operation. HOWEVER Key conditions must share the
  // same prefix as the keyPathPrefix n the request.

  /**
   * gt constrains a query to only include items with a key greater than the
   * specified value based on lexicographic ordering.
   */
  gt?: string;

  /**
   * gte constrains a query to only include items with a key greater than or equal
   * to the specified value based on lexicographic ordering.
   */
  gte?: string;

  /**
   * lt constrains a query to only include items with a key less than the
   * specified value based on lexicographic ordering.
   */
  lt?: string;

  /**
   * lte constrains a query to only include items with a key less than or equal to
   * the specified value based on lexicographic ordering.
   */
  lte?: string;
}

// These options are defined here to consolidate their documentation.
export interface ScanOptions<AllItemTypes extends string> {
  /**
   * itemTypes is a list of item types to filter the scan by. If this is not
   * specified, all item types will be fetched.
   */
  itemTypes?: AllItemTypes[];

  /**
   * celFilters are an optional list of item type, CEL expression tuples to filter the
   * results set by.
   *
   * CEL expressions are only evaluated for the item type they are defined for, and
   * do not affect other item types in the result set. This means if an item type has
   * no CEL filter and there are no itemTypes filter constraints, it will be included
   * in the result set.
   *
   * In the context of a CEL expression, the key-word `this` refers to the item being
   * evaluated, and property properties should be accessed by the names as they appear
   * in schema -- not necessarily as they appear in the generated code for a particular
   * language. For example, if you have a `Movie` item type with the property `rating`,
   * you could write a CEL expression like `this.rating == 'R'` to return only movies
   * that are rated `R`.
   *
   * Find the full CEL language definition here:
   *  https://github.com/google/cel-spec/blob/master/doc/langdef.md
   */
  celFilters?: [AllItemTypes, string][];

  /**
   * limit is the maximum number of items to return. If this is not specified or
   * set to 0 then all items will be fetched. Fewer items than the limit may be
   * returned even if there are more items to get - make sure to check
   * token.can_continue.
   */
  limit?: number;

  /**
   * totalSegments is the total number of segments to split the scan into. Use
   * this to parallelize a scan on the client by splitting it into multiple
   * segments which you can process concurrently. This can be useful when you
   * need to quickly process your entire data set for something like a backfill
   * or data migration. If this is set then segmentIndex must also be set.
   */
  totalSegments?: number;

  /**
   * segmentIndex is the index of the segment to fetch. If this is not set, the
   * scan will not be segmented. This must be set if totalSegments is set.
   */
  segmentIndex?: number;
}
