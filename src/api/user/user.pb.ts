/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";

/**
 * MinimalUserInfo is a subset of the information that is available about a
 * user, appropriate for displaying in a list or as search results.
 */
export interface MinimalUserInfo {
  /** user_id is a globally unique identifier. */
  userId: bigint;
  /**
   * name is the user's display name. It may be missing, in which case the
   * user's email should be displayed.
   */
  displayName: string;
  /** email is the user's email when they registered. */
  email: string;
}

function createBaseMinimalUserInfo(): MinimalUserInfo {
  return { userId: BigInt("0"), displayName: "", email: "" };
}

export const MinimalUserInfo = {
  encode(message: MinimalUserInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.userId !== BigInt("0")) {
      if (BigInt.asUintN(64, message.userId) !== message.userId) {
        throw new globalThis.Error(
          "value provided for field message.userId of type uint64 too large",
        );
      }
      writer.uint32(8).uint64(message.userId.toString());
    }
    if (message.displayName !== "") {
      writer.uint32(18).string(message.displayName);
    }
    if (message.email !== "") {
      writer.uint32(26).string(message.email);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MinimalUserInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMinimalUserInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.userId = longToBigint(reader.uint64() as Long);
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.displayName = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.email = reader.string();
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
