/* eslint-disable */
import _m0 from "protobufjs/minimal.js";

/**
 * ContinueListDirection is used to indicate whether we are expanding the result
 * set (paginating) forward (in the direction of the original List operation) or
 * backward (in the opposite direction).
 */
export const ContinueListDirection = {
  /** CONTINUE_LIST_FORWARD - this is the default */
  CONTINUE_LIST_FORWARD: 0,
  CONTINUE_LIST_BACKWARD: 1,
  UNRECOGNIZED: -1,
} as const;

export type ContinueListDirection =
  (typeof ContinueListDirection)[keyof typeof ContinueListDirection];

export namespace ContinueListDirection {
  export type CONTINUE_LIST_FORWARD = typeof ContinueListDirection.CONTINUE_LIST_FORWARD;
  export type CONTINUE_LIST_BACKWARD = typeof ContinueListDirection.CONTINUE_LIST_BACKWARD;
  export type UNRECOGNIZED = typeof ContinueListDirection.UNRECOGNIZED;
}

export interface ContinueListRequest {
  /**
   * token_data is an opaque list continuation token returned by a previous call to
   * BeginList, ContinueList, or SyncList.
   */
  tokenData: Uint8Array;
  /**
   * direction indicates whether we are expanding the result set (paginating)
   * forward (in the direction of the original List operation) or backward (in
   * the opposite direction). The default is to expand forward.
   */
  direction: ContinueListDirection;
}

function createBaseContinueListRequest(): ContinueListRequest {
  return { tokenData: new Uint8Array(0), direction: 0 };
}

export const ContinueListRequest = {
  encode(message: ContinueListRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.tokenData.length !== 0) {
      writer.uint32(10).bytes(message.tokenData);
    }
    if (message.direction !== 0) {
      writer.uint32(16).int32(message.direction);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ContinueListRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseContinueListRequest();
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

          message.direction = reader.int32() as any;
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
