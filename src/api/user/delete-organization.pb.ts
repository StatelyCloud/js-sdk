/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";

export interface DeleteOrganizationRequest {
  /**
   * organization_id is a globally unique identifier for an organization. Every
   * user must belong to at least one organization. Attempting to delete the sole
   * organization for a user will fail.
   */
  organizationId: bigint;
}

/**
 * operation_id represents the long-running operation to delete the organization.
 * Users can query the state of the operation using the DescribeOperation API.
 * uint64 operation_id = 1;
 */
export interface DeleteOrganizationResponse {}

function createBaseDeleteOrganizationRequest(): DeleteOrganizationRequest {
  return { organizationId: BigInt("0") };
}

export const DeleteOrganizationRequest = {
  encode(message: DeleteOrganizationRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.organizationId !== BigInt("0")) {
      if (BigInt.asUintN(64, message.organizationId) !== message.organizationId) {
        throw new globalThis.Error(
          "value provided for field message.organizationId of type uint64 too large",
        );
      }
      writer.uint32(8).uint64(message.organizationId.toString());
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeleteOrganizationRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeleteOrganizationRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.organizationId = longToBigint(reader.uint64() as Long);
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

function createBaseDeleteOrganizationResponse(): DeleteOrganizationResponse {
  return {};
}

export const DeleteOrganizationResponse = {
  encode(_: DeleteOrganizationResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeleteOrganizationResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeleteOrganizationResponse();
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
