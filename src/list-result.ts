import type { ListResponse } from "./api/data/list.pb.js";
import { SyncListResponse } from "./api/data/sync-list.pb.js";
import { TransactionListResponse } from "./api/data/transaction.pb.js";
import type { Item, JSONObject, ListToken } from "./data.js";
import { convertToItem } from "./item.js";

/**
 * ListResult wraps an AsyncGenerator of items and a token. It can be iterated
 * like a normal AsyncGenerator via "for await". However, it also holds on to
 * the token returned from the generator, which would otherwise be lost from
 * within the for loop.
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
export class ListResult<ResultType> implements AsyncGenerator<ResultType, ListToken> {
  private gen: AsyncGenerator<ResultType, ListToken>;

  /**
   * The token that can be used to call continueList or syncList on. This will
   * only be set when the generator is done.
   */
  token?: ListToken;

  constructor(gen: AsyncGenerator<ResultType, ListToken>) {
    this.gen = gen;
  }
  [Symbol.asyncIterator](): AsyncGenerator<ResultType, ListToken> {
    return this;
  }
  async next(...args: [] | [unknown]): Promise<IteratorResult<ResultType, ListToken>> {
    const nextVal = await this.gen.next(...args);
    if (nextVal.done) {
      // Save the token for later
      this.token = nextVal.value!;
    }
    return nextVal;
  }
  return(
    value: ListToken | PromiseLike<ListToken>,
  ): Promise<IteratorResult<ResultType, ListToken>> {
    return this.gen.return(value);
  }
  throw(e: any): Promise<IteratorResult<ResultType, ListToken>> {
    return this.gen.throw(e);
  }
}

/**
 * A helper to consume a ListResponse as an async generator of items.
 */
export async function* handleListResponse<T extends JSONObject>(
  responseStream: AsyncIterable<ListResponse | TransactionListResponse>,
): AsyncGenerator<Item<T>, ListToken> {
  for await (const resp of responseStream) {
    switch (resp.response?.$case) {
      case "result":
        for (const item of resp.response.result.items) {
          yield convertToItem(item);
        }
        break;
      case "finished":
        return resp.response.finished.token!;
      default:
    }
  }
  throw new Error("unexpected end of stream");
}

/**
 * A helper to collect up all of the items from a streaming list response.
 */
export async function collectListResponse<ResultType>(
  stream: AsyncGenerator<ResultType, ListToken | undefined>,
): Promise<{ items: ResultType[]; token: ListToken }> {
  const items: ResultType[] = [];
  let next: IteratorResult<ResultType, ListToken | undefined>;
  while (!(next = await stream.next()).done) {
    items.push(next.value);
  }
  const token = next.value!;
  return { items, token };
}

/**
 * A helper to consume a ListResponse as an async generator of items.
 */
export async function* handleSyncListResponse<T extends JSONObject>(
  responseStream: AsyncIterable<SyncListResponse>,
): AsyncGenerator<SyncResult<T>, ListToken> {
  for await (const resp of responseStream) {
    switch (resp.response?.$case) {
      case "reset":
        yield { type: "reset" };
        break;
      case "result":
        for (const item of resp.response.result.changedItems) {
          yield { type: "changed", item: convertToItem(item) };
        }
        for (const item of resp.response.result.deletedItems) {
          yield { type: "deleted", keyPath: item.keyPath };
        }
        for (const keyPath of resp.response.result.updatedItemKeysOutsideListWindow) {
          yield { type: "updatedOutsideWindow", keyPath: keyPath };
        }
        break;
      case "finished":
        return resp.response.finished.token!;
      default:
    }
  }
  throw new Error("unexpected end of stream");
}

/**
 * Each result from SyncList will be one of these types, which you can use a "switch" statement to handle.
 * @example
 * for await (const result of syncListResult) {
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
export type SyncResult<T extends JSONObject> =
  | SyncReset
  | SyncChangedItem<T>
  | SyncDeletedItem
  | SyncUpdatedItemKeyOutsideListWindow;

/**
 * If the result is a SyncReset, it means that any previously fetched items from
 * this list (from previous calls to Begin/Continue/SyncList) should be
 * discarded, and the results from this SyncList call should form the new result
 * list. This can happen when the sync token is too old, or otherwise at the
 * server's discretion.
 */
export interface SyncReset {
  type: "reset";
}

/**
 * If the result is a SyncChangedItem, it means that the item has been changed
 * or newly created. The item should be "upserted" into the local result set.
 */
export interface SyncChangedItem<T extends JSONObject> {
  type: "changed";
  item: Item<T>;
}

/**
 * If the result is a SyncDeletedItem, it means that the item has been deleted.
 * The item at this key path should be removed from the local result set.
 */
export interface SyncDeletedItem {
  type: "deleted";
  keyPath: string;
}

/**
 * If the result is a SyncUpdatedItemKeyOutsideListWindow, it means that this
 * item was updated, but now falls outside of the list window. This could be
 * irrelevant, but *if* you already have this key path in the local result set,
 * you should remove it. This can generally be handled the same as
 * SyncDeletedItem, except the item has not actually been deleted so you
 * shouldn't necessarily do cleanup you might do for a deleted item.
 */
export interface SyncUpdatedItemKeyOutsideListWindow {
  type: "updatedOutsideWindow";
  keyPath: string;
}
