/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";
import { Item } from "./item.pb.js";

export interface GetRequest {
  /**
   * store_id is a globally unique Store ID, which can be looked up from the
   * console or CLI.
   */
  storeId: bigint;
  /** gets is one or more requests to get an item its key path. */
  gets: GetItem[];
  /**
   * allow_stale indicates that you're okay with getting a slightly stale item -
   * that is, if you had just changed an item and then call GetItem, you might
   * get the old version of the item. This can result in improved performance,
   * availability, and cost.
   */
  allowStale: boolean;
  /**
   * Atomic indicates that all gets in this request should be executed
   * atomically relative to other requests - that is, it will retrieve the items
   * as they were at the same point in time. If this is false (the default),
   * then each get will be executed independently, meaning each get may be
   * interleaved with modifications by other requests. See
   * https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html#transaction-isolation
   * for an example of why you'd want to use this. Note that this has no effect
   * if there is only one get. Also, allow_stale may not be true if atomic is
   * true. Enabling this option increases cost and latency, and may result in
   * the operation failing if it conflicts with another atomic operation.
   */
  atomic: boolean;
}

export interface GetItem {
  /** key_path is the full path to the item. See Item#key_path for more details. */
  keyPath: string;
}

export interface GetResponse {
  /** results is a list that contains one entry for each Item that was found. */
  items: Item[];
}

function createBaseGetRequest(): GetRequest {
  return { storeId: BigInt("0"), gets: [], allowStale: false, atomic: false };
}

export const GetRequest = {
  encode(message: GetRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.storeId !== BigInt("0")) {
      if (BigInt.asUintN(64, message.storeId) !== message.storeId) {
        throw new globalThis.Error(
          "value provided for field message.storeId of type uint64 too large",
        );
      }
      writer.uint32(8).uint64(message.storeId.toString());
    }
    for (const v of message.gets) {
      GetItem.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    if (message.allowStale !== false) {
      writer.uint32(24).bool(message.allowStale);
    }
    if (message.atomic !== false) {
      writer.uint32(32).bool(message.atomic);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetRequest();
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

          message.gets.push(GetItem.decode(reader, reader.uint32()));
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.allowStale = reader.bool();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.atomic = reader.bool();
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

function createBaseGetItem(): GetItem {
  return { keyPath: "" };
}

export const GetItem = {
  encode(message: GetItem, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.keyPath !== "") {
      writer.uint32(10).string(message.keyPath);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetItem {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetItem();
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

function createBaseGetResponse(): GetResponse {
  return { items: [] };
}

export const GetResponse = {
  encode(message: GetResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.items) {
      Item.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetResponse();
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

function longToBigint(long: Long) {
  return BigInt(long.toString());
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}
