/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";
import { OperationError } from "../common/error.pb.js";

export interface DeleteRequest {
  /**
   * store_id is a globally unique Store ID, which can be looked up from the
   * console or CLI.
   */
  storeId: bigint;
  /** deletes is one or more items to be deleted from the Group. */
  deletes: DeleteItem[];
  /**
   * atomic indicates that all deletes must succeed or none will (i.e. that they
   * are applied in a transaction), and that other operations will be serialized
   * ahead or behind this operation. Some store configurations may ignore this
   * option and will always apply the whole batch in a transaction (such as in
   * version-tracking stores). Note that this has no effect if there is only one
   * delete. Enabling this option increases cost and latency, and may result in
   * the operation failing if it conflicts with another atomic operation.
   */
  atomic: boolean;
}

export interface DeleteItem {
  /** key_path is the full path to the item. See Item#key_path for more details. */
  keyPath: string;
}

export interface DeleteResult {
  /** The key_path of the item that was deleted. */
  keyPath: string;
  /**
   * error is the error that occurred while deleting this item, if any. error is
   * not set if the item was successfully deleted (or didn't exist in the first
   * place).
   */
  error: OperationError | undefined;
}

export interface DeleteResponse {
  /** results is the result of each delete operation, whether it succeeded or failed. */
  results: DeleteResult[];
}

function createBaseDeleteRequest(): DeleteRequest {
  return { storeId: BigInt("0"), deletes: [], atomic: false };
}

export const DeleteRequest = {
  encode(message: DeleteRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.storeId !== BigInt("0")) {
      if (BigInt.asUintN(64, message.storeId) !== message.storeId) {
        throw new globalThis.Error(
          "value provided for field message.storeId of type uint64 too large",
        );
      }
      writer.uint32(8).uint64(message.storeId.toString());
    }
    for (const v of message.deletes) {
      DeleteItem.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    if (message.atomic !== false) {
      writer.uint32(32).bool(message.atomic);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeleteRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeleteRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.storeId = longToBigint(reader.uint64() as Long);
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.deletes.push(DeleteItem.decode(reader, reader.uint32()));
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

function createBaseDeleteItem(): DeleteItem {
  return { keyPath: "" };
}

export const DeleteItem = {
  encode(message: DeleteItem, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.keyPath !== "") {
      writer.uint32(10).string(message.keyPath);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeleteItem {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeleteItem();
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

function createBaseDeleteResult(): DeleteResult {
  return { keyPath: "", error: undefined };
}

export const DeleteResult = {
  encode(message: DeleteResult, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.keyPath !== "") {
      writer.uint32(10).string(message.keyPath);
    }
    if (message.error !== undefined) {
      OperationError.encode(message.error, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeleteResult {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeleteResult();
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
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseDeleteResponse(): DeleteResponse {
  return { results: [] };
}

export const DeleteResponse = {
  encode(message: DeleteResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.results) {
      DeleteResult.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeleteResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeleteResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.results.push(DeleteResult.decode(reader, reader.uint32()));
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
