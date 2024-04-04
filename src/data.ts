import { AppendItem_IDAssignment, type AppendItem } from "./api/data/append.pb.js";
import { type DeleteItem } from "./api/data/delete.pb.js";
import { type GetItem } from "./api/data/get.pb.js";
import { SortableProperty } from "./api/data/item-property.pb.js";
import { type ListToken } from "./api/data/list-token.pb.js";
import { SortDirection } from "./api/data/list.pb.js";
import { type PutItem } from "./api/data/put.pb.js";
import { DataDefinition } from "./api/data/service.pb.js";
import { type Client, type ServiceClient, type StoreID } from "./index.js";
import { convertToItem } from "./item.js";
import {
  ListResult,
  SyncResult,
  collectListResponse,
  handleListResponse,
  handleSyncListResponse,
} from "./list-result.js";

// re-exports
export { AppendItem_IDAssignment } from "./api/data/append.pb.js";
export { SortableProperty } from "./api/data/item-property.pb.js";
export type { ListToken } from "./api/data/list-token.pb.js";
export { SortDirection } from "./api/data/list.pb.js";

// Transaction helpers are in another file
export { transaction, type Transaction } from "./transaction.js";

/**
 * JSONObject represents items that could be JSON objects. This does not
 * properly constrain the value - this is currently impossible in TypeScript.
 */
export interface JSONObject {
  [key: string]: any;
}

/**
 * ItemMetadata contains server-maintained metadata about the item and its
 * lifecycle, such as timestamps and version numbers.
 */
export interface ItemMetadata {
  /**
   * createdAt is the time at which this item was created, as a Unix
   * microsecond timestamp.
   */
  createdAt: Date;
  /**
   * lastModifiedAt is the time at which this item was last modified,
   * as a Unix microsecond timestamp.
   */
  lastModifiedAt: Date;
  /**
   * createdAtVersion is the group version of the item at the time it was
   * created. This is only populated in stores that are configured to track
   * versions.
   */
  createdAtVersion: bigint;
  /**
   * lastModifiedAtVersion is the group version of the item when it was last
   * modified. This is only populated in stores that are configured to track
   * versions.
   */
  lastModifiedAtVersion: bigint;
}

export interface Item<T extends JSONObject = JSONObject> {
  /** The key path is the full unique path of this item. */
  keyPath: string;
  /** The ID is the ID portion of this item within its parent sub-group. */
  id: string | number | undefined;
  /** The itemType is the item's type */
  itemType: string;
  /** The parent key path is the decomposed path of the whole parent */
  parentKeyPath: ItemKey;
  /** Data is the user data for this item */
  data: T;
  /** Metadata is extra metadata about this item, such as its version numbers and timestamps. */
  metadata: ItemMetadata;
}

// These options are defined here to consolidate their documentation.

interface AtomicOption {
  /** If true, either the entire batch will succeed, or none of them will. For
   * some store types (such as version-tracking stores) this is always true. */
  atomic?: boolean;
}

interface AllowStaleOption {
  /**
   * If true, you're okay with getting a slightly stale item - that is, if you
   * had just changed an item and then call get or list on it, you might get the old
   * version of the item. This can result in improved performance,
   * availability, and cost.
   */
  allowStale?: boolean;
}

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

const empty = new Uint8Array(0);

/**
 * DataClient holds the configuration for talking to the StatelyDB Data API,
 * which is used to read and modify data items in your store. It should be passed
 * to the various service methods exported from this module.
 */

export type DataClient = ServiceClient<DataDefinition> & {
  /** The Store ID this client is bound to. */
  readonly storeId: StoreID;
};

function checkStoreId(storeId: StoreID) {
  if (typeof storeId !== "bigint") {
    throw new Error("store ID must be a bigint (e.g. 1234567890n or BigInt(1234567890)");
  }
}

/**
 * Create a new DataClient that holds the configuration for talking to the
 * StatelyDB Data API, which is used to read and modify data items in your
 * store. It should be passed to the various service methods exported from this
 * module.
 * @param client - A Stately Client created by `createClient`.
 * @param storeId - The store ID to use for this client - all calls this client is passed into will be targeted to this store.
 * @example
 * const client = createNodeClient({ authTokenProvider });
 * const dataClient = createDataClient(client, 1221515n);
 * const item = await get(dataClient, "/jedi-luke/equipment-lightsaber");
 * const orderItems = await beginList(withStoreId(dataClient, 6545212412), "/orders-454/items").items;
 */
export function createDataClient(client: Client, storeId: StoreID): DataClient {
  checkStoreId(storeId);
  return {
    ...client.create(DataDefinition),
    storeId,
    callOptions: {
      // Default to 10s timeout
      deadline: 10_000,
    },
  };
}

/**
 * Change the store ID used by a DataClient. This returns a new data client -
 * you can continue to use the original one to talk to the store it was created
 * with. This is preferred to creating a new client, as it reuses resources
 * between clients.
 * @param client - A {@linkcode DataClient} created by {@linkcode createDataClient}.
 * @param storeId - The store ID to use for this client - all calls this client is passed into will be targeted to this store.
 * @example
 * const orderItems = await beginList(withStoreId(dataClient, 6545212412), "/orders-454/items").items;
 */
export function withStoreId(client: DataClient, storeId: StoreID): DataClient {
  checkStoreId(storeId);
  return {
    ...client,
    storeId,
  };
}

/**
 * beginList loads Items that start with a specified key path, subject to
 * additional filtering. The prefix must minimally contain a Group Key (an item
 * type and an item ID). beginList will return an empty result set if there are
 * no items matching that key prefix. A token is returned from this API that you
 * can then pass to ContinueList to expand the result set, or to SyncList to get
 * updates within the result set. This can fail if the caller does not have
 * permission to read Items. Use beginListStream if you want to handle items as
 * they arrive rather than batching them all up. You can list items of different
 * types in a single beginListStream, but you will need to relax the type
 * argument to a supertype of your items, likely `JSONObject`, and then use
 * `itemsOfType` to filter them back out.
 * @param client - A {@linkcode DataClient} created by
 * {@linkcode createDataClient}.
 * @param keyPathPrefix - The key path prefix to query for.
 * @example
 * const { items, token } = await beginList<Equipment>(dataClient, "/jedi-luke/equipment-lightsaber/");
 */
export async function beginList<T extends JSONObject = JSONObject>(
  client: DataClient,
  keyPathPrefix: string | ItemKey,
  opts?: AllowStaleOption & ListOptions,
): Promise<{ items: Item<T>[]; token: ListToken }> {
  return collectListResponse(beginListStream<T>(client, keyPathPrefix, opts));
}

/**
 * beginListStream loads Items that start with a specified key path, subject to
 * additional filtering. The prefix must minimally contain a Group Key (an item
 * type and an item ID). beginList will return an empty result set if there are
 * no items matching that key prefix. A token is returned from this API that you
 * can then pass to ContinueList to expand the result set, or to SyncList to get
 * updates within the result set. This can fail if the caller does not have
 * permission to read Items.
 *
 * beginListStream streams results via an AsyncGenerator, allowing you to handle
 * results as they arrive.
 *
 * You can list items of different types in a single beginListStream, but you
 * will need to relax the type argument to a supertype of your items, likely
 * `JSONObject`.
 * @param client - A {@linkcode DataClient} created by
 * {@linkcode createDataClient}.
 * @param keyPathPrefix - The key path prefix to query for.
 * @example
 * // With "for await"
 * const listResp = beginListStream<Equipment>(dataClient, "/jedi-luke/equipment-lightsaber/");
 * for await (const item of listResp) {
 *   console.log(item);
 * }
 * const token = listResp.token;
 * @example
 * // Direct iteration "for await"
 * const listResp = beginListStream<Equipment>(dataClient, "/jedi-luke/equipment-lightsaber/");
 * let next;
 * while (!(next = await listResp.next()).done) {
 *   console.log(next.value);
 * }
 * const token = next.value;
 */
export function beginListStream<T extends JSONObject = JSONObject>(
  client: DataClient,
  keyPathPrefix: string | ItemKey,
  {
    allowStale = false,
    limit = 0,
    sortDirection = SortDirection.SORT_ASCENDING,
  }: AllowStaleOption & ListOptions = {},
): ListResult<Item<T>> {
  const storeId = client.storeId;
  const responseStream = client._client.beginList(
    {
      storeId,
      keyPathPrefix:
        typeof keyPathPrefix === "string" ? keyPathPrefix : itemKeyToString(keyPathPrefix),
      limit,
      sortProperty: SortableProperty.KEY_PATH,
      sortDirection,
      allowStale,
    },
    client.callOptions,
  );
  return new ListResult(handleListResponse(responseStream));
}

/**
 * continueList takes the token from a BeginList call and returns the next
 * "page" of results based on the original query parameters and pagination
 * options. It has few options because it is a continuation of a previous list
 * operation. It will return a new token which can be used for another
 * ContinueList call, and so on. The token is the same one used by SyncList -
 * each time you call either ContinueList or SyncList, you should pass the
 * latest version of the token, and then use the new token from the result in
 * subsequent calls. You may interleave ContinueList and SyncList calls however
 * you like, but it does not make sense to make both calls in parallel. Calls to
 * ContinueList are tied to the authorization of the original BeginList call, so
 * if the original BeginList call was allowed, ContinueList with its token
 * should also be allowed. Use continueListStream if you want to handle items as
 * they arrive rather than batching them all up.
 * @param client - A {@linkcode DataClient} created by
 * {@linkcode createDataClient}.
 * @param tokenData - the token data from the previous list operation.
 * @example
 * const { items, token } = await continueList(dataClient, token.tokenData);
 */
export async function continueList<T extends JSONObject = JSONObject>(
  client: DataClient,
  tokenData: Uint8Array | ListToken,
): Promise<{ items: Item<T>[]; token: ListToken }> {
  return collectListResponse(continueListStream<T>(client, tokenData));
}

/**
 * continueListStream takes the token from a BeginList call and returns the next
 * "page" of results based on the original query parameters and pagination
 * options. It has few options because it is a continuation of a previous list
 * operation. It will return a new token which can be used for another
 * ContinueList call, and so on. The token is the same one used by SyncList -
 * each time you call either ContinueList or SyncList, you should pass the
 * latest version of the token, and then use the new token from the result in
 * subsequent calls. You may interleave ContinueList and SyncList calls however
 * you like, but it does not make sense to make both calls in parallel. Calls to
 * ContinueList are tied to the authorization of the original BeginList call, so
 * if the original BeginList call was allowed, ContinueList with its token
 * should also be allowed.
 *
 * continueListStream streams results via an AsyncGenerator, allowing you to handle
 * results as they arrive.
 * @param client - A {@linkcode DataClient} created by
 * {@linkcode createDataClient}.
 * @param tokenData - the token data from the previous list operation.
 * @example
 * // With "for await"
 * const listResp = continueListStream<Equipment>(dataClient, token.data);
 * for await (const item of listResp) {
 *   console.log(item);
 * }
 * const token = listResp.token;
 * @example
 * // Direct iteration "for await"
 * const listResp = continueListStream<Equipment>(dataClient, token.data);
 * let next;
 * while (!(next = await listResp.next()).done) {
 *   console.log(next.value);
 * }
 * const token = next.value;
 */
export function continueListStream<T extends JSONObject = JSONObject>(
  client: DataClient,
  tokenData: Uint8Array | ListToken,
): ListResult<Item<T>> {
  const responseStream = client._client.continueList(
    {
      tokenData: "tokenData" in tokenData ? tokenData.tokenData : tokenData,
      direction: SortDirection.SORT_ASCENDING,
    },
    client.callOptions,
  );
  return new ListResult(handleListResponse(responseStream));
}

/**
 * syncList returns all changes to Items within the result set of a previous
 * List operation. For all Items within the result set that were modified, it
 * returns the full Item at in its current state. It also returns a list of Item
 * key paths that were deleted since the last SyncList, which you should
 * reconcile with your view of items returned from previous
 * BeginList/ContinueList calls. Using this API, you can start with an initial
 * set of items from BeginList, and then stay up to date on any changes via
 * repeated SyncList requests over time. The token is the same one used by
 * ContinueList - each time you call either ContinueList or SyncList, you should
 * pass the latest version of the token, and then use the new token from the
 * result in subsequent calls. Note that if the result set has already been
 * expanded to the end (in the direction of the original BeginList request),
 * SyncList will return newly created Items. You may interleave ContinueList and
 * SyncList calls however you like, but it does not make sense to make both
 * calls in parallel. Calls to SyncList are tied to the authorization of the
 * original BeginList call, so if the original BeginList call was allowed,
 * SyncList with its token should also be allowed. Use syncListStream if you
 * want to handle item changes as they arrive rather than batching them all up.
 * @example
 * const { changes, token } = await continueList(dataClient, token.tokenData);
 * for (const result of changes) {
 *   switch (result.type) {
 *     case "reset":
 *       // Handle reset
 *       break;
 *     case "changed":
 *       // Handle changed item
 *       break;
 *     case "deleted":
 *       // Handle deleted item
 *       break;
 *     case "updatedOutsideWindow":
 *       // Handle item updated outside of list window
 *       break;
 *   }
 * }
 */
export async function syncList<T extends JSONObject = JSONObject>(
  client: DataClient,
  tokenData: Uint8Array | ListToken,
): Promise<{ changes: SyncResult<T>[]; token: ListToken }> {
  const { items: changes, token } = await collectListResponse(syncListStream<T>(client, tokenData));
  return { changes, token };
}

/**
 * syncListStream returns all changes to Items within the result set of a
 * previous List operation. For all Items within the result set that were
 * modified, it returns the full Item at in its current state. It also returns a
 * list of Item key paths that were deleted since the last SyncList, which you
 * should reconcile with your view of items returned from previous
 * BeginList/ContinueList calls. Using this API, you can start with an initial
 * set of items from BeginList, and then stay up to date on any changes via
 * repeated SyncList requests over time. The token is the same one used by
 * ContinueList - each time you call either ContinueList or SyncList, you should
 * pass the latest version of the token, and then use the new token from the
 * result in subsequent calls. Note that if the result set has already been
 * expanded to the end (in the direction of the original BeginList request),
 * SyncList will return newly created Items. You may interleave ContinueList and
 * SyncList calls however you like, but it does not make sense to make both
 * calls in parallel. Calls to SyncList are tied to the authorization of the
 * original BeginList call, so if the original BeginList call was allowed,
 * SyncList with its token should also be allowed.
 *
 * syncListStream streams results via an AsyncGenerator, allowing you to handle
 * results as they arrive.
 * @example
 * const syncResp = syncListStream<Equipment>(dataClient, token.data);
 * for await (const result of syncResp) {
 *   switch (result.type) {
 *     case "reset":
 *       // Handle reset
 *       break;
 *     case "changed":
 *       // Handle changed item
 *       break;
 *     case "deleted":
 *       // Handle deleted item
 *       break;
 *     case "updatedOutsideWindow":
 *       // Handle item updated outside of list window
 *       break;
 *   }
 * }
 */
export function syncListStream<T extends JSONObject = JSONObject>(
  client: DataClient,
  tokenData: Uint8Array | ListToken,
): ListResult<SyncResult<T>> {
  const responseStream = client._client.syncList(
    {
      tokenData: "tokenData" in tokenData ? tokenData.tokenData : tokenData,
    },
    client.callOptions,
  );
  return new ListResult(handleSyncListResponse(responseStream));
}

/**
 * ItemPut represents the minimum arguments to put a single item into the store.
 */
export interface ItemPut<T extends JSONObject = JSONObject> {
  /** The full key path to the item to put. e.g. "/jedi-luke/equipment-lightsaber/" */
  keyPath: string | ItemKey;
  /** The JSON-Compatible data to save for the item. */
  data: T;
}

/**
 * put adds an Item to the Store, or replaces the Item if it already exists at
 * that path. This will fail if the caller does not have permission to create
 * Items. Data can be provided as either JSON, or as a proto encoded by a
 * previously agreed upon schema, or by some combination of the two.
 * @param client - A {@linkcode DataClient} created by {@linkcode createDataClient}.
 * @param keyPath - The full key path of the item.
 * @param data - The JSON data to save with the item. This supports any
 * JSON-serializable data, but not custom classes, functions, Maps, Sets, etc.
 * @example
 * const item = await put(dataClient, "/jedi-luke/equipment-lightsaber", { color: "green" });
 */
export async function put<T extends JSONObject>(
  client: DataClient,
  keyPath: string | ItemKey,
  data: T,
  opts?: AtomicOption,
): Promise<Item<T>> {
  return (await putBatch<T>(client, [{ keyPath, data }], opts))[0];
}

/**
 * putBatch adds Items to the Store, or replaces Items if they already exist at
 * that path. This will fail if the caller does not have permission to create
 * Items. Data can be provided as either JSON, or as a proto encoded by a
 * previously agreed upon schema, or by some combination of the two. You can put
 * items of different types in a single putBatch, but you will need to relax the
 * type argument to a supertype of your items, likely `JSONObject`.
 * @param client - A {@linkcode DataClient} created by
 * {@linkcode createDataClient}.
 * @param puts - The full key path of each item and its data. This supports any
 * JSON-serializable data, but not custom classes, functions, Maps, Sets, etc.
 * @example
 * const items = await putBatch(dataClient, [
 *   { keyPath: "/jedi-luke/equipment-lightsaber", data: { color: "green" }},
 *   { keyPath: "/jedi-luke/equipment-cloak", data: { color: "brown" }}
 * ]);
 */
export async function putBatch<T extends JSONObject>(
  client: DataClient,
  puts: ItemPut<T>[],
  { atomic = false }: AtomicOption = {},
): Promise<Item<T>[]> {
  const storeId = client.storeId;
  const putItems: PutItem[] = puts.map(({ keyPath, data }) => ({
    item: {
      keyPath: typeof keyPath === "string" ? keyPath : itemKeyToString(keyPath),
      json: data,
      proto: empty,
      metadata: undefined,
    },
  }));
  const resp = await client._client.put(
    {
      storeId,
      puts: putItems,
      atomic,
    },
    client.callOptions,
  );
  return resp.results.map((r) => {
    const originalItem = putItems.find((i) => i.item!.keyPath === r.keyPath)?.item;
    if (!originalItem) {
      throw new Error("response returned an item we didn't put!");
    }
    originalItem.metadata = r.metadata;
    return convertToItem<T>(originalItem);
  });
}

/**
 * append adds a new Item to a parent path, automatically assigning IDs via one
 * of several selectable ID generation strategies (not all strategies may be
 * available to all store configurations or path types). Because the ID is
 * generated by the server, the new item is guaranteed not to overwrite an
 * existing Item. This differs from Put specifically because of this ID
 * assignment behavior, and it is recommended over Put for new items where you
 * do not want to assign IDs yourself. The assigned IDs will be returned in the
 * response. This operation will fail if the caller does not have permission to
 * create Items.
 * @param client - A {@linkcode DataClient} created by
 * {@linkcode createDataClient}.
 * @param parentPath - The full key path of the parent item. Each append will be
 * a new child of this item.
 * @param itemType - The item type of the newly added item.
 * @param idAssignment - The ID assignment strategy to use when picking this
 * item's ID.
 * @param data - this supports any JSON-serializable data, but not custom
 * classes, functions, Maps, Sets, etc.
 * @example
 * const items = await append(dataClient, [
 *   {"/jedi-luke/equipment-lightsaber", { color: "green" }},
 *   {"/jedi-luke/equipment-cloak", { color: "brown" }}
 * ]);
 */
export async function append<T extends JSONObject>(
  client: DataClient,
  parentPath: string | ItemKey,
  itemType: string,
  id: AppendItem_IDAssignment,
  data: T,
  opts?: AtomicOption,
): Promise<Item<T>> {
  return (await appendBatch(client, parentPath, [{ itemType, id: id, data }], opts))[0];
}

/**
 * ItemAppend represents the minimum arguments to append a single item into the store.
 */
export interface ItemAppend<T extends JSONObject = JSONObject> {
  /** The item type of the newly added item. */
  itemType: string;
  /** The ID assignment strategy to use when picking this item's ID. */
  id: AppendItem_IDAssignment;
  /** The JSON-Compatible data to save for the item. */
  data: T;
}

/**
 * appendBatch adds one or more new Items to a parent path, automatically
 * assigning IDs via one of several selectable ID generation strategies (not all
 * strategies may be available to all store configurations or path types).
 * Because the ID is generated by the server, the new item is guaranteed not to
 * overwrite an existing Item. This differs from Put specifically because of
 * this ID assignment behavior, and it is recommended over Put for new items
 * where you do not want to assign IDs yourself. The assigned IDs will be
 * returned in the response. This operation will fail if the caller does not
 * have permission to create Items. You can append items of different types in a
 * single appendBatch, but you will need to relax the type argument to a
 * supertype of your items, likely `JSONObject`.
 * @param client - A {@linkcode DataClient} created by
 * {@linkcode createDataClient}.
 * @param parentPath - The full key path of the parent item. Each append will be
 * a new child of this item.
 * @param appends - The item type and data of each item to append, along with
 * which ID assignment strategy you want. This supports any JSON-serializable
 * data, but not custom classes, functions, Maps, Sets, etc.
 * @example
 * const items = await appendBatch(dataClient, "/jedi-luke", [
 *   { itemType: "equipment", id: IDAssignment.SEQUENCE, { name: "lightsaber", color: "green" }},
 *   { itemType: "equipment", id: IDAssignment.SEQUENCE, { name: "cloak", color: "brown" }}
 * ]);
 */
export async function appendBatch<T extends JSONObject>(
  client: DataClient,
  parentPath: string | ItemKey,
  appends: ItemAppend<T>[],
  { atomic = false }: AtomicOption = {},
): Promise<Item<T>[]> {
  const storeId = client.storeId;
  const appendItems: AppendItem[] = appends.map(({ itemType, id, data }) => ({
    itemType,
    idAssignment: id,
    json: data,
    proto: empty,
  }));
  const resp = await client._client.append(
    {
      storeId,
      parentPath: typeof parentPath === "string" ? parentPath : itemKeyToString(parentPath),
      appends: appendItems,
      atomic,
    },
    client.callOptions,
  );
  return resp.results.map((r, i) => {
    const originalItem = appendItems[i];
    if (!originalItem) {
      throw new Error("response returned an item we didn't put!");
    }
    return convertToItem<T>({
      keyPath: r.keyPath,
      json: originalItem.json,
      proto: originalItem.proto,
      metadata: r.metadata,
    });
  });
}

/**
 * get retrieves an item by its full key path. This will return the item if it
 * exists, or undefined if it does not. It will fail if  the caller does not
 * have permission to read Items.
 * @param client - A {@linkcode DataClient} created by {@linkcode createDataClient}.
 * @param keyPath - The full key path of the item.
 * @example
 * const item = await get<Equipment>(dataClient, "/jedi-luke/equipment-lightsaber");
 */
export async function get<T extends JSONObject = JSONObject>(
  client: DataClient,
  keyPath: string | ItemKey,
  opts?: AllowStaleOption,
): Promise<Item<T> | undefined> {
  return (await getBatch<T>(client, [keyPath], opts))[0];
}

/**
 * getBatch retrieves a set of items by their full key paths. This will return
 * the items that exist. It will fail if the caller does not have permission to
 * read Items. Use BeginList if you want to retrieve multiple items but don't
 * already know the full key paths of the items you want to get. You can get
 * items of different types in a single getBatch, but you will need to relax the
 * type argument to a supertype of your items, likely `JSONObject`, and then use
 * `itemsOfType` to filter them back out.
 * @param client - A {@linkcode DataClient} created by
 * {@linkcode createDataClient}.
 * @param keyPaths - The full key path of each item to load.
 * @param atomic - If true, all items will be retrieved together atomically - no
 * other operation can interleave between the individual gets.
 * @param allowStale - If true, you're okay with getting a slightly stale item -
 * that is, if you had just changed an item and then call get on it, you might
 * get the old version of the item. This can result in improved performance,
 * availability, and cost.
 * @example
 * const items = await getBatch<Equipment>(dataClient, ["/jedi-luke/equipment-lightsaber", "/jedi-luke/equipment-cloak"]);
 */
export async function getBatch<T extends JSONObject = JSONObject>(
  client: DataClient,
  keyPaths: (string | ItemKey)[],
  { atomic = false, allowStale = false }: AtomicOption & AllowStaleOption = {},
): Promise<Item<T>[]> {
  const storeId = client.storeId;
  const gets: GetItem[] = keyPaths.map((keyPath) => ({
    keyPath: typeof keyPath === "string" ? keyPath : itemKeyToString(keyPath),
  }));
  const response = await client._client.get(
    {
      storeId,
      gets,
      allowStale,
      atomic,
    },
    {
      // This is here mostly just as an example of how to set custom call options!
      deadline: 5000,
      retryMaxAttempts: 2,
      ...client.callOptions,
    },
  );
  const convertedResults = response.items.map((item) => convertToItem<T>(item));
  return convertedResults;
}

/**
 * Del removes an Item from the Store by its full key path. This will fail if
 * the caller does not have permission to delete Items.
 * @param client - A {@linkcode DataClient} created by
 * {@linkcode createDataClient}.
 * @param keyPath - The full key path of the item.
 * @example
 * await del(dataClient, "/jedi-luke/equipment-lightsaber");
 */
export async function del(
  client: DataClient,
  keyPath: string | ItemKey,
  { atomic = false }: AtomicOption = {},
): Promise<void> {
  return delBatch(client, [keyPath], { atomic });
}

/**
 * delBatch removes Items from the Store by their full key paths. This will fail
 * if the caller does not have permission to delete Items.
 * @param client - A {@linkcode DataClient} created by
 * {@linkcode createDataClient}.
 * @param keyPaths - The full key paths (or ItemKeys) of the items.
 * @example
 * await delBatch(dataClient, ["/jedi-luke/equipment-lightsaber", "/jedi-luke/equipment-cloak"]);
 */
export async function delBatch(
  client: DataClient,
  keyPaths: (string | ItemKey)[],
  { atomic = false }: AtomicOption = {},
): Promise<void> {
  const storeId = client.storeId;
  const deletes: DeleteItem[] = keyPaths.map((keyPath) => ({
    keyPath: typeof keyPath === "string" ? keyPath : itemKeyToString(keyPath),
  }));
  await client._client.delete(
    {
      storeId,
      deletes,
      atomic,
    },
    client.callOptions,
  );
}

/**
 * ScanRootPaths lists root paths in the Store, subject to optional filters.
 * This may be a very expensive operation, as it must consult multiple
 * partitions that may be distributed around the world. It is provided mostly
 * for use in the web console's data browser and may thus not be exposed to
 * customers. This operation will fail if the caller does not have permission
 * to read Items.
 * @param client - A {@linkcode DataClient} created by {@linkcode createDataClient}.
 * @param options.limit - The maximum number of paths to return. Defaults to a reasonable number.
 * @private
 */
export async function scanRootPaths(
  client: DataClient,
  { limit = 0 }: { limit?: number } = {},
): Promise<string[]> {
  const storeId = client.storeId;
  const resp = await client._client.scanRootPaths(
    {
      storeId,
      limit,
      paginationToken: empty,
    },
    client.callOptions,
  );
  return resp.results.map((r) => r.keyPath);
}

export interface ItemKeyComponent {
  itemType: string;
  id?: string;
}
export type ItemKey = ItemKeyComponent[];

/**
 * parseKeyPath takes a key path string and returns an array of key path
 * components, which are objects with an itemType and an optional id.
 */
export function parseKeyPath(keyPath: string): ItemKey {
  if (!keyPath.startsWith("/")) {
    throw new Error("key path must start with /");
  }
  keyPath = keyPath.slice(1);
  return keyPath.split("/").map((p) => {
    const firstDash = p.indexOf("-");
    if (firstDash === -1) {
      return { itemType: p };
    }
    return { itemType: p.slice(0, firstDash), id: p.slice(firstDash + 1) };
  });
}

/**
 * itemKeyToString takes an array of item key components and returns a key path string.
 */
export function itemKeyToString(keyPath: ItemKey): string {
  return `/${keyPath.map((p) => `${p.itemType}${p.id ? `-${p.id}` : ""}`).join("/")}`;
}

/**
 * appendToKeyPath takes a key path string and adds a new component to the end of it.
 */
export function appendToKeyPath(keyPath: string, itemType: string, id?: string) {
  const parsed = parseKeyPath(keyPath);
  parsed.push({ itemType, id });
  return itemKeyToString(parsed);
}

/**
 * itemsOfType filters a list of items to only those of a specific item type,
 * and returns them as type-narrowed to the specified type.
 * @example
 * // response.items may contain several types of item
 * const response = await beginList<JSONObject>(dataClient, "/jedi-luke");
 * // equipment will only contain items of type Equipment
 * const equipment = itemsOfType<Equipment>("equipment", response.items);
 */
export function itemsOfType<T extends JSONObject>(itemType: string, items: Item[]): Item<T>[] {
  return items.filter((i) => i.itemType === itemType) as Item<T>[];
}
