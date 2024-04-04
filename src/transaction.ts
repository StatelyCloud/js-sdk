import { ClientError } from "nice-grpc-common";
import { AppendItem, AppendItem_IDAssignment } from "./api/data/append.pb.js";
import { DeleteItem } from "./api/data/delete.pb.js";
import type { GetItem } from "./api/data/get.pb.js";
import { SortableProperty } from "./api/data/item-property.pb.js";
import type { Item as ApiItem } from "./api/data/item.pb.js";
import { SortDirection } from "./api/data/list.pb.js";
import type { PutItem } from "./api/data/put.pb.js";
import type { TransactionRequest, TransactionResponse } from "./api/data/transaction.pb.js";
import {
  ItemAppend,
  ItemPut,
  ListToken,
  itemKeyToString,
  type DataClient,
  type Item,
  type ItemKey,
  type JSONObject,
  type ListOptions,
} from "./data.js";
import { convertToItem } from "./item.js";
import { ListResult, collectListResponse, handleListResponse } from "./list-result.js";

/**
 * This allows us to queue messages to send to the server. It implements
 * AsyncIteratable so it can be used directly in the transaction method.
 */
class BlockingQueue<T> implements AsyncIterator<T>, AsyncIterable<T> {
  private queue: T[] = [];
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-empty-function
  private resolveNext: () => void = () => {};
  private currentPromise: Promise<void> = Promise.resolve();

  push(item: T): void {
    this.queue.push(item);
    const resolver = this.resolveNext;
    this.cyclePromise();
    resolver();
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return this;
  }

  // Waits until the next result is available (e.g. the next push() call if the queue is empty)
  async next(): Promise<IteratorResult<T>> {
    if (this.queue.length > 0) {
      return { done: false, value: this.queue.shift()! };
    }
    await this.currentPromise;
    if (this.queue.length > 0) {
      return { done: false, value: this.queue.shift()! };
    }
    return { done: true, value: undefined };
  }

  async close() {
    this.queue = [];
    this.resolveNext();
  }

  private cyclePromise() {
    this.currentPromise = new Promise((r) => {
      this.resolveNext = r;
    });
  }
}

// Crazy TypeScript helpers for ts-proto generated unions

/** Extracts all the field names of a ts-proto generated oneOf */
type OneOfCases<T> = T extends { $case: infer U extends string } ? U : never;
// /** Extracts all the possible values of a ts-proto generated oneOf */
// type OneOfValues<T> = T extends { $case: infer U extends string; [key: string]: unknown }
//   ? T[U]
//   : never;
/** Extracts the specific type of a a ts-proto generated oneOf case based on its field name */
type OneOfCase<T, K extends OneOfCases<T>> = T extends {
  $case: infer U extends K;
  [key: string]: unknown;
}
  ? T[U]
  : never;

/**
 * Validates that a response contains the right result case, and that it's the
 * response to the right request (by message ID).
 */
function expectResponse<K extends OneOfCases<TransactionResponse["result"]>>(
  response: IteratorResult<TransactionResponse>,
  c: K,
  reqMessageId: number,
): OneOfCase<TransactionResponse["result"], K> {
  if (response.done) {
    throw new Error("unexpected end of stream");
  }
  const result = response.value;
  if (result.messageId !== reqMessageId) {
    throw new Error(
      `unexpected response message ID: wanted ${reqMessageId}, got ${result.messageId}`,
    );
  }
  const respOpt = result.result;
  if (respOpt === undefined || respOpt.$case !== c) {
    throw new Error(`unexpected response type: ${result.result?.$case}, wanted ${c}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  return (respOpt as any)[c];
}

const empty = new Uint8Array(0);

/** TransactionHelper coordinates sending requests and awaiting responses for
 * all of the transaction methods. It is passed directly to the user-defined
 * handler function.
 */
class TransactionHelper {
  private _messageId = 1;
  private outgoing: BlockingQueue<TransactionRequest>;
  resp: AsyncIterator<TransactionResponse> | undefined;

  private putItems: Record<string, ApiItem> = {};
  private appendItems: JSONObject[] = [];

  constructor(storeId: bigint, outgoing: BlockingQueue<TransactionRequest>) {
    this.outgoing = outgoing;
    outgoing.push({
      messageId: this.nextMessageId(),
      command: {
        $case: "begin",
        begin: {
          storeId,
        },
      },
    });
  }

  /** Each outgoing message should get its own unique ID */
  nextMessageId(): number {
    return this._messageId++;
  }

  /**
   * getBatch retrieves a set of items by their full key paths. This will return
   * the items that exist. Use BeginList if you want to retrieve multiple items
   * but don't already know the full key paths of the items you want to get. You
   * can get items of different types in a single getBatch, but you will need to
   * relax the type argument to a supertype of your items, likely `JSONObject`,
   * and then use `itemsOfType` to filter them back out.
   * @param keyPaths - The full key path of each item to load.
   * @example
   * const items = await txn.getBatch<Equipment>(dataClient,
   * ["/jedi-luke/equipment-lightsaber", "/jedi-luke/equipment-cloak"]);
   */
  async getBatch<T extends JSONObject = JSONObject>(
    keyPaths: (string | ItemKey)[],
  ): Promise<Item<T>[]> {
    const gets: GetItem[] = keyPaths.map((keyPath) => ({
      keyPath: typeof keyPath === "string" ? keyPath : itemKeyToString(keyPath),
    }));
    const response = await this.requestResponse("getItems", "getResults", {
      gets,
    });
    return response.items.map((item) => convertToItem<T>(item));
  }

  /**
   * get retrieves an item by its full key path. This will return the item if it
   * exists, or undefined if it does not.
   * @param keyPath - The full key path of the item.
   * @example
   * const item = await txn.get<Equipment>("/jedi-luke/equipment-lightsaber");
   */
  async get<T extends JSONObject = JSONObject>(
    keyPath: string | ItemKey,
  ): Promise<Item<T> | undefined> {
    return (await this.getBatch<T>([keyPath]))[0];
  }

  /**
   * putBatch adds Items to the Store, or replaces Items if they already exist
   * at that path. You can put items of different types in a single putBatch,
   * but you will need to relax the type argument to a supertype of your items,
   * likely `JSONObject`. Puts will not be acknowledged until the transaction is
   * committed - the TransactionResult will contain the updated metadata for
   * each item.
   * @param puts - The full key path of each item and its data. This supports
   * any JSON-serializable data, but not custom classes, functions, Maps, Sets,
   * etc.
   * @example
   * await txn.putBatch([
   *   { keyPath: "/jedi-luke/equipment-lightsaber", data: { color: "green" }},
   *   { keyPath: "/jedi-luke/equipment-cloak", data: { color: "brown" }}
   * ]);
   */
  async putBatch<T extends JSONObject>(puts: ItemPut<T>[]): Promise<void> {
    const putItems: PutItem[] = puts.map(({ keyPath, data }) => ({
      item: {
        keyPath: typeof keyPath === "string" ? keyPath : itemKeyToString(keyPath),
        json: data,
        proto: empty,
        metadata: undefined,
      },
    }));
    for (const put of putItems) {
      this.putItems[put.item!.keyPath] = put.item!;
    }
    await this.requestOnly("putItems", {
      puts: putItems,
    });
  }

  /**
   * put adds an Item to the Store, or replaces the Item if it already exists at
   * that path. Puts will not be acknowledged until the transaction is
   * committed - the TransactionResult will contain the updated metadata for
   * each item.
   * @param keyPath - The full key path of the item.
   * @param data - The JSON data to save with the item. This supports any
   * JSON-serializable data, but not custom classes, functions, Maps, Sets, etc.
   * @example
   * const item = await txn.put("/jedi-luke/equipment-lightsaber", { color: "green" });
   */
  async put<T extends JSONObject>(keyPath: string | ItemKey, data: T): Promise<void> {
    await this.putBatch<T>([{ keyPath, data }]);
  }

  /**
   * appendBatch adds one or more new Items to a parent path, automatically
   * assigning IDs via one of several selectable ID generation strategies (not
   * all strategies may be available to all store configurations or path types).
   * Because the ID is generated by the server, the new item is guaranteed not
   * to overwrite an existing Item. This differs from Put specifically because
   * of this ID assignment behavior, and it is recommended over Put for new
   * items where you do not want to assign IDs yourself. The assigned full key
   * paths will be returned immediately for use in other transaction operations,
   * but the rest of the item information (such as its metadata) won't be
   * returned until the transaction completes. You can append items of different
   * types in a single appendBatch, but you will need to relax the type argument
   * to a supertype of your items, likely `JSONObject`.
   * @param parentPath - The full key path of the parent item. Each append will
   * be a new child of this item.
   * @param appends - The item type and data of each item to append, along with
   * which ID assignment strategy you want. This supports any JSON-serializable
   * data, but not custom classes, functions, Maps, Sets, etc.
   * @example
   * const items = await txn.appendBatch("/jedi-luke", [
   *   { itemType: "equipment", id: IDAssignment.SEQUENCE, { name: "lightsaber", color: "green" }},
   *   { itemType: "equipment", id: IDAssignment.SEQUENCE, { name: "cloak", color: "brown" }}
   * ]);
   */
  async appendBatch<T extends JSONObject>(
    parentPath: string | ItemKey,
    appends: ItemAppend<T>[],
  ): Promise<string[]> {
    const appendItems: AppendItem[] = appends.map(({ itemType, id, data }) => ({
      itemType,
      idAssignment: id,
      json: data,
      proto: empty,
    }));
    for (const append of appends) {
      this.appendItems.push(append.data);
    }
    const response = await this.requestResponse("appendItems", "appendAck", {
      parentPath: typeof parentPath === "string" ? parentPath : itemKeyToString(parentPath),
      appends: appendItems,
    });
    return response.keyPaths;
  }

  /**
   * append adds a new Item to a parent path, automatically assigning IDs via one
   * of several selectable ID generation strategies (not all strategies may be
   * available to all store configurations or path types). Because the ID is
   * generated by the server, the new item is guaranteed not to overwrite an
   * existing Item. This differs from Put specifically because of this ID
   * assignment behavior, and it is recommended over Put for new items where you
   * do not want to assign IDs yourself. The assigned full key
   * path will be returned immediately for use in other transaction operations,
   * but the rest of the item information (such as its metadata) won't be
   * returned until the transaction completes.
   * @param parentPath - The full key path of the parent item. Each append will be
   * a new child of this item.
   * @param itemType - The item type of the newly added item.
   * @param idAssignment - The ID assignment strategy to use when picking this
   * item's ID.
   * @param data - this supports any JSON-serializable data, but not custom
   * classes, functions, Maps, Sets, etc.
   * @example
   * const items = await txn.append([
   *   {"/jedi-luke/equipment-lightsaber", { color: "green" }},
   *   {"/jedi-luke/equipment-cloak", { color: "brown" }}
   * ]);
   */
  async append<T extends JSONObject>(
    parentPath: string | ItemKey,
    itemType: string,
    id: AppendItem_IDAssignment,
    data: T,
  ): Promise<string | undefined> {
    return (await this.appendBatch<T>(parentPath, [{ itemType, id, data }]))[0];
  }

  /**
   * delBatch removes Items from the Store by their full key paths.
   * @param keyPaths - The full key paths (or ItemKeys) of the items.
   * @example
   * await txn.delBatch(["/jedi-luke/equipment-lightsaber", "/jedi-luke/equipment-cloak"]);
   */
  async delBatch(keyPaths: (string | ItemKey)[]): Promise<void> {
    const deletes: DeleteItem[] = keyPaths.map((keyPath) => ({
      keyPath: typeof keyPath === "string" ? keyPath : itemKeyToString(keyPath),
    }));
    await this.requestOnly("deleteItems", {
      deletes,
    });
  }

  /**
   * del removes an Item from the Store by its full key path.
   * @param keyPath - The full key path of the item.
   * @example
   * await txn.del("/jedi-luke/equipment-lightsaber");
   */
  async del(keyPath: string | ItemKey): Promise<void> {
    await this.delBatch([keyPath]);
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
   * const listResp = txn.beginListStream<Equipment>("/jedi-luke/equipment-lightsaber/");
   * for await (const item of listResp) {
   *   console.log(item);
   * }
   * const token = listResp.token;
   * @example
   * // Direct iteration "for await"
   * const listResp = txn.beginListStream<Equipment>("/jedi-luke/equipment-lightsaber/");
   * let next;
   * while (!(next = await listResp.next()).done) {
   *   console.log(next.value);
   * }
   * const token = next.value;
   */
  beginListStream<T extends JSONObject = JSONObject>(
    keyPathPrefix: string | ItemKey,
    { limit = 0, sortDirection = SortDirection.SORT_ASCENDING }: ListOptions = {},
  ): ListResult<Item<T>> {
    // TODO: this needs to be streamy
    const reqMessageId = this.nextMessageId();
    this.outgoing.push({
      messageId: reqMessageId,
      command: {
        $case: "beginList",
        beginList: {
          keyPathPrefix:
            typeof keyPathPrefix === "string" ? keyPathPrefix : itemKeyToString(keyPathPrefix),
          limit,
          sortProperty: SortableProperty.KEY_PATH,
          sortDirection,
        },
      },
    });

    return new ListResult(handleListResponse(this.streamListResponses(reqMessageId)));
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
   * @param keyPathPrefix - The key path prefix to query for.
   * @example
   * const { items, token } = await txn.beginList<Equipment>("/jedi-luke/equipment-lightsaber/");
   */
  async beginList<T extends JSONObject = JSONObject>(
    keyPathPrefix: string | ItemKey,
    opts?: ListOptions,
  ): Promise<{ items: Item<T>[]; token: ListToken }> {
    return collectListResponse(this.beginListStream<T>(keyPathPrefix, opts));
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
   * const listResp = txn.continueListStream<Equipment>(token.data);
   * for await (const item of listResp) {
   *   console.log(item);
   * }
   * const token = listResp.token;
   * @example
   * // Direct iteration "for await"
   * const listResp = txn.continueListStream<Equipment>(token.data);
   * let next;
   * while (!(next = await listResp.next()).done) {
   *   console.log(next.value);
   * }
   * const token = next.value;
   */
  continueListStream<T extends JSONObject = JSONObject>(
    tokenData: Uint8Array | ListToken,
  ): ListResult<Item<T>> {
    // TODO: this needs to be streamy
    const reqMessageId = this.nextMessageId();
    this.outgoing.push({
      messageId: reqMessageId,
      command: {
        $case: "continueList",
        continueList: {
          tokenData: "tokenData" in tokenData ? tokenData.tokenData : tokenData,
          direction: SortDirection.SORT_ASCENDING,
        },
      },
    });

    return new ListResult(handleListResponse(this.streamListResponses(reqMessageId)));
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
   * @param tokenData - the token data from the previous list operation.
   * @example
   * const { items, token } = await txn.continueList(token.tokenData);
   */
  async continueList<T extends JSONObject = JSONObject>(
    tokenData: Uint8Array | ListToken,
  ): Promise<{ items: Item<T>[]; token: ListToken }> {
    return collectListResponse(this.continueListStream<T>(tokenData));
  }

  private async *streamListResponses(reqMessageId: number) {
    while (true) {
      yield expectResponse(await this.resp!.next(), "listResults", reqMessageId);
    }
  }

  /**
   * commit finalizes the transaction, applying all the changes made within it.
   * This is called automatically if the user-provided handler returns without
   * error.
   * @private
   */
  async commit(): Promise<TransactionResult> {
    const finished = await this.requestResponse("commit", "finished", {});
    return {
      puts: finished.putResults.map((result) => {
        const item = this.putItems[result.keyPath];
        if (!item) {
          throw new Error("response returned an item we didn't put!");
        }
        return convertToItem<JSONObject>({ ...item, metadata: result.metadata! });
      }),
      appends: finished.appendResults.map((result, i) => {
        const item = this.appendItems[i];
        if (!item) {
          throw new Error("response returned an item we didn't append!");
        }
        return convertToItem<JSONObject>({
          keyPath: result.keyPath,
          metadata: result.metadata!,

          json: item,
          proto: empty,
        });
      }),
    };
  }

  /**
   * abort cancels the transaction, discarding all changes made within it. This
   * is called automatically if the handler throws an error.
   * @private
   */
  async abort(): Promise<void> {
    await this.requestResponse("abort", "finished", {});
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
    this.outgoing.push({
      messageId: reqMessageId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      command: {
        $case: inCase,
        [inCase]: req,
      } as any,
    });
    return expectResponse(await this.resp!.next(), outCase, reqMessageId);
  }

  /** A helper that only sends an input command, without expecting any output result. */
  private async requestOnly<In extends OneOfCases<TransactionRequest["command"]>>(
    inCase: In,
    req: OneOfCase<TransactionRequest["command"], In>,
  ): Promise<void> {
    this.outgoing.push({
      messageId: this.nextMessageId(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      command: {
        $case: inCase,
        [inCase]: req,
      } as any,
    });
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
export type Transaction = Omit<TransactionHelper, "resp" | "nextMessageId" | "commit" | "abort">;

/**
 * After a transaction is done, this result contains the updated or created
 * items from any puts or appends in the transaction.
 */
export interface TransactionResult {
  /**
   * puts contains the full result of each Put operation as a new Item.
   * Unfortunately we don't know the type of each item so you'll have to convert yourself:
   * @example
   * const myItem = result.puts[0] as Item<MyType>;
   */
  puts: Item[];
  /**
   * appends contains the full result of each Append operation as a new Item.
   * Unfortunately we don't know the type of each item so you'll have to convert yourself:
   * @example
   * const myItem = result.appends[0] as Item<MyType>;
   */
  appends: Item[];
}

/**
 * Transaction performs a transaction, within which you can issue writes and
 * reads in any order, and all writes will either succeed or all will fail.
 * Reads are guaranteed to reflect the state as of when the transaction started.
 * This method may fail if another transaction commits before this one finishes
 * - in that case, you should retry your transaction.
 *
 * If any error is thrown from the handler, the transaction is aborted and none
 * of the changes made in it will be applied. If the handler returns without
 * error, the transaction is automatically committed.
 *
 * If any of the operations in the handler fails (e.g. a request is invalid) you
 * may not find out until the *next* operation, or once the handler returns, due
 * to some technicalities about how requests are handled.
 *
 * @example
 * await transaction(dataClient, async (txn) => {
 *   const item = await txn.get<MyModel>("/path/to/item");
 *   if (item.data.someField === "someValue") {
 *     await txn.put<MyModel>(item.keyPath, { ...item.data, someField: "newValue" });
 *   }
 * });
 */
export async function transaction(
  client: DataClient,
  handler: (txnClient: Transaction) => Promise<void>,
): Promise<TransactionResult> {
  if (!client.supportsBidi) {
    throw new Error(
      "this client does not support transactions (it requires bidirectional streaming which isn't supported from browsers)",
    );
  }

  const outgoing = new BlockingQueue<TransactionRequest>();
  const txnClient = new TransactionHelper(client.storeId, outgoing);
  const respIterable = client._client.transaction(outgoing, client.callOptions);
  txnClient.resp = respIterable[Symbol.asyncIterator]();
  try {
    await handler(txnClient);
    // Close the outgoing queue - nothing should be left in it, but this unlocks the req generator to do its commit.
    return await txnClient.commit();
  } catch (e) {
    if (!(e instanceof ClientError)) {
      try {
        await txnClient.abort();
      } catch (abortErr) {
        // If we can't abort, still throw the original error
      }
    }
    throw e;
  } finally {
    await outgoing.close();
    // Drain the response if there is one (there shouldn't be...)
    let remainingResp: IteratorResult<TransactionResponse>;
    do {
      remainingResp = await txnClient.resp.next();
    } while (!remainingResp.done);
  }

  // TODO: in the future we could auto-retry transactions that fail due to conflicts
}
