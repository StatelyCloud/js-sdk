import { Code } from "@connectrpc/connect";
import { type Item as ApiItem } from "./api/db/item_pb.js";
import type { ListResponse } from "./api/db/list_pb.js";
import { type ListToken } from "./api/db/list_token_pb.js";
import { type SyncListResponse } from "./api/db/sync_list_pb.js";
import { type TransactionListResponse } from "./api/db/transaction_pb.js";
import { StatelyError } from "./errors.js";
import type { AnyItem, ItemTypeMap } from "./types.js";

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

  /**
   * Collect all of the items from the generator into an array, and return the
   * list token. This is a convenience for when you don't want to handle the
   * items in a streaming fashion (e.g. with `for await`).
   */
  async collect(): Promise<{ items: ResultType[]; token: ListToken }> {
    const items: ResultType[] = [];
    let next: IteratorResult<ResultType, ListToken | undefined>;
    while (!(next = await this.next()).done) {
      items.push(next.value);
    }
    const token = next.value!;
    return { items, token };
  }
}

/**
 * A helper to consume a ListResponse as an async generator of items.
 */
export async function* handleListResponse<
  TypeMap extends ItemTypeMap,
  AllItemTypes extends keyof TypeMap,
>(
  unmarshal: (item: ApiItem) => AnyItem<TypeMap, AllItemTypes>,
  responseStream: AsyncIterable<ListResponse | TransactionListResponse>,
): AsyncGenerator<AnyItem<TypeMap, AllItemTypes>, ListToken> {
  try {
    for await (const resp of responseStream) {
      switch (resp.response?.case) {
        case "result":
          for (const item of resp.response.value.items) {
            yield unmarshal(item);
          }
          break;
        case "finished":
          return resp.response.value.token!;
        default:
      }
    }
  } catch (e) {
    throw StatelyError.from(e);
  }
  throw new StatelyError("StreamClosed", "unexpected end of list stream", Code.FailedPrecondition);
}

/**
 * A helper to consume a ListResponse as an async generator of items.
 */
export async function* handleSyncListResponse<
  TypeMap extends ItemTypeMap,
  AllItemTypes extends keyof TypeMap,
>(
  unmarshal: (item: ApiItem) => AnyItem<TypeMap, AllItemTypes>,
  responseStream: AsyncIterable<SyncListResponse>,
): AsyncGenerator<SyncResult<TypeMap, AllItemTypes>, ListToken> {
  for await (const resp of responseStream) {
    switch (resp.response?.case) {
      case "reset":
        yield { type: "reset" };
        break;
      case "result": {
        const v = resp.response.value;
        for (const item of v.changedItems) {
          yield { type: "changed", item: unmarshal(item) };
        }
        for (const item of v.deletedItems) {
          yield { type: "deleted", keyPath: item.keyPath };
        }
        for (const keyPath of v.updatedItemKeysOutsideListWindow) {
          yield { type: "updatedOutsideWindow", keyPath: keyPath };
        }
        break;
      }
      case "finished":
        return resp.response.value.token!;
      default:
    }
  }
  throw new StatelyError("EndOfStream", "unexpected end of stream", Code.Aborted);
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
export type SyncResult<TypeMap extends ItemTypeMap, AllItemTypes extends keyof TypeMap> =
  | SyncReset
  | SyncChangedItem<AnyItem<TypeMap, AllItemTypes>>
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
export interface SyncChangedItem<T> {
  type: "changed";
  item: T;
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
