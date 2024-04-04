/* eslint-disable */
import _m0 from "protobufjs/minimal.js";
import { Item } from "./item.pb.js";
import { ListFinished } from "./list.pb.js";

export interface SyncListRequest {
  /**
   * token_data is an opaque list continuation token returned by a previous call to
   * List, ContinueList, or SyncList.
   */
  tokenData: Uint8Array;
}

/** These are stream messages, so multiple responses may be sent. */
export interface SyncListResponse {
  response?:
    | { $case: "reset"; reset: SyncListReset }
    | { $case: "result"; result: SyncListPartialResponse }
    | {
        $case: "finished";
        finished: ListFinished;
      }
    | undefined;
}

/**
 * SyncListReset is returned if the provided token is too far behind to be able to
 * report deleted items, and subsequent results will start over with a fresh result
 * set. Clients should discard any cached data from this result set and start re-populating it.
 */
export interface SyncListReset {}

export interface SyncListPartialResponse {
  /**
   * Items in the token window that were added or updated since the last
   * sync/list.
   */
  changedItems: Item[];
  /** Items in the token window that were deleted since the last sync/list. */
  deletedItems: DeletedItem[];
  /**
   * Items that were changed but which do not currently use the CustomSortProperty
   * that the list window is based on. This can only be populated when using a
   * CustomSortProperty (in the original BeginList request).
   * It may be that these items have never been in the CustomSortProperty,
   * or that they were in the CustomSortProperty at some point in time but are not now,
   * or that they are in the CustomSortProperty but have moved position and are no longer
   * in the sync able window identified by a token.
   */
  updatedItemKeysOutsideListWindow: string[];
}

export interface DeletedItem {
  /** Since the item was deleted, only the key is provided. */
  keyPath: string;
}

function createBaseSyncListRequest(): SyncListRequest {
  return { tokenData: new Uint8Array(0) };
}

export const SyncListRequest = {
  encode(message: SyncListRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.tokenData.length !== 0) {
      writer.uint32(10).bytes(message.tokenData);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SyncListRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSyncListRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.tokenData = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseSyncListResponse(): SyncListResponse {
  return { response: undefined };
}

export const SyncListResponse = {
  encode(message: SyncListResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    switch (message.response?.$case) {
      case "reset":
        SyncListReset.encode(message.response.reset, writer.uint32(10).fork()).ldelim();
        break;
      case "result":
        SyncListPartialResponse.encode(message.response.result, writer.uint32(18).fork()).ldelim();
        break;
      case "finished":
        ListFinished.encode(message.response.finished, writer.uint32(26).fork()).ldelim();
        break;
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SyncListResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSyncListResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.response = {
            $case: "reset",
            reset: SyncListReset.decode(reader, reader.uint32()),
          };
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.response = {
            $case: "result",
            result: SyncListPartialResponse.decode(reader, reader.uint32()),
          };
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.response = {
            $case: "finished",
            finished: ListFinished.decode(reader, reader.uint32()),
          };
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseSyncListReset(): SyncListReset {
  return {};
}

export const SyncListReset = {
  encode(_: SyncListReset, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SyncListReset {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSyncListReset();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseSyncListPartialResponse(): SyncListPartialResponse {
  return { changedItems: [], deletedItems: [], updatedItemKeysOutsideListWindow: [] };
}

export const SyncListPartialResponse = {
  encode(message: SyncListPartialResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.changedItems) {
      Item.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.deletedItems) {
      DeletedItem.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.updatedItemKeysOutsideListWindow) {
      writer.uint32(26).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SyncListPartialResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSyncListPartialResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.changedItems.push(Item.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.deletedItems.push(DeletedItem.decode(reader, reader.uint32()));
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.updatedItemKeysOutsideListWindow.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseDeletedItem(): DeletedItem {
  return { keyPath: "" };
}

export const DeletedItem = {
  encode(message: DeletedItem, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.keyPath !== "") {
      writer.uint32(10).string(message.keyPath);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeletedItem {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeletedItem();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.keyPath = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};
