import { create, type MessageShape } from "@bufbuild/protobuf";
import { EmptySchema } from "@bufbuild/protobuf/wkt";
import { Code } from "@connectrpc/connect";
import { type WritableIterable } from "@connectrpc/connect/protocol";
import { ContinueListDirection } from "./api/db/continue_list_pb.js";
import { GetItemSchema, type GetItem } from "./api/db/get_pb.js";
import { type Item as ApiItem } from "./api/db/item_pb.js";
import { SortableProperty } from "./api/db/item_property_pb.js";
import { SortDirection } from "./api/db/list_pb.js";
import { type ListToken } from "./api/db/list_token_pb.js";
import {
  TransactionDeleteSchema,
  TransactionGetSchema,
  TransactionPutSchema,
  TransactionRequestSchema,
  type TransactionRequest,
  type TransactionResponse,
} from "./api/db/transaction_pb.js";
import { StatelyError } from "./errors.js";
import { handleListResponse, ListResult } from "./list-result.js";
import { type AnyItem, type Item, type ItemTypeMap, type ListOptions } from "./types.js";

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
export class TransactionHelper<TypeMap extends ItemTypeMap, AllItemTypes extends keyof TypeMap> {
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
   * getBatch retrieves up to 100 items by their full key paths. This will return
   * the corresponding items that exist. It will fail if the caller does not
   * have permission to read Items. Use BeginList if you want to retrieve
   * multiple items but don't already know the full key paths of the items you
   * want to get. You can get items of different types in a single getBatch -
   * you will need to use `DatabaseClient.isItemOfType` to determine what item
   * type each item is.
   * @param keyPaths - The full key path of each item to load. Max 100 key paths.
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
   * putBatch adds up to 50 Items to the Store, or replaces Items if they already exist
   * at that path. This will fail if the caller does not have permission to
   * create Items. Data can be provided as either JSON, or as a proto encoded by
   * a previously agreed upon schema, or by some combination of the two. You can
   * put items of different types in a single putBatch. Puts will not be
   * acknowledged until the transaction is committed - the TransactionResult
   * will contain the updated metadata for each item.
   * @param items - Items from your generated schema. Max 50 items.
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
    ...items: Items
  ): Promise<(bigint | Uint8Array | undefined)[]> {
    const result = await this.requestResponse(
      "putItems",
      "putAck",
      create(TransactionPutSchema, {
        puts: items.map((data) => ({
          item: this.client.marshal(data),
        })),
      }),
    );
    return result.generatedIds.map((id) => id.value.value);
  }

  /**
   * put adds an Item to the Store, or replaces the Item if it already exists at
   * that path. This will fail if the caller does not have permission to create
   * Items.
   * @param item - An Item from your generated schema.
   * @returns A generated ID for the item, if that item had an ID generated for
   * its "initialValue" field. Otherwise the value is undefined. This value can
   * be used in subsequent puts to reference newly created items.
   * @example
   * let lightsaber = client.create("Equipment", { color: "green", jedi: "luke", type: "lightsaber" });
   * lightsaber = await client.put(lightsaber);
   */
  async put<I extends AnyItem<TypeMap, AllItemTypes>>(
    item: I,
  ): Promise<bigint | Uint8Array | undefined> {
    return (await this.putBatch(item))[0];
  }

  /**
   * del removes up to 50 Items from the Store by their full key paths. This
   * will fail if the caller does not have permission to delete Items.
   * @param keyPaths - The full key paths of the items. Max 50 key paths.
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
    { limit = 0, sortDirection = SortDirection.SORT_ASCENDING }: ListOptions = {},
  ): ListResult<AnyItem<TypeMap, AllItemTypes>> {
    const reqMessageId = this.nextMessageId();
    this.outgoing.write(
      create(TransactionRequestSchema, {
        messageId: reqMessageId,
        command: {
          case: "beginList",
          value: {
            keyPathPrefix,
            limit,
            sortProperty: SortableProperty.KEY_PATH,
            sortDirection,
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
export type Transaction<TypeMap extends ItemTypeMap, AllItemTypes extends keyof TypeMap> = Omit<
  TransactionHelper<TypeMap, AllItemTypes>,
  "resp" | "nextMessageId" | "commit" | "abort"
>;

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
