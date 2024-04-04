/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";

export interface CreateOrganizationRequest {
  /**
   * name is a required globally unique human readable name that will be
   * displayed in the UI.
   */
  name: string;
  /**
   * do_not_add_current_user is a flag for admins that indicates that the
   * current user should not be added to the organization. The default (false)
   * is to include the current user.
   */
  doNotAddCurrentUser: boolean;
}

export interface CreateOrganizationResponse {
  /** organization_id is a globally unique identifier for a organization. */
  organizationId: bigint;
}

function createBaseCreateOrganizationRequest(): CreateOrganizationRequest {
  return { name: "", doNotAddCurrentUser: false };
}

export const CreateOrganizationRequest = {
  encode(message: CreateOrganizationRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    if (message.doNotAddCurrentUser !== false) {
      writer.uint32(16).bool(message.doNotAddCurrentUser);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CreateOrganizationRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCreateOrganizationRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.doNotAddCurrentUser = reader.bool();
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

function createBaseCreateOrganizationResponse(): CreateOrganizationResponse {
  return { organizationId: BigInt("0") };
}

export const CreateOrganizationResponse = {
  encode(
    message: CreateOrganizationResponse,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
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

  decode(input: _m0.Reader | Uint8Array, length?: number): CreateOrganizationResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCreateOrganizationResponse();
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

function longToBigint(long: Long) {
  return BigInt(long.toString());
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}
