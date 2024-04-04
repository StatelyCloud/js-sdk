/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";
import { OperationError } from "../common/error.pb.js";
import { Struct } from "../google/protobuf/struct.pb.js";
import { ItemMetadata } from "./item.pb.js";

export interface AppendRequest {
  /**
   * store_id is a globally unique Store ID, which can be looked up from the
   * console or CLI.
   */
  storeId: bigint;
  /**
   * parent_path is the full path, in the form
   * /item_type-item_id/[{sub_item_type}-{sub_item_id}...}], under which each
   * item will be appended. The item will be appended as a direct child of this
   * path. Note that the path *may* be "/" to create root-level items, though
   * some ID assignment options may not be available in that case.
   */
  parentPath: string;
  /** appends is one or more items to be appended under the parent path. */
  appends: AppendItem[];
  /**
   * atomic indicates that all appends must succeed or none will (i.e. that they
   * are applied in a transaction), and that other operations will be serialized
   * ahead or behind this operation. Some store configurations may ignore this
   * option and will always apply the whole batch in a transaction (such as in
   * version-tracking stores). Note that this has no effect if there is only one
   * append. Enabling this option increases cost and latency, and may result in
   * the operation failing if it conflicts with another atomic operation. Also,
   * some ID assignment options may not be available depending on this option -
   * e.g. you cannot do SEQUENTIAL appends with atomic = false.
   */
  atomic: boolean;
}

/**
 * AppendItem is the payload to be appended. This is mostly a copy of Item
 * except we have a parent_key_path and item_type, but no item ID, since the resulting full key_path is determined by the
 * parent_key_path plus an auto-assigned ID.
 */
export interface AppendItem {
  /** item_type is the type of item to be appended. All items must have a type. */
  itemType: string;
  /**
   * id_assignment chooses how the item's ID will be assigned. Not all options
   * are applicable for all types of items or store configurations.
   */
  idAssignment: AppendItem_IDAssignment;
  /**
   * json is a proto-encoded JSON object, to support storing JSON documents, or
   * to support storing the remainder of data that cannot be represented as
   * proto.
   * TODO: We may want to replace this with something a bit more powerful such
   * as BSON - still a map of string key to value, but with a larger vocabulary
   * of value types.
   */
  json: { [key: string]: any } | undefined;
  /**
   * proto is an arbitrary binary proto message, following the schema for this
   * item type (TBD). It is entirely possible for an item to store both proto
   * data AND json data - for example, if only a subset of its data has a
   * defined proto schema that informs its representation. We don't use the Any
   * type here because it is both inefficient (it encodes the entire type name
   * as a string), but also we should know via external schema what type of
   * proto this is.
   */
  proto: Uint8Array;
}

export const AppendItem_IDAssignment = {
  ID_ASSIGNMENT_UNSPECIFIED: 0,
  /**
   * SEQUENCE - SEQUENCE will assign the item a monotonically increasing, contiguous ID
   * that is unique *within the parent path and item type*. This is only valid
   * for non-root items and when atomic = true (or within a transaction).
   */
  SEQUENCE: 1,
  /**
   * UUID - UUID will assign the item a globally unique 128-bit UUID. This will be
   * encoded in the item key path as a binary ID. This is usable anywhere, in
   * any store config.
   */
  UUID: 2,
  /**
   * RAND53 - RAND53 will assign the item a random 53-bit numeric ID that
   * is unique *within the parent path and item type*, but is not globally
   * unique. This is usable anywhere, in any store config. We use 53 bits
   * instead of 64 because 53 bits is still a lot of bits, and it's the largest
   * integer that can be represented exactly in JavaScript.
   */
  RAND53: 3,
  UNRECOGNIZED: -1,
} as const;

export type AppendItem_IDAssignment =
  (typeof AppendItem_IDAssignment)[keyof typeof AppendItem_IDAssignment];

export namespace AppendItem_IDAssignment {
  export type ID_ASSIGNMENT_UNSPECIFIED = typeof AppendItem_IDAssignment.ID_ASSIGNMENT_UNSPECIFIED;
  export type SEQUENCE = typeof AppendItem_IDAssignment.SEQUENCE;
  export type UUID = typeof AppendItem_IDAssignment.UUID;
  export type RAND53 = typeof AppendItem_IDAssignment.RAND53;
  export type UNRECOGNIZED = typeof AppendItem_IDAssignment.UNRECOGNIZED;
}

export interface AppendResponse {
  /** results are in the same order as the appends in the request, one per append. */
  results: AppendItemResult[];
}

export interface AppendItemResult {
  /**
   * key_path is the full path to the newly appended item, if it was able to be
   * saved. See Item#key_path for more details.
   */
  keyPath: string;
  /**
   * error is the error that occurred while appending this item, if any.
   * error is not set if the item was successfully saved.
   */
  error: OperationError | undefined;
  /** metadata is the version and timestamp metadata for the item that was appended. */
  metadata: ItemMetadata | undefined;
}

function createBaseAppendRequest(): AppendRequest {
  return { storeId: BigInt("0"), parentPath: "", appends: [], atomic: false };
}

export const AppendRequest = {
  encode(message: AppendRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.storeId !== BigInt("0")) {
      if (BigInt.asUintN(64, message.storeId) !== message.storeId) {
        throw new globalThis.Error(
          "value provided for field message.storeId of type uint64 too large",
        );
      }
      writer.uint32(8).uint64(message.storeId.toString());
    }
    if (message.parentPath !== "") {
      writer.uint32(18).string(message.parentPath);
    }
    for (const v of message.appends) {
      AppendItem.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    if (message.atomic !== false) {
      writer.uint32(32).bool(message.atomic);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): AppendRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAppendRequest();
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

          message.parentPath = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.appends.push(AppendItem.decode(reader, reader.uint32()));
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

function createBaseAppendItem(): AppendItem {
  return { itemType: "", idAssignment: 0, json: undefined, proto: new Uint8Array(0) };
}

export const AppendItem = {
  encode(message: AppendItem, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.itemType !== "") {
      writer.uint32(10).string(message.itemType);
    }
    if (message.idAssignment !== 0) {
      writer.uint32(16).int32(message.idAssignment);
    }
    if (message.json !== undefined) {
      Struct.encode(Struct.wrap(message.json), writer.uint32(26).fork()).ldelim();
    }
    if (message.proto.length !== 0) {
      writer.uint32(34).bytes(message.proto);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): AppendItem {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAppendItem();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.itemType = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.idAssignment = reader.int32() as any;
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.json = Struct.unwrap(Struct.decode(reader, reader.uint32()));
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.proto = reader.bytes();
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

function createBaseAppendResponse(): AppendResponse {
  return { results: [] };
}

export const AppendResponse = {
  encode(message: AppendResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.results) {
      AppendItemResult.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): AppendResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAppendResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.results.push(AppendItemResult.decode(reader, reader.uint32()));
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

function createBaseAppendItemResult(): AppendItemResult {
  return { keyPath: "", error: undefined, metadata: undefined };
}

export const AppendItemResult = {
  encode(message: AppendItemResult, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
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

  decode(input: _m0.Reader | Uint8Array, length?: number): AppendItemResult {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAppendItemResult();
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
