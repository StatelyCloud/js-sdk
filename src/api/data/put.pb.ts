/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";
import { OperationError } from "../common/error.pb.js";
import { Item, ItemMetadata } from "./item.pb.js";

export interface PutRequest {
  /**
   * store_id is a globally unique Store ID, which can be looked up from the
   * console or CLI.
   */
  storeId: bigint;
  /** puts is one or more items to be put into the Store. */
  puts: PutItem[];
  /**
   * atomic indicates that all puts must succeed or none will (i.e. that they
   * are applied in a transaction), and that other operations will be serialized
   * ahead or behind this operation. Some store configurations may ignore this
   * option and will always apply the whole batch in a transaction (such as in
   * version-tracking stores). Note that this has no effect if there is only one
   * put. Enabling this option increases cost and latency, and may result in the
   * operation failing if it conflicts with another atomic operation.
   */
  atomic: boolean;
}

export interface PutItem {
  /** Item is the full item to be put, including its key_path. */
  item: Item | undefined;
}

export interface PutResponse {
  /** results is the result of each put operation (whether it succeeded or failed). */
  results: PutResult[];
}

export interface PutResult {
  /** The key_path of the item that was put. */
  keyPath: string;
  /**
   * error is the error that occurred while putting this item, if any.
   * error is not set if the item was successfully put.
   */
  error: OperationError | undefined;
  /** metadata is the version and timestamp metadata for the item that was put. */
  metadata: ItemMetadata | undefined;
}

function createBasePutRequest(): PutRequest {
  return { storeId: BigInt("0"), puts: [], atomic: false };
}

export const PutRequest = {
  encode(message: PutRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.storeId !== BigInt("0")) {
      if (BigInt.asUintN(64, message.storeId) !== message.storeId) {
        throw new globalThis.Error(
          "value provided for field message.storeId of type uint64 too large",
        );
      }
      writer.uint32(8).uint64(message.storeId.toString());
    }
    for (const v of message.puts) {
      PutItem.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    if (message.atomic !== false) {
      writer.uint32(24).bool(message.atomic);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PutRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePutRequest();
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

          message.puts.push(PutItem.decode(reader, reader.uint32()));
          continue;
        case 3:
          if (tag !== 24) {
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

function createBasePutItem(): PutItem {
  return { item: undefined };
}

export const PutItem = {
  encode(message: PutItem, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.item !== undefined) {
      Item.encode(message.item, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PutItem {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePutItem();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.item = Item.decode(reader, reader.uint32());
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

function createBasePutResponse(): PutResponse {
  return { results: [] };
}

export const PutResponse = {
  encode(message: PutResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.results) {
      PutResult.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PutResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePutResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.results.push(PutResult.decode(reader, reader.uint32()));
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

function createBasePutResult(): PutResult {
  return { keyPath: "", error: undefined, metadata: undefined };
}

export const PutResult = {
  encode(message: PutResult, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.keyPath !== "") {
      writer.uint32(10).string(message.keyPath);
    }
    if (message.error !== undefined) {
      OperationError.encode(message.error, writer.uint32(18).fork()).ldelim();
    }
    if (message.metadata !== undefined) {
      ItemMetadata.encode(message.metadata, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PutResult {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePutResult();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.keyPath = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.error = OperationError.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.metadata = ItemMetadata.decode(reader, reader.uint32());
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
