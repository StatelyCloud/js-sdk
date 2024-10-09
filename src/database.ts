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
import { SortableProperty } from "./api/db/item_property_pb.js";
import { SortDirection } from "./api/db/list_pb.js";
import { type ListToken } from "./api/db/list_token_pb.js";
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
  type StoreID,
} from "./types.js";

function checkStoreId(storeId: StoreID): StoreID {
  if (typeof storeId !== "bigint") {
    throw new StatelyError(
      "InvalidArgument",
      "store ID must be a bigint (e.g. 1234567890n or BigInt(1234567890)",
    );
  }
  return storeId;
}

export class DatabaseClient<TypeMap extends ItemTypeMap, AllItemTypes extends keyof TypeMap> {
  private readonly callOptions: Readonly<CallOptions>;
  private readonly client: Client<typeof DatabaseService>;
  private readonly storeId: StoreID;
  private readonly typeMap: TypeMap;

  constructor(
    client: Client<typeof DatabaseService>,
    storeId: StoreID,
    typeMap: TypeMap,
    callOptions: CallOptions = {},
  ) {
    this.storeId = checkStoreId(storeId);
    this.client = client;
    this.typeMap = typeMap;
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
   * exists, or undefined if it does not. It will fail if  the caller does not
   * have permission to read Items.
   * @param itemType - One of the itemType names from your schema. This is used
   * to determine the type of the resulting item.
   * @param keyPath - The full key path of the item.
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
   * getBatch retrieves up to 100 items by their full key paths. This will return
   * the corresponding items that exist. It will fail if the caller does not
   * have permission to read Items. Use BeginList if you want to retrieve
   * multiple items but don't already know the full key paths of the items you
   * want to get. You can get items of different types in a single getBatch -
   * you will need to use `DatabaseClient.isType` to determine what item type
   * each item is.
   * @param keyPaths - The full key path of each item to load. Max 100 key paths.
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
        },
        this.connectOptions,
      ),
    );
    return response.items.map((item) => this.unmarshal(item));
  }

  /**
   * put adds an Item to the Store, or replaces the Item if it already exists at
   * that path. This will fail if the caller does not have permission to create
   * Items.
   * @param item - An Item from your generated schema.
   * @returns The item that was put, with any server-generated fields filled in.
   * @example
   * let lightsaber = client.create("Equipment", { color: "green", jedi: "luke", type: "lightsaber" });
   * lightsaber = await client.put(lightsaber);
   */
  async put<I extends AnyItem<TypeMap, AllItemTypes>>(item: I): Promise<I> {
    const result = await this.putBatch(item);
    return result[0];
  }

  /**
   * putBatch adds up to 50 Items to the Store, or replaces Items if they
   * already exist at that path. This will fail if the caller does not have
   * permission to create Items. Data can be provided as either JSON, or as a
   * proto encoded by a previously agreed upon schema, or by some combination of
   * the two. You can put items of different types in a single putBatch.
   * @param items - Items from your generated schema. Max 50 items.
   * @returns The items that were put, with any server-generated fields filled
   * in. They are returned in the same order they were provided.
   * @example
   * const items = await client.putBatch(dataClient,
   *   client.create("Equipment", { color: "green", jedi: "luke", type: "lightsaber" }),
   *   client.create("Equipment", { color: "brown", jedi: "luke", type: "cloak" }),
   * );
   */
  async putBatch<Items extends AnyItem<TypeMap, AllItemTypes>[]>(...items: Items): Promise<Items> {
    const resp = await handleErrors(
      this.client.put(
        {
          storeId: this.storeId,
          puts: items.map((data) => ({
            item: this.marshal(data),
          })),
        },
        this.connectOptions,
      ),
    );
    return resp.items.map((r) => this.unmarshal(r)) as Items;
  }

  /**
   * del removes up to 50 Items from the Store by their full key paths. This
   * will fail if the caller does not have permission to delete Items.
   * @param keyPaths - The full key paths of the items. Max 50 key paths.
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
        },
        this.connectOptions,
      ),
    );
  }

  /**
   * beginList loads Items that start with a specified key path, subject to
   * additional filtering. The prefix must minimally contain a Group Key (an
   * item type and an item ID). beginList will return an empty result set if
   * there are no items matching that key prefix. A token is returned from this
   * API that you can then pass to continueList to expand the result set, or to
   * syncList to get updates within the result set. This can fail if the caller
   * does not have permission to read Items.
   *
   * beginList streams results via an AsyncGenerator, allowing you to handle
   * results as they arrive. You can call `collect()` on it to get all the
   * results as a list.
   *
   * You can list items of different types in a single beginList, and you can
   * use `client.isItemType` to handle different item types.
   * @param keyPathPrefix - The key path prefix to query for.
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
    { limit = 0, sortDirection = SortDirection.SORT_ASCENDING }: ListOptions = {},
  ): ListResult<AnyItem<TypeMap, AllItemTypes>> {
    try {
      const responseStream = this.client.beginList(
        {
          storeId: this.storeId,
          keyPathPrefix,
          limit,
          sortProperty: SortableProperty.KEY_PATH,
          sortDirection,
          allowStale: this.callOptions.allowStale,
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
   * const listResp = client.continueList(dataClient, token.data);
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
   * returns the full Item at in its current state. It also returns a list of
   * Item key paths that were deleted since the last syncList, which you should
   * reconcile with your view of items returned from previous
   * beginList/continueList calls. Using this API, you can start with an initial
   * set of items from beginList, and then stay up to date on any changes via
   * repeated syncList requests over time. The token is the same one used by
   * continueList - each time you call either continueList or syncList, you
   * should pass the latest version of the token, and then use the new token
   * from the result in subsequent calls. Note that if the result set has
   * already been expanded to the end (in the direction of the original
   * beginList request), syncList will return newly created Items. You may
   * interleave continueList and syncList calls however you like, but it does
   * not make sense to make both calls in parallel. Calls to syncList are tied
   * to the authorization of the original beginList call, so if the original
   * beginList call was allowed, syncList with its token should also be allowed.
   *
   * syncList streams results via an AsyncGenerator, allowing you to handle
   * results as they arrive. You can call `collect()` on it to get all the
   * results as a list.
   *
   * You can sync items of different types in a single syncList, and you can use
   * `client.isItemType` to handle different item types.
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
        },
        this.connectOptions,
      );
      return new ListResult(handleSyncListResponse(this.unmarshal.bind(this), responseStream));
    } catch (e) {
      throw StatelyError.from(e);
    }
  }

  /**
   * Transaction starts a transaction, within which you can issue writes and
   * reads in any order, and all writes will either succeed or all will fail.
   * Reads are guaranteed to reflect the state as of when the transaction
   * started. This method may fail if another transaction commits before this
   * one finishes
   * - in that case, you should retry your transaction.
   *
   * If any error is thrown from the handler, the transaction is aborted and
   * none of the changes made in it will be applied. If the handler returns
   * without error, the transaction is automatically committed.
   *
   * If any of the operations in the handler fails (e.g. a request is invalid)
   * you may not find out until the *next* operation, or once the handler
   * returns, due to some technicalities about how requests are handled.
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
        unmarshal: this.unmarshal.bind(this),
        marshal: this.marshal.bind(this),
        isType: this.isType.bind(this),
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
    return new DatabaseClient(this.client, this.storeId, this.typeMap, {
      ...this.callOptions,
      signal,
    });
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
    return new DatabaseClient(this.client, this.storeId, this.typeMap, {
      ...this.callOptions,
      timeoutMs,
    });
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
    return new DatabaseClient(this.client, this.storeId, this.typeMap, {
      ...this.callOptions,
      deadline,
    });
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
    return new DatabaseClient(this.client, this.storeId, this.typeMap, {
      ...this.callOptions,
      allowStale,
    });
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
