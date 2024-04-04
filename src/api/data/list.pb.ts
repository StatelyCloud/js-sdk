/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";
import { SortableProperty } from "./item-property.pb.js";
import { Item } from "./item.pb.js";
import { ListToken } from "./list-token.pb.js";

/** SortDirection represents the direction of iteration. */
export const SortDirection = {
  /** SORT_ASCENDING - This is the default */
  SORT_ASCENDING: 0,
  SORT_DESCENDING: 1,
  UNRECOGNIZED: -1,
} as const;

export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];

export namespace SortDirection {
  export type SORT_ASCENDING = typeof SortDirection.SORT_ASCENDING;
  export type SORT_DESCENDING = typeof SortDirection.SORT_DESCENDING;
  export type UNRECOGNIZED = typeof SortDirection.UNRECOGNIZED;
}

export interface BeginListRequest {
  /**
   * store_id is a globally unique Store ID, which can be looked up from the
   * console or CLI.
   */
  storeId: bigint;
  /**
   * key_path_prefix is the a prefix that limits what items we will return. This
   * must contain at least a root segment. See Item#key_path for more details.
   */
  keyPathPrefix: string;
  /**
   * limit is the maximum number of items to return. If this is not specified or
   * set to 0, it will default to unlimited. Fewer items than the limit may be
   * returned even if there are more items to get - make sure to check
   * token.can_continue.
   */
  limit: number;
  /**
   * allow_stale indicates that you're okay with getting slightly stale items -
   * that is, if you had just changed an item and then call a List operation,
   * you might get the old version of the item. This can result in improved
   * performance, availability, and cost.
   */
  allowStale: boolean;
  /**
   * sort_property is the property of the item to sort the results by. If this
   * is not set, we will sort by key path.
   */
  sortProperty: SortableProperty;
  /**
   * sort_direction is the direction to sort the results in. If this is not set,
   * we will sort in ascending order.
   */
  sortDirection: SortDirection;
}

/** These are stream messages, so multiple responses may be sent. */
export interface ListResponse {
  response?:
    | { $case: "result"; result: ListPartialResult }
    | { $case: "finished"; finished: ListFinished }
    | undefined;
}

export interface ListPartialResult {
  /** results is a list that contains one entry for each Item that was found. */
  items: Item[];
}

export interface ListFinished {
  /**
   * token is always set and represents an updated list continuation token that
   * can be used in subsequent calls to ContinueList or SyncList.
   */
  token: ListToken | undefined;
}

function createBaseBeginListRequest(): BeginListRequest {
  return {
    storeId: BigInt("0"),
    keyPathPrefix: "",
    limit: 0,
    allowStale: false,
    sortProperty: 0,
    sortDirection: 0,
  };
}

export const BeginListRequest = {
  encode(message: BeginListRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.storeId !== BigInt("0")) {
      if (BigInt.asUintN(64, message.storeId) !== message.storeId) {
        throw new globalThis.Error(
          "value provided for field message.storeId of type uint64 too large",
        );
      }
      writer.uint32(8).uint64(message.storeId.toString());
    }
    if (message.keyPathPrefix !== "") {
      writer.uint32(18).string(message.keyPathPrefix);
    }
    if (message.limit !== 0) {
      writer.uint32(24).uint32(message.limit);
    }
    if (message.allowStale !== false) {
      writer.uint32(32).bool(message.allowStale);
    }
    if (message.sortProperty !== 0) {
      writer.uint32(40).int32(message.sortProperty);
    }
    if (message.sortDirection !== 0) {
      writer.uint32(48).int32(message.sortDirection);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BeginListRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBeginListRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.storeId = longToBigint(reader.uint64() as Long);
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.keyPathPrefix = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.limit = reader.uint32();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.allowStale = reader.bool();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.sortProperty = reader.int32() as any;
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.sortDirection = reader.int32() as any;
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

function createBaseListResponse(): ListResponse {
  return { response: undefined };
}

export const ListResponse = {
  encode(message: ListResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    switch (message.response?.$case) {
      case "result":
        ListPartialResult.encode(message.response.result, writer.uint32(10).fork()).ldelim();
        break;
      case "finished":
        ListFinished.encode(message.response.finished, writer.uint32(18).fork()).ldelim();
        break;
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.response = {
            $case: "result",
            result: ListPartialResult.decode(reader, reader.uint32()),
          };
          continue;
        case 2:
          if (tag !== 18) {
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

function createBaseListPartialResult(): ListPartialResult {
  return { items: [] };
}

export const ListPartialResult = {
  encode(message: ListPartialResult, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.items) {
      Item.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListPartialResult {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListPartialResult();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.items.push(Item.decode(reader, reader.uint32()));
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

function createBaseListFinished(): ListFinished {
  return { token: undefined };
}

export const ListFinished = {
  encode(message: ListFinished, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.token !== undefined) {
      ListToken.encode(message.token, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListFinished {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListFinished();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.token = ListToken.decode(reader, reader.uint32());
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

function longToBigint(long: Long) {
  return BigInt(long.toString());
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}
