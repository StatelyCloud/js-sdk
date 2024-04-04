/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";
import { Struct } from "../google/protobuf/struct.pb.js";

/**
 * Item represents an entire Item - all of its fields and values, its key path,
 * and extra metadata (when this is an Item appearing in an operation's
 * response).
 */
export interface Item {
  /**
   * key_path is the full path to this item, in the form
   * /item_type-item_id/[{sub_item_type}-{sub_item_id}...}]. It must contain at
   * least one segment with item type and ID, as the first segment identifies a
   * "root path" that forms the partition key for data.
   *
   * For example, to store information about Jedi, you might have /jedi-luke, or
   * to have a sub-item of that item, you could use the path
   * /jedi-luke/equipment-lightsaber. The "type" of this item is the last item
   * type in the path, and the last ID is optional if this is a singleton item.
   */
  keyPath: string;
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
  /**
   * metadata is extra metadata about this item, such as its version numbers and
   * timestamps. This must not be present when the item is being used in
   * PutItem, but will be populated when items are returned from the service.
   */
  metadata: ItemMetadata | undefined;
}

/**
 * ItemMetadata contains server-maintained metadata about the item and its
 * lifecycle, such as timestamps and version numbers.
 */
export interface ItemMetadata {
  /**
   * created_at_micros is the time at which this item was created, as a Unix
   * microsecond timestamp.
   */
  createdAtMicros: bigint;
  /**
   * last_modified_at_micros is the time at which this item was last modified,
   * as a Unix microsecond timestamp.
   */
  lastModifiedAtMicros: bigint;
  /**
   * created_at_version is the group version of the item at the time it was
   * created. This is only populated in stores that are configured to track
   * versions.
   */
  createdAtVersion: bigint;
  /**
   * last_modified_at_version is the group version of the item when it was last
   * modified. This is only populated in stores that are configured to track
   * versions.
   */
  lastModifiedAtVersion: bigint;
}

function createBaseItem(): Item {
  return { keyPath: "", json: undefined, proto: new Uint8Array(0), metadata: undefined };
}

export const Item = {
  encode(message: Item, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.keyPath !== "") {
      writer.uint32(10).string(message.keyPath);
    }
    if (message.json !== undefined) {
      Struct.encode(Struct.wrap(message.json), writer.uint32(18).fork()).ldelim();
    }
    if (message.proto.length !== 0) {
      writer.uint32(26).bytes(message.proto);
    }
    if (message.metadata !== undefined) {
      ItemMetadata.encode(message.metadata, writer.uint32(50).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Item {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseItem();
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

          message.json = Struct.unwrap(Struct.decode(reader, reader.uint32()));
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.proto = reader.bytes();
          continue;
        case 6:
          if (tag !== 50) {
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

function createBaseItemMetadata(): ItemMetadata {
  return {
    createdAtMicros: BigInt("0"),
    lastModifiedAtMicros: BigInt("0"),
    createdAtVersion: BigInt("0"),
    lastModifiedAtVersion: BigInt("0"),
  };
}

export const ItemMetadata = {
  encode(message: ItemMetadata, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.createdAtMicros !== BigInt("0")) {
      if (BigInt.asUintN(64, message.createdAtMicros) !== message.createdAtMicros) {
        throw new globalThis.Error(
          "value provided for field message.createdAtMicros of type uint64 too large",
        );
      }
      writer.uint32(8).uint64(message.createdAtMicros.toString());
    }
    if (message.lastModifiedAtMicros !== BigInt("0")) {
      if (BigInt.asUintN(64, message.lastModifiedAtMicros) !== message.lastModifiedAtMicros) {
        throw new globalThis.Error(
          "value provided for field message.lastModifiedAtMicros of type uint64 too large",
        );
      }
      writer.uint32(16).uint64(message.lastModifiedAtMicros.toString());
    }
    if (message.createdAtVersion !== BigInt("0")) {
      if (BigInt.asUintN(64, message.createdAtVersion) !== message.createdAtVersion) {
        throw new globalThis.Error(
          "value provided for field message.createdAtVersion of type uint64 too large",
        );
      }
      writer.uint32(24).uint64(message.createdAtVersion.toString());
    }
    if (message.lastModifiedAtVersion !== BigInt("0")) {
      if (BigInt.asUintN(64, message.lastModifiedAtVersion) !== message.lastModifiedAtVersion) {
        throw new globalThis.Error(
          "value provided for field message.lastModifiedAtVersion of type uint64 too large",
        );
      }
      writer.uint32(32).uint64(message.lastModifiedAtVersion.toString());
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ItemMetadata {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseItemMetadata();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.createdAtMicros = longToBigint(reader.uint64() as Long);
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.lastModifiedAtMicros = longToBigint(reader.uint64() as Long);
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.createdAtVersion = longToBigint(reader.uint64() as Long);
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.lastModifiedAtVersion = longToBigint(reader.uint64() as Long);
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
