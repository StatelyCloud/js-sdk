/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";

export interface DeleteProjectRequest {
  /** project_id is a globally unique identifier for a project. */
  projectId: bigint;
}

/**
 * operation_id represents the long-running operation to delete the project.
 * Users can query the state of the operation using the DescribeOperation API.
 * uint64 operation_id = 1;
 */
export interface DeleteProjectResponse {}

function createBaseDeleteProjectRequest(): DeleteProjectRequest {
  return { projectId: BigInt("0") };
}

export const DeleteProjectRequest = {
  encode(message: DeleteProjectRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.projectId !== BigInt("0")) {
      if (BigInt.asUintN(64, message.projectId) !== message.projectId) {
        throw new globalThis.Error(
          "value provided for field message.projectId of type uint64 too large",
        );
      }
      writer.uint32(8).uint64(message.projectId.toString());
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeleteProjectRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeleteProjectRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.projectId = longToBigint(reader.uint64() as Long);
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

function createBaseDeleteProjectResponse(): DeleteProjectResponse {
  return {};
}

export const DeleteProjectResponse = {
  encode(_: DeleteProjectResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeleteProjectResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeleteProjectResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
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
