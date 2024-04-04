/* eslint-disable */
import _m0 from "protobufjs/minimal.js";

/**
 * OperationError is an error that can be returned from certain APIs to provide more
 * details than a gRPC status error could. This is used mostly in cases when
 * APIs are able to return partial results.
 */
export interface OperationError {
  /** This is the standard gRPC error code for the error. */
  grpcCode: number;
  /** English language text description of the error. */
  description: string;
}

function createBaseOperationError(): OperationError {
  return { grpcCode: 0, description: "" };
}

export const OperationError = {
  encode(message: OperationError, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.grpcCode !== 0) {
      writer.uint32(8).uint32(message.grpcCode);
    }
    if (message.description !== "") {
      writer.uint32(26).string(message.description);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): OperationError {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOperationError();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.grpcCode = reader.uint32();
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
