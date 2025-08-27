import { create, type MessageShape } from "@bufbuild/protobuf";
import { EmptySchema } from "@bufbuild/protobuf/wkt";
import { Code } from "@connectrpc/connect";
import { type WritableIterable } from "@connectrpc/connect/protocol";
import { ContinueListDirection } from "./api/db/continue_list_pb.js";
import { type GetItem, GetItemSchema } from "./api/db/get_pb.js";
import { type Item as ApiItem } from "./api/db/item_pb.js";
import { type FilterCondition } from "./api/db/list_filters_pb.js";
import { KeyConditionSchema, Operator, SortDirection } from "./api/db/list_pb.js";
import { type ListToken } from "./api/db/list_token_pb.js";
import { PutItemSchema } from "./api/db/put_pb.js";
import {
  TransactionDeleteSchema,
  TransactionGetSchema,
  TransactionPutSchema,
  type TransactionRequest,
  TransactionRequestSchema,
  type TransactionResponse,
} from "./api/db/transaction_pb.js";
import { MapPutItems, PutOptions, WithPutOptions } from "./database.js";
import { StatelyError } from "./errors.js";
import { handleListResponse, ListResult } from "./list-result.js";
import {
  type AnyItem,
  type Item,
  type ItemTypeMap,
  type ListOptions,
  SchemaID,
  SchemaVersionID,
} from "./types.js";
// Crazy TypeScript helpers for generated unions

/** Extracts all the field names of a generated oneOf */
type OneOfCases<T> = T extends { case: infer U extends string } ? U : never;
/** Extracts the specific type of a a generated oneOf case based on its field name */
type OneOfOption<T, K extends OneOfCases<T>> = T extends {
  case: K;
  value: unknown;
}
  ? T
  : never;
/** Extracts the specific type of a a generated oneOf case based on its field name */
type OneOfCase<T, K extends OneOfCases<T>> = T extends {
  case: K;
  value: unknown;
}
  ? T["value"]
  : never;

/**
 * Validates that a response contains the right result case, and that it's the
 * response to the right request (by message ID). Returns the correct response
 * case value.
 */
function expectResponse<K extends OneOfCases<TransactionResponse["result"]>>(
  response: IteratorResult<TransactionResponse>,
  c: K,
  reqMessageId: number,
): OneOfCase<TransactionResponse["result"], K> {
  if (response.done) {
    throw new StatelyError("EndOfStream", "unexpected end of stream", Code.Aborted);
  }
  const result = response.value;
  if (result.messageId !== reqMessageId) {
    throw new StatelyError(
      "UnexpectedMessageId",
      `unexpected response message ID: wanted ${reqMessageId}, got ${result.messageId}`,
      Code.Internal,
    );
  }
  const respOpt = result.result;
  if (respOpt === undefined || respOpt.case !== c) {
    throw new StatelyError(
      "UnexpectedType",
      `unexpected response type: ${result.result?.case}, wanted ${c}`,
      Code.Internal,
    );
  }

  return respOpt.value as OneOfCase<TransactionResponse["result"], K>;
}

export interface TransactionHelperDeps<
  TypeMap extends ItemTypeMap,
  AllItemTypes extends keyof TypeMap,
> {
  storeId: bigint;
  schemaVersionId: SchemaVersionID;
  schemaId: SchemaID;
  buildFilters: (
    itemTypes: AllItemTypes[],
    celFilters: [AllItemTypes, string][],
  ) => FilterCondition[];
  unmarshal: (item: ApiItem) => AnyItem<TypeMap, AllItemTypes>;
  marshal: (item: AnyItem<TypeMap, AllItemTypes>) => ApiItem;
  isType: <T extends keyof TypeMap>(
    item: MessageShape<TypeMap[keyof TypeMap]> | undefined,
    itemType: T,
  ) => item is Item<TypeMap, T>;
}

/** TransactionHelper coordinates sending requests and awaiting responses for
 * all of the transaction methods. It is passed directly to the user-defined
 * handler function.
 */
export class TransactionHelper<
  TypeMap extends ItemTypeMap,
  AllItemTypes extends keyof TypeMap & string,
> {
  private messageId = 1;
  private client: TransactionHelperDeps<TypeMap, AllItemTypes>;
  private outgoing: WritableIterable<TransactionRequest>;
  private incoming: AsyncIterator<TransactionResponse>;
  private closed = false;

  /** inflight tracks requests that have not yet completed */
  inflight = new Map<number, string>();

  constructor(
    client: TransactionHelperDeps<TypeMap, AllItemTypes>,
    outgoing: WritableIterable<TransactionRequest>,
    incoming: AsyncIterator<TransactionResponse>,
  ) {
    this.outgoing = outgoing;
    this.incoming = incoming;
    this.client = client;
    outgoing.write(
      create(TransactionRequestSchema, {
        messageId: this.nextMessageId(),
        command: {
          case: "begin",
          value: {
            storeId: client.storeId,
            schemaVersionId: client.schemaVersionId,
          },
        },
      }),
    );
  }

  /** Each outgoing message should get its own unique ID */
  private nextMessageId(): number {
    return this.messageId++;
  }

  /**
   * getBatch retrieves multiple items by their full key paths. This will return
   * the corresponding items that exist. Use beginList instead if you want to
   * retrieve multiple items but don't already know the full key paths of the
   * items you want to get. You can get items of different types in a single
   * getBatch - you will need to use `DatabaseClient.isItemOfType` to determine
   * what item type each item is.
   * @param keyPaths - The full key path of each item to load.
   * @example
   * const [firstItem, secondItem] = await txn.getBatch("/jedi-luke/equipment-lightsaber", "/jedi-luke/equipment-cloak");
   * if (client.isItemOfType(firstItem, "Equipment")) {
   *  console.log("Got an Equipment item", firstItem);
   * }
   */
  async getBatch(...keyPaths: string[]): Promise<AnyItem<TypeMap, AllItemTypes>[]> {
    const gets: GetItem[] = keyPaths.map((keyPath) =>
      create(GetItemSchema, {
        keyPath,
      }),
    );
    const response = await this.requestResponse(
      "getItems",
      "getResults",
      create(TransactionGetSchema, {
        gets,
      }),
    );
    return response.items.map((item) => this.client.unmarshal(item));
  }

  /**
   * get retrieves an item by its full key path. This will return the item if it
   * exists, or undefined if it does not.
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
    if (this.client.isType(result, itemType)) {
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
   * put adds an Item to the Store, or replaces the Item if it already exists at
   * that path. Unlike the put method outside of a transaction, this only
   * returns the generated ID of the item, and then only if the item was newly
   * created and has an `initialValue` field in its key. This is so you can use
   * that ID in subsequent puts to reference newly created items. The final put
   * items will not be returned until the transaction is committed, in which
   * case they will be included in the `TransactionResult.puts` list.
   * @param item - An Item from your generated schema. Use `withPutOptions` to
   * specify additional options for this item.
   * @param options - Additional options for this put operation - an alternative
   * to using `withPutOptions`.
   * @returns A generated ID for the item, if that item had an ID generated for
   * its "initialValue" field. Otherwise the value is undefined. This value can
   * be used in subsequent puts to reference newly created items.
   * @example
   * let lightsaber = client.create("Equipment", { color: "green", jedi: "luke", type: "lightsaber" });
   * lightsaber = await client.put(lightsaber);
   */
  async put<I extends AnyItem<TypeMap, AllItemTypes>>(
    item: I | WithPutOptions<I>,
    options?: PutOptions,
  ): Promise<bigint | Uint8Array | undefined> {
    if (options) {
      item = "$typeName" in item ? { item, ...options } : { ...item, ...options };
    }
    const result = await this.putBatch(item);
    return result[0];
  }

  /**
   * putBatch adds multiple Items to the Store, or replaces Items if they
   * already exist at that path. Unlike the put_batch method outside of a
   * transaction, this only returns the generated IDs of the items, and then
   * only if the item was newly created and has an `initialValue` field in its
   * key. The IDs are returned in the same order as the inputs. This is so you
   * can use that ID in subsequent puts to reference newly created items. The
   * final put items will not be returned until the transaction is committed, in
   * which case they will be included in the `TransactionResult.puts` list.
   * @param items - Items from your generated schema. Use
   * `withPutOptions` to add options to individual items.
   * @returns An array of generated IDs for each item, if that item had an ID
   * generated for its "initialValue" field. Otherwise the value is undefined.
   * These are returned in the same order as the input items. This value can be
   * used in subsequent puts to reference newly created items.
   * @example
   * const items = await txn.putBatch(dataClient,
   *   client.create("Equipment", { color: "green", jedi: "luke", type: "lightsaber" }),
   *   client.create("Equipment", { color: "brown", jedi: "luke", type: "cloak" }),
   * );
   */
  async putBatch<Items extends AnyItem<TypeMap, AllItemTypes>[]>(
    ...items: MapPutItems<TypeMap, AllItemTypes, Items>
  ): Promise<(bigint | Uint8Array | undefined)[]> {
    const putItems = items.map((data) => {
      if ("$typeName" in data) {
        return create(PutItemSchema, { item: this.client.marshal(data) });
      } else if ("item" in data) {
        return create(PutItemSchema, {
          item: this.client.marshal(data.item),
          mustNotExist: Boolean(data.mustNotExist),
        });
      } else {
        throw new StatelyError(
          "NotAnItem",
          "Request item is not a protobuf object",
          Code.InvalidArgument,
        );
      }
    });

    const result = await this.requestResponse(
      "putItems",
      "putAck",
      create(TransactionPutSchema, {
        puts: putItems,
      }),
    );
    return result.generatedIds.map((id) => id.value.value);
  }

  /**
   * delete removes one or more items from the Store by their full key paths.
   * delete succeeds even if there isn't an item at that key path.
   * @param keyPaths - The full key paths of the items.
   * @example
   * await txn.del("/jedi-luke/equipment-lightsaber", "/jedi-luke/equipment-cloak");
   */
  async del(...keyPaths: string[]): Promise<void> {
    await this.requestOnly(
      "deleteItems",
      create(TransactionDeleteSchema, {
        deletes: keyPaths.map((keyPath) => ({
          keyPath,
        })),
      }),
    );
  }

  /**
   * beginList retrieves Items that start with a specified keyPathPrefix from a
   * single Group. Because it can only list items from a single Group, the key
   * path prefix must at least start with a full Group Key (a single key segment
   * with a namespace and an ID, e.g. `/user-1234`).
   *
   * beginList will return an empty result set if there are no items matching
   * that key prefix. This API returns a token that you can pass to continueList
   * to expand the result set.
   *
   * beginList streams results via an AsyncGenerator, allowing you to handle
   * results as they arrive. You can call `collect()` on it to get all the
   * results as a list.
   *
   * You can list items of different types in a single beginList, and you can
   * use `client.isItemType` to handle different item types.
   * @param keyPathPrefix - The key path prefix to query for. It must be at
   * least a full Group Key (e.g. `/user-1234`).
   * @example
   * // With "for await"
   * const listResp = txn.beginList("/jedi-luke/equipment-lightsaber/");
   * for await (const item of listResp) {
   *   if (client.isItemOfType(item, "Equipment")) {
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
    const reqMessageId = this.nextMessageId();
    const keyConditionParams: [Operator, string | undefined][] = [
      [Operator.GREATER_THAN, gt],
      [Operator.GREATER_THAN_OR_EQUAL, gte],
      [Operator.LESS_THAN, lt],
      [Operator.LESS_THAN_OR_EQUAL, lte],
    ];
    const keyConditions = keyConditionParams
      .filter(([, value]) => value !== undefined)
      .map(([operator, keyPath]) => create(KeyConditionSchema, { operator, keyPath: keyPath! }));

    this.outgoing.write(
      create(TransactionRequestSchema, {
        messageId: reqMessageId,
        command: {
          case: "beginList",
          value: {
            keyPathPrefix,
            limit,
            sortDirection,
            filterConditions: this.client.buildFilters(itemTypes, celFilters),
            keyConditions,
          },
        },
      }),
    );

    return new ListResult(
      handleListResponse(this.client.unmarshal, this.streamListResponses(reqMessageId)),
    );
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
   * const listResp = txn.continueList(dataClient, token.data);
   * for await (const item of listResp) {
   *   if (client.isItemOfType(item, "Equipment")) {
   *     console.log(item.color);
   *   } else {
   *     console.log(item);
   *   }
   * }
   * token = listResp.token;
   */
  continueList(tokenData: Uint8Array | ListToken): ListResult<AnyItem<TypeMap, AllItemTypes>> {
    // TODO: this needs to be streamy
    const reqMessageId = this.nextMessageId();
    this.outgoing.write(
      create(TransactionRequestSchema, {
        messageId: reqMessageId,
        command: {
          case: "continueList",
          value: {
            tokenData: "tokenData" in tokenData ? tokenData.tokenData : tokenData,
            direction: ContinueListDirection.CONTINUE_LIST_FORWARD,
          },
        },
      }),
    );

    return new ListResult(
      handleListResponse(this.client.unmarshal, this.streamListResponses(reqMessageId)),
    );
  }

  private async *streamListResponses(reqMessageId: number) {
    while (true) {
      yield expectResponse(await this.incoming.next(), "listResults", reqMessageId);
    }
  }

  /**
   * commit finalizes the transaction, applying all the changes made within it.
   * This is called automatically if the user-provided handler returns without
   * error.
   * @private
   */
  async commit(): Promise<TransactionResult<TypeMap, AllItemTypes>> {
    const finished = await this.requestResponse("commit", "finished", create(EmptySchema, {}));
    await this.close();
    return {
      puts: finished.putResults.map((result) => this.client.unmarshal(result)),
      committed: finished.committed,
    };
  }

  /**
   * abort cancels the transaction, discarding all changes made within it. This
   * is called automatically if the handler throws an error.
   * @private
   */
  async abort(): Promise<void> {
    await this.requestResponse("abort", "finished", create(EmptySchema, {}));
    await this.close();
  }

  private async close() {
    if (this.closed) {
      return;
    }
    this.closed = true;
    // Close the outgoing queue - nothing should be left in it, but this closes
    // the request stream.
    this.outgoing.close();
    try {
      // Drain the incoming queue to ensure we've read all responses
      let resp: IteratorResult<TransactionResponse>;
      do {
        resp = await this.incoming.next();
      } while (!resp.done);
    } catch (e) {
      // This appears to be a bug in connect, but also we don't care
      if (e instanceof Error && e.message.includes("Premature close")) {
        // ignore
      } else {
        throw e;
      }
    }
  }

  /** A helper that sends an input command, then waits for an output result. */
  private async requestResponse<
    In extends OneOfCases<TransactionRequest["command"]>,
    Out extends OneOfCases<TransactionResponse["result"]>,
  >(
    inCase: In,
    outCase: Out,
    req: OneOfCase<TransactionRequest["command"], In>,
  ): Promise<OneOfCase<TransactionResponse["result"], Out>> {
    const reqMessageId = this.nextMessageId();
    this.inflight.set(reqMessageId, inCase);
    try {
      await this.outgoing.write(
        create(TransactionRequestSchema, {
          messageId: reqMessageId,
          command: {
            case: inCase,
            value: req,
          } as OneOfOption<TransactionRequest["command"], In>,
        }),
      );
      return expectResponse(await this.incoming.next(), outCase, reqMessageId);
    } finally {
      this.inflight.delete(reqMessageId);
    }
  }

  /** A helper that only sends an input command, without expecting any output result. */
  private async requestOnly<In extends OneOfCases<TransactionRequest["command"]>>(
    inCase: In,
    req: OneOfCase<TransactionRequest["command"], In>,
  ): Promise<void> {
    const reqMessageId = this.nextMessageId();
    this.inflight.set(reqMessageId, inCase);
    try {
      await this.outgoing.write(
        create(TransactionRequestSchema, {
          messageId: reqMessageId,
          command: {
            case: inCase,
            value: req,
          } as OneOfOption<TransactionRequest["command"], In>,
        }),
      );
    } finally {
      this.inflight.delete(reqMessageId);
    }
  }
}

/**
 * Transaction has methods for reading and writing items within a transaction.
 * Unlike the non-transactional methods, these methods are intrinsically bound
 * to the transaction and cannot be tree-shaken. Since this is currently only
 * usable from NodeJS, binary size is not as much of a concern.
 *
 * This object should only be referenced from within a transaction handler
 * function (i.e. the argument to `transaction`). The normal data functions
 * should not be used within a transaction handler function`.
 */
export type Transaction<
  TypeMap extends ItemTypeMap,
  AllItemTypes extends keyof TypeMap & string,
> = Omit<TransactionHelper<TypeMap, AllItemTypes>, "resp" | "nextMessageId" | "commit" | "abort">;

/**
 * After a transaction is done, this result contains the updated or created
 * items from any puts or appends in the transaction.
 */
export interface TransactionResult<
  TypeMap extends ItemTypeMap,
  AllItemTypes extends keyof TypeMap,
> {
  /**
   * puts contains the full result of each Put operation as a new Item.
   * Unfortunately we don't know the type of each item so you'll have to convert yourself:
   * @example
   * const myItem = result.puts[0] as Item<MyType>;
   */
  puts: AnyItem<TypeMap, AllItemTypes>[];

  /**
   * Did the commit finish (the alternative is that it was aborted/rolled back)
   */
  committed: boolean;
}
