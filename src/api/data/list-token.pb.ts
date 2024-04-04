/* eslint-disable */
import _m0 from "protobufjs/minimal.js";

/**
 * ListToken is an opaque token that can be used to continue (paginate) or sync
 * results from a previous List operation.
 */
export interface ListToken {
  /**
   * token_data will always be returned, and can be used to expand the result
   * set via ContinueList (if can_continue is true), or to get changed items
   * within the result set via SyncList (if can_sync is true). The token_data
   * itself is opaque and cannot be parsed or modified by clients.
   */
  tokenData: Uint8Array;
  /**
   * can_continue indicates that there are more results available by expanding
   * the pagination window by calling ContinueList with this token.
   */
  canContinue: boolean;
  /**
   * can_sync indicates that you could call SyncList with this token later to
   * get updated items. This is determined by the type of store you're listing
   * from.
   */
  canSync: boolean;
}

function createBaseListToken(): ListToken {
  return { tokenData: new Uint8Array(0), canContinue: false, canSync: false };
}

export const ListToken = {
  encode(message: ListToken, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.tokenData.length !== 0) {
      writer.uint32(10).bytes(message.tokenData);
    }
    if (message.canContinue !== false) {
      writer.uint32(16).bool(message.canContinue);
    }
    if (message.canSync !== false) {
      writer.uint32(24).bool(message.canSync);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListToken {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListToken();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.tokenData = reader.bytes();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.canContinue = reader.bool();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.canSync = reader.bool();
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
