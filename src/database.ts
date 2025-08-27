import {
  create,
  fromBinary,
  type MessageInitShape,
  MessageShape,
  toBinary,
} from "@bufbuild/protobuf";
import {
  type Client,
  Code,
  type CallOptions as ConnectCallOptions,
  ConnectError,
} from "@connectrpc/connect";
import { createWritableIterable } from "@connectrpc/connect/protocol";
import { ContinueListDirection } from "./api/db/continue_list_pb.js";
import { type Item as ApiItem, ItemSchema } from "./api/db/item_pb.js";
import { type FilterCondition, FilterConditionSchema } from "./api/db/list_filters_pb.js";
import { KeyConditionSchema, Operator, SortDirection } from "./api/db/list_pb.js";
import { type ListToken } from "./api/db/list_token_pb.js";
import { PutItemSchema } from "./api/db/put_pb.js";
import { type DatabaseService } from "./api/db/service_pb.js";
import { type TransactionRequest } from "./api/db/transaction_pb.js";
import { StatelyError } from "./errors.js";
import {
  handleListResponse,
  handleSyncListResponse,
  ListResult,
  type SyncResult,
} from "./list-result.js";
import { type Transaction, TransactionHelper, type TransactionResult } from "./transaction.js";
import {
  type AnyItem,
  type CallOptions,
  type Item,
  type ItemTypeMap,
  type ListOptions,
  type ScanOptions,
  type SchemaID,
  type SchemaVersionID,
  type StoreID,
} from "./types.js";

export interface PutOptions {
  /**
   * If set to true, the server will set the `createdAtTime` and/or
   * `lastModifiedAtTime` fields based on the current values in this item
   * (assuming you've mapped them to a field using `fromMetadata`). Without
   * this, those fields are always ignored and the server sets them to the
   * appropriate times. This option can be useful when migrating data from
   * another system.
   */
  overwriteMetadataTimestamps?: boolean;

  /**
   * mustNotExist is a condition that indicates this item must not already exist
   * at any of its key paths. If there is already an item at one of those paths,
   * the Put operation will fail with a "ConditionalCheckFailed" error. Note that
   * if the item has an `initialValue` field in its key, that initial value will
   * automatically be chosen not to conflict with existing items, so this
   * condition only applies to key paths that do not contain the `initialValue`
   * field.
   */
  mustNotExist?: boolean;
}

/**
 * Wrap an item with additional options for a Put operation. Use withPutOptions
 * to construct this for improved type inference.
 */
export type WithPutOptions<T> = PutOptions & {
  item: T;
};

/**
 * A utility type that turns a list of item types into a list of either items
 * or items with options.
 */
export type MapPutItems<
  TypeMap extends ItemTypeMap,
  AllItemTypes extends keyof TypeMap,
  Items extends AnyItem<TypeMap, AllItemTypes>[],
> = {
  [I in keyof Items]: Items[I] | WithPutOptions<Items[I]>;
};

export class DatabaseClient<
  TypeMap extends ItemTypeMap,
  AllItemTypes extends keyof TypeMap & string,
> {
  private readonly callOptions: Readonly<CallOptions>;
  private readonly client: Client<typeof DatabaseService>;
  private readonly storeId: bigint;
  private readonly typeMap: TypeMap;
  private readonly schemaVersionID: SchemaVersionID;
  private readonly schemaID: bigint;

  constructor(
    client: Client<typeof DatabaseService>,
    storeId: StoreID,
    typeMap: TypeMap,
    schemaVersionID: SchemaVersionID,
    schemaID: SchemaID,
    callOptions: CallOptions = {},
  ) {
    this.storeId = BigInt(storeId);
    this.client = client;
    this.typeMap = typeMap;
    this.schemaVersionID = schemaVersionID;
    this.schemaID = BigInt(schemaID);
    this.callOptions = callOptions;
  }

  /**
   * create builds a new item of the specified type. You *must* use this
   * function to create items so that they have the proper metadata for the
   * client to use them.
   * @param typeName - One of the itemType or objectType names from your schema.
   * @param init - The initial data for the item. Any values that aren't set
   * here will be set to their zero value.
   */
  create<T extends keyof TypeMap>(
    typeName: T,
    init?: MessageInitShape<TypeMap[T]>,
  ): Item<TypeMap, T> {
    const protoObj = create(this.typeMap[typeName], init);
    return protoObj as Item<TypeMap, T>;
  }

  /**
   * isType checks if an item is of a specific type from your schema. This is
   * useful when you have a list of items of different types and you need to
   * determine what type each item is.
   */
  isType<T extends keyof TypeMap>(
    item: MessageShape<TypeMap[keyof TypeMap]> | undefined,
    itemType: T,
  ): item is Item<TypeMap, T> {
    return item !== undefined && this.typeMap[itemType]?.typeName === item.$typeName;
  }

  /**
   * get retrieves an item by its full key path. This will return the item if it
   * exists, or undefined if it does not.
   * @param itemType - One of the itemType names from your schema. This is used
   * to determine the type of the resulting item.
   * @param keyPath - The full key path of the item.
   * @returns The Stately Item retrieved from the store or undefined if no item
   * was found.
   * @example
   * const item = await client.get('Equipment', "/jedi-luke/equipment-lightsaber");
   */
  async get<T extends keyof TypeMap & AllItemTypes>(
    itemType: T,
    keyPath: string,
  ): Promise<Item<TypeMap, T> | undefined> {
    const [result] = await this.getBatch(keyPath);
    if (this.isType(result, itemType)) {
      return result;
    } else if (result) {
      throw new StatelyError(
        "ItemTypeMismatch",
        `Expected item type ${itemType as string}, got ${result.$typeName}`,
        Code.InvalidArgument,
      );
    }
    return undefined;
  }

  /**
   * getBatch retrieves multiple items by their full key paths. This will return
   * the corresponding items that exist. Use beginList instead if you want to
   * retrieve multiple items but don't already know the full key paths of the
   * items you want to get. You can get items of different types in a single
   * getBatch - you will need to use `DatabaseClient.isType` to determine what
   * item type each item is.
   * @param keyPaths - The full key path of each item to load.
   * @returns The list of Items retrieved from the store. These are returned as
   * generic items and should be checked with `client.isType` to determine their
   * type.
   * @example
   * const [firstItem, secondItem] = await client.getBatch("/jedi-luke/equipment-lightsaber", "/jedi-luke/equipment-cloak");
   * if (client.isType(firstItem, "Equipment")) {
   *  console.log("Got an Equipment item", firstItem);
   * }
   */
  async getBatch(...keyPaths: string[]): Promise<AnyItem<TypeMap, AllItemTypes>[]> {
    const response = await handleErrors(
      this.client.get(
        {
          storeId: this.storeId,
          gets: keyPaths.map((keyPath) => ({
            keyPath,
          })),
          allowStale: this.callOptions.allowStale,
          schemaVersionId: this.schemaVersionID,
          schemaId: this.schemaID,
        },
        this.connectOptions,
      ),
    );
    return response.items.map((item) => this.unmarshal(item));
  }

  /**
   * put adds an Item to the Store, or replaces the Item if it already exists at
   * that path.
   *
   * This call will fail if:
   *     - The Item conflicts with an existing Item at the same path and the
   *       mustNotExist option is set, or the item's ID will be chosen with
   *       an `initialValue` and one of its other key paths conflicts with an
   *       existing item.
   * @param item - An Item from your generated schema. Use `withPutOptions` to
   * specify additional options for this item.
   * @param options - Additional options for this put operation - an alternative
   * to using `withPutOptions`.
   * @returns The item that was put, with any server-generated fields filled in.
   * @example
   * let lightsaber = client.create("Equipment", { color: "green", jedi: "luke", type: "lightsaber" });
   * lightsaber = await client.put(lightsaber);
   * // Or with options
   * lightsaber = await client.put(lightsaber, { mustNotExist: true });
   */
  async put<I extends AnyItem<TypeMap, AllItemTypes>>(
    item: I | WithPutOptions<I>,
    options?: PutOptions,
  ): Promise<I> {
    if (options) {
      item = "$typeName" in item ? { item, ...options } : { ...item, ...options };
    }
    const result = await this.putBatch(item);
    return result[0];
  }

  /**
   * putBatch adds multiple Items to the Store, or replaces Items if they
   * already exist at that path. You can put items of different types in a
   * single putBatch. All puts in the request are applied atomically - there are
   * no partial successes.
   *
   * This will fail if:
   *   - Any Item conflicts with an existing Item at the same path and its
   *     MustNotExist option is set, or the item's ID will be chosen with an
   *     `initialValue` and one of its other key paths conflicts with an existing
   *     item.
   * @param items - Items from your generated schema. Use `withPutOptions` to
   * add options to individual items.
   * @returns The items that were put, with any server-generated fields filled
   * in. They are returned in the same order they were provided.
   * @example
   * const items = await client.putBatch(
   *   client.create("Equipment", { color: "green", jedi: "luke", type: "lightsaber" }),
   *   client.create("Equipment", { color: "brown", jedi: "luke", type: "cloak" }),
   * );
   * // Or with options
   * const items = await client.putBatch(cloak, { item: lightsaber, mustNotExist: true });
   */
  async putBatch<Items extends AnyItem<TypeMap, AllItemTypes>[]>(
    ...items: MapPutItems<TypeMap, AllItemTypes, Items>
  ): Promise<Items> {
    const putItems = items.map((data) => {
      if ("$typeName" in data) {
        return create(PutItemSchema, { item: this.marshal(data) });
      } else if ("item" in data) {
        return create(PutItemSchema, {
          item: this.marshal(data.item),
          mustNotExist: Boolean(data.mustNotExist),
          overwriteMetadataTimestamps: Boolean(data.overwriteMetadataTimestamps),
        });
      } else {
        throw new StatelyError(
          "NotAnItem",
          "Request item is not a protobuf object",
          Code.InvalidArgument,
        );
      }
    });

    const resp = await handleErrors(
      this.client.put(
        {
          storeId: this.storeId,
          puts: putItems,
          schemaVersionId: this.schemaVersionID,
          schemaId: this.schemaID,
        },
        this.connectOptions,
      ),
    );
    return resp.items.map((r) => this.unmarshal(r)) as Items;
  }

  /**
   * delete removes one or more items from the Store by their full key paths.
   * delete succeeds even if there isn't an item at that key path. Tombstones
   * will be saved for deleted items for some time, so that syncList can return
   * information about deleted items. Deletes are always applied atomically; all
   * will fail or all will succeed.
   * @param keyPaths - The full key paths of the items.
   * @example
   * await client.del("/jedi-luke/equipment-lightsaber", "/jedi-luke/equipment-cloak");
   */
  async del(...keyPaths: string[]): Promise<void> {
    await handleErrors(
      this.client.delete(
        {
          storeId: this.storeId,
          deletes: keyPaths.map((keyPath) => ({
            keyPath,
          })),
          schemaVersionId: this.schemaVersionID,
          schemaId: this.schemaID,
        },
        this.connectOptions,
      ),
    );
  }

  /**
   * beginList retrieves Items that start with a specified keyPathPrefix from a
   * single Group. Because it can only list items from a single Group, the key
   * path prefix must at least start with a full Group Key (a single key segment
   * with a namespace and an ID, e.g. `/user-1234`).
   *
   * beginList will return an empty result set if there are no items matching
   * that key prefix. This API returns a token that you can pass to
   * continue_list to expand the result set, or to sync_list to get updates
   * within the result set.
   *
   * beginList streams results via an AsyncGenerator, allowing you to handle
   * results as they arrive. You can call `collect()` on it to get all the
   * results as a list.
   *
   * You can list items of different types in a single beginList, and you can
   * use `client.isItemType` to handle different item types.
   * @param keyPathPrefix - The key path prefix to query for. It must be at
   * least a full Group Key (e.g. `/user-1234`).
   * @returns A ListResult that can be iterated over to get the items.
   * @example
   * // With "for await"
   * const listResp = client.beginList("/jedi-luke/equipment-lightsaber/");
   * for await (const item of listResp) {
   *   if (client.isType(item, "Equipment")) {
   *     console.log(item.color);
   *   } else {
   *     console.log(item);
   *   }
   * }
   * token = listResp.token;
   */
  beginList(
    keyPathPrefix: string,
    {
      limit = 0,
      sortDirection = SortDirection.SORT_ASCENDING,
      itemTypes = [],
      celFilters = [],
      gt,
      gte,
      lt,
      lte,
    }: ListOptions<AllItemTypes> = {},
  ): ListResult<AnyItem<TypeMap, AllItemTypes>> {
    try {
      const keyConditionParams: [Operator, string | undefined][] = [
        [Operator.GREATER_THAN, gt],
        [Operator.GREATER_THAN_OR_EQUAL, gte],
        [Operator.LESS_THAN, lt],
        [Operator.LESS_THAN_OR_EQUAL, lte],
      ];
      const keyConditions = keyConditionParams
        .filter(([, value]) => value !== undefined)
        .map(([operator, keyPath]) => create(KeyConditionSchema, { operator, keyPath: keyPath! }));

      const responseStream = this.client.beginList(
        {
          storeId: this.storeId,
          keyPathPrefix,
          limit,
          sortDirection,
          allowStale: this.callOptions.allowStale,
          schemaVersionId: this.schemaVersionID,
          schemaId: this.schemaID,
          filterConditions: this.buildFilters(itemTypes, celFilters),
          keyConditions,
        },
        this.connectOptions,
      );
      return new ListResult(handleListResponse(this.unmarshal.bind(this), responseStream));
    } catch (e) {
      throw StatelyError.from(e);
    }
  }

  /**
   * continueList takes the token from a beginList call and returns the next
   * "page" of results based on the original query parameters and pagination
   * options. It doesn't have options because it is a continuation of a previous
   * list operation. It will return a new token which can be used for another
   * continueList call, and so on. The token is the same one used by syncList -
   * each time you call either continueList or syncList, you should pass the
   * latest version of the token, and then use the new token from the result in
   * subsequent calls. You may interleave continueList and syncList calls
   * however you like, but it does not make sense to make both calls in
   * parallel. Calls to continueList are tied to the authorization of the
   * original beginList call, so if the original beginList call was allowed,
   * continueList with its token should also be allowed.
   *
   * continueList streams results via an AsyncGenerator, allowing you to handle
   * results as they arrive. You can call `collect()` on it to get all the
   * results as a list.
   *
   * You can list items of different types in a single continueList, and you can
   * use `client.isItemType` to handle different item types.
   * @param tokenData - the token data from the previous list operation.
   * @example
   * const listResp = client.continueList(token.data);
   * for await (const item of listResp) {
   *   if (client.isType(item, "Equipment")) {
   *     console.log(item.color);
   *   } else {
   *     console.log(item);
   *   }
   * }
   * token = listResp.token;
   */
  continueList(tokenData: Uint8Array | ListToken): ListResult<AnyItem<TypeMap, AllItemTypes>> {
    try {
      const responseStream = this.client.continueList(
        {
          tokenData: "tokenData" in tokenData ? tokenData.tokenData : tokenData,
          direction: ContinueListDirection.CONTINUE_LIST_FORWARD,
          schemaVersionId: this.schemaVersionID,
          schemaId: this.schemaID,
        },
        this.connectOptions,
      );
      return new ListResult(handleListResponse(this.unmarshal.bind(this), responseStream));
    } catch (e) {
      throw StatelyError.from(e);
    }
  }

  /**
   * beginScan initiates a scan request which will scan over the entire store
   * and apply the provided filters. This API returns a token that you can pass
   * to continueScan to paginate through the result set.
   *
   * beginScan streams results via an AsyncGenerator, allowing you to handle
   * results as they arrive. You can call `collect()` on it to get all the
   * results as a list.
   *
   * You can list items of different types in a single beginScan, and you can
   * use `client.isItemType` to handle different item types.
   *
   * WARNING: THIS API CAN BE EXPENSIVE FOR STORES WITH A LARGE NUMBER OF ITEMS.
   *
   * @returns A ListResult that can be iterated over to get the items.
   *
   * @example
   * // With "for await"
   * const scanResp = client.beginScan();
   * for await (const item of scanResp) {
   *   if (client.isType(item, "Equipment")) {
   *     console.log(item.color);
   *   } else {
   *     console.log(item);
   *   }
   * }
   * token = scanResp.token;
   */
  beginScan({
    itemTypes = [],
    celFilters = [],
    limit = 0,
    totalSegments,
    segmentIndex,
  }: ScanOptions<AllItemTypes> = {}): ListResult<AnyItem<TypeMap, AllItemTypes>> {
    try {
      if ((totalSegments === undefined) !== (segmentIndex === undefined)) {
        throw new StatelyError(
          "InvalidArgument",
          "totalSegments and segmentIndex must both be set or both be unset",
        );
      }

      const responseStream = this.client.beginScan(
        {
          storeId: this.storeId,
          limit,
          filterConditions: this.buildFilters(itemTypes, celFilters),
          segmentationParams:
            segmentIndex === undefined
              ? undefined
              : {
                  totalSegments,
                  segmentIndex,
                },
          schemaVersionId: this.schemaVersionID,
          schemaId: this.schemaID,
        },
        this.connectOptions,
      );
      return new ListResult(handleListResponse(this.unmarshal.bind(this), responseStream));
    } catch (e) {
      throw StatelyError.from(e);
    }
  }

  /**
   * continueScan takes the token from a begin_scan call and returns the next
   * "page" of results based on the original query parameters and pagination
   * options.
   *
   * continueScan streams results via an AsyncGenerator, allowing you to handle
   * results as they arrive. You can call `collect()` on it to get all the
   * results as a list.
   *
   * You can list items of different types in a single continueScan, and you can
   * use `client.isItemType` to handle different item types.
   *
   * WARNING: THIS API CAN BE EXTREMELY EXPENSIVE FOR STORES WITH A LARGE NUMBER
   * OF ITEMS.
   *
   * @param tokenData - the token data from the previous list operation.
   * @returns A ListResult that can be iterated over to get the items.
   * @example
   * const scanResp = client.continueScan(token.data);
   * for await (const item of scanResp) {
   *   if (client.isType(item, "Equipment")) {
   *     console.log(item.color);
   *   } else {
   *     console.log(item);
   *   }
   * }
   * token = listResp.token;
   */
  continueScan(tokenData: Uint8Array | ListToken): ListResult<AnyItem<TypeMap, AllItemTypes>> {
    try {
      const responseStream = this.client.continueScan(
        {
          tokenData: "tokenData" in tokenData ? tokenData.tokenData : tokenData,
          schemaVersionId: this.schemaVersionID,
          schemaId: this.schemaID,
        },
        this.connectOptions,
      );
      return new ListResult(handleListResponse(this.unmarshal.bind(this), responseStream));
    } catch (e) {
      throw StatelyError.from(e);
    }
  }

  /**
   * syncList returns all changes to Items within the result set of a previous
   * List operation. For all Items within the result set that were modified, it
   * returns the full Item at in its current state. If the result set has
   * already been expanded to the end (in the direction of the original
   * beginList request), syncList will return newly created Items as well. It
   * also returns a list of Item key paths that were deleted since the last
   * syncList, which you should reconcile with your view of items returned from
   * previous beginList/continueList calls. Using this API, you can start with
   * an initial set of items from beginList, and then stay up to date on any
   * changes via repeated syncList requests over time.
   *
   * The token is the same one used by continueList - each time you call either
   * continueList or syncList, you should pass the latest version of the token,
   * and then use the new token from the result in subsequent calls. You may
   * interleave continueList and syncList calls however you like, but it does
   * not make sense to make both calls in parallel. Calls to syncList are tied
   * to the authorization of the original beginList call, so if the original
   * beginList call was allowed, syncList with its token should also be allowed.
   *
   * syncList streams results via an AsyncGenerator, allowing you to handle
   * results as they arrive. You can call `collect()` on it to get all the
   * results as a list.
   *
   * Each result will have one of the following values for its `type` property:
   *     - "changed": An item that was changed or added since the last
   *       SyncList call.
   *     - "deleted": The key path of an item that was deleted since
   *       the last SyncList call.
   *     - "updatedOutsideWindow": An item that was updated but
   *       is not within the current result set. You can treat this like
   *       "deleted", but the item hasn't actually been deleted, it's
   *       just not part of your view of the list anymore.
   *     - "reset": A reset signal that indicates any previously cached
   *       view of the result set is no longer valid. You should throw away
   *       any locally cached data. This will always be followed by a series
   *       of "changed" messages that make up a new view of the result set.
   * @returns A ListResult that can be iterated over to get the changes.
   * @example
   * const syncResp = client.syncListStream(token.data);
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
   * token = listResp.token;
   */
  syncList(tokenData: Uint8Array | ListToken): ListResult<SyncResult<TypeMap, AllItemTypes>> {
    try {
      const responseStream = this.client.syncList(
        {
          tokenData: "tokenData" in tokenData ? tokenData.tokenData : tokenData,
          schemaVersionId: this.schemaVersionID,
          schemaId: this.schemaID,
        },
        this.connectOptions,
      );
      return new ListResult(handleSyncListResponse(this.unmarshal.bind(this), responseStream));
    } catch (e) {
      throw StatelyError.from(e);
    }
  }

  /**
   * transaction allows you to issue reads and writes in any order, and all
   * writes will either succeed or all will fail when the transaction finishes.
   * You pass it a function with a single parameter, the transaction handler,
   * which lets you perform operations within the transaction.
   *
   * Reads are guaranteed to reflect the state as of when the transaction
   * started. A transaction may fail if another transaction commits before this
   * one finishes - in that case, you should retry your transaction.
   *
   * If any error is thrown from the handler function, the transaction is
   * aborted and none of the changes made in it will be applied. If the handler
   * returns without error, the transaction is automatically committed.
   *
   * If any of the operations in the handler function fails (e.g. a request is
   * invalid) you may not find out until the *next* operation, or once the block
   * finishes, due to some technicalities about how requests are handled.
   *
   * When the transaction is committed, the result property will contain the
   * full version of any items that were put in the transaction, and the
   * committed property will be True. If the transaction was aborted, the
   * committed property will be False.
   *
   * @example
   * await client.transaction(async (txn) => {
   *   const item = await txn.get<MyModel>("/path/to/item");
   *   if (item.data.someField === "someValue") {
   *     await txn.put<MyModel>(item.keyPath, { ...item.data, someField: "newValue" });
   *   }
   * });
   */
  async transaction(
    handler: (txnClient: Transaction<TypeMap, AllItemTypes>) => Promise<void>,
  ): Promise<TransactionResult<TypeMap, AllItemTypes>> {
    const outgoing = createWritableIterable<TransactionRequest>();
    const respIterable = this.client.transaction(outgoing, this.connectOptions);
    const txnClient = new TransactionHelper(
      {
        storeId: this.storeId,
        schemaId: this.schemaID,
        schemaVersionId: this.schemaVersionID,
        unmarshal: this.unmarshal.bind(this),
        marshal: this.marshal.bind(this),
        isType: this.isType.bind(this),
        buildFilters: this.buildFilters.bind(this),
      },
      outgoing,
      respIterable[Symbol.asyncIterator](),
    );
    try {
      await handler(txnClient);

      if (txnClient.inflight.size > 0) {
        const inflightRequests = Array.from(
          txnClient.inflight.entries(),
          ([msgId, command]) => `Request #${msgId - 1}: ${command}`,
        ).join(", ");
        throw new StatelyError(
          "InflightTransactionRequests",
          `Transaction still has inflight requests. Make sure you await all requests within the transaction function. Inflight requests: [${inflightRequests}]`,
          Code.FailedPrecondition,
        );
      }

      return await txnClient.commit();
    } catch (e) {
      if (!(e instanceof ConnectError)) {
        try {
          await txnClient.abort();
        } catch {
          // If we can't abort, still throw the original error
        }
      }
      throw StatelyError.from(e);
    }

    // TODO: in the future we could auto-retry transactions that fail due to conflicts
  }

  /**
   * Returns a new client that is associated with the provided abortSignal. Any
   * subsequent calls from the client returned by this function will be canceled
   * when the abortSignal is canceled. The original client is not modified. This
   * is helpful in scenarios where the result is no longer needed. If you want
   * to cancel the call after a certain amount of time, use
   * {@linkcode withTimeoutMs} instead. If an abortSignal and a timeout/deadline
   * are both set, whichever fires first will cancel the request.
   * @example
   * const controller = new AbortController();
   * const signal = controller.signal;
   * const item = await client.withAbortSignal(signal).get("/jedi-luke/equipment-lightsaber");
   */
  withAbortSignal(signal: AbortSignal): DatabaseClient<TypeMap, AllItemTypes> {
    return new DatabaseClient(
      this.client,
      this.storeId,
      this.typeMap,
      this.schemaVersionID,
      this.schemaID,
      {
        ...this.callOptions,
        signal,
      },
    );
  }

  /**
   * Returns a new client that is associated with the provided default timeout,
   * in milliseconds. Each subsequent call from the client returned by this
   * function will be canceled after `timeoutMs` milliseconds. The original
   * client is not modified. Most APIs have a default timeout but this allows
   * you to customize it. If you have an absolute deadline (e.g. as part of an
   * overall request deadline) use {@linkcode withDeadline} instead.
   * @example
   * const item = await client.withTimeoutMs(1000).get("/jedi-luke/equipment-lightsaber");
   */
  withTimeoutMs(timeoutMs: number): DatabaseClient<TypeMap, AllItemTypes> {
    return new DatabaseClient(
      this.client,
      this.storeId,
      this.typeMap,
      this.schemaVersionID,
      this.schemaID,
      {
        ...this.callOptions,
        timeoutMs,
      },
    );
  }

  /**
   * Returns a new client that cancels calls after the specified time. This is
   * helpful in scenarios where you have an overall request deadline, or want to
   * cancel the call at a specific time. If you want to cancel the call after a
   * certain amount of time, use {@linkcode withTimeoutMs} instead.
   * @example
   * const item = await client.withDeadline(new Date(Date.now() + 1000)).get("/jedi-luke/equipment-lightsaber");
   */
  withDeadline(deadline: Date): DatabaseClient<TypeMap, AllItemTypes> {
    return new DatabaseClient(
      this.client,
      this.storeId,
      this.typeMap,
      this.schemaVersionID,
      this.schemaID,
      {
        ...this.callOptions,
        deadline,
      },
    );
  }

  /**
   * Returns a new client that is either OK with or not OK with stale reads.
   * This affects get and list operations from the returned client. Use this
   * only if you know you can tolerate stale reads. This can result in improved
   * performance, availability, and cost.
   * @param [allowStale=true] - Whether staleness is allowed or not.
   * @example
   * const item = await client.withAllowStale().get("/jedi-luke/equipment-lightsaber");
   */
  withAllowStale(allowStale = true): DatabaseClient<TypeMap, AllItemTypes> {
    return new DatabaseClient(
      this.client,
      this.storeId,
      this.typeMap,
      this.schemaVersionID,
      this.schemaID,
      {
        ...this.callOptions,
        allowStale,
      },
    );
  }

  // We're referencing the generics of the class, even if we're not using 'this' directly.
  // eslint-disable-next-line class-methods-use-this
  private buildFilters(
    itemTypes: AllItemTypes[],
    celFilters: [AllItemTypes, string][],
  ): FilterCondition[] {
    const filters = itemTypes.map((itemType) =>
      create(FilterConditionSchema, {
        value: {
          case: "itemType",
          value: itemType,
        },
      }),
    );

    return filters.concat(
      celFilters.map((celFilter) =>
        create(FilterConditionSchema, {
          value: {
            case: "celExpression",
            value: {
              itemType: celFilter[0],
              expression: celFilter[1],
            },
          },
        }),
      ),
    );
  }

  private unmarshal(item: ApiItem): AnyItem<TypeMap, AllItemTypes> {
    const protoSchema = this.typeMap[item.itemType];
    if (!protoSchema) {
      throw new StatelyError(
        "UnknownItemType",
        `Unknown item type in response: ${item.itemType}`,
        Code.InvalidArgument,
      );
    }
    switch (item.payload.case) {
      case "proto":
        try {
          return fromBinary(protoSchema, item.payload.value) as AnyItem<TypeMap, AllItemTypes>;
        } catch (e) {
          if (e instanceof Error) {
            throw new StatelyError(
              "UnmarshalFailure",
              `Failed to unmarshal item type ${item.itemType}: ${e.message}`,
              Code.InvalidArgument,
              e,
            );
          }
          throw e;
        }
      default:
        throw new StatelyError("Internal", `${item.payload.case} responses are not supported`);
    }
  }

  // TODO: we really do want the item type here
  private marshal(item: AnyItem<TypeMap, AllItemTypes>): ApiItem {
    if (!item.$typeName) {
      throw new StatelyError(
        "NotAnItem",
        "Request item is not a protobuf object",
        Code.InvalidArgument,
      );
    }

    const pair = Object.entries(this.typeMap).find(([_i, t]) => t.typeName === item.$typeName);
    if (!pair) {
      throw new StatelyError(
        "UnknownItemType",
        `Unknown item type in request: ${item.$typeName}`,
        Code.InvalidArgument,
      );
    }
    const [itemType, protoSchema] = pair;
    try {
      return create(ItemSchema, {
        itemType,
        payload: {
          case: "proto",
          value: toBinary(protoSchema, item),
        },
      });
    } catch (e) {
      if (e instanceof Error) {
        throw new StatelyError(
          "MarshalFailure",
          `Failed to marshal item type ${itemType}: ${e.message}`,
          Code.InvalidArgument,
          e,
        );
      }
      throw e;
    }
  }

  private get connectOptions(): ConnectCallOptions {
    const callOptions: ConnectCallOptions = {};
    if (this.callOptions.timeoutMs) {
      callOptions.timeoutMs = this.callOptions.timeoutMs;
    } else if (this.callOptions.deadline) {
      callOptions.timeoutMs = Date.now() - this.callOptions.deadline.getTime();
    }
    if (this.callOptions.signal) {
      callOptions.signal = this.callOptions.signal;
    }
    return callOptions;
  }
}

async function handleErrors<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    throw StatelyError.from(e);
  }
}
