/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";

/**
 * StoreInfo is a shared representation of the properties of a store that is
 * used by both DescribeStore and UpdateStore.
 */
export interface StoreInfo {
  /**
   * store_id is a globally unique identifier for a store. Users will of course
   * be able to name their stores with friendly names, but for efficiency's sake
   * the API talks in terms of IDs, which the user can find in the console or
   * via a DescribeStore command. Store IDs are assigned by the system when a
   * store is created.
   */
  storeId: bigint;
  /**
   * name is a user-facing, memorable name for the store. While most APIs deal
   * strictly in store IDs, the name will be shown in the console and usable
   * within the API.
   */
  name: string;
  /**
   * description is a longer-form, user-facing explanation of what the store is
   * used for - it is used in the console and in generated documentation. We
   * should encourage users to provide a meaningful description.
   */
  description: string;
}

function createBaseStoreInfo(): StoreInfo {
  return { storeId: BigInt("0"), name: "", description: "" };
}

export const StoreInfo = {
  encode(message: StoreInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.storeId !== BigInt("0")) {
      if (BigInt.asUintN(64, message.storeId) !== message.storeId) {
        throw new globalThis.Error(
          "value provided for field message.storeId of type uint64 too large",
        );
      }
      writer.uint32(8).uint64(message.storeId.toString());
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.description !== "") {
      writer.uint32(26).string(message.description);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StoreInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStoreInfo();
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

          message.name = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.description = reader.string();
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
