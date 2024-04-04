/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";

export interface RemoveUsersFromOrganizationRequest {
  /**
   * organization_id is the globally unique identifier of the organization that the
   * project will belong to.
   */
  organizationId: bigint;
  /**
   * user_ids is the list of each user ID to remove. Users that are not members
   * of the organization will be skipped.
   */
  userIds: bigint[];
}

export interface RemoveUsersFromOrganizationResponse {}

function createBaseRemoveUsersFromOrganizationRequest(): RemoveUsersFromOrganizationRequest {
  return { organizationId: BigInt("0"), userIds: [] };
}

export const RemoveUsersFromOrganizationRequest = {
  encode(
    message: RemoveUsersFromOrganizationRequest,
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
    writer.uint32(18).fork();
    for (const v of message.userIds) {
      if (BigInt.asUintN(64, v) !== v) {
        throw new globalThis.Error(
          "a value provided in array field userIds of type uint64 is too large",
        );
      }
      writer.uint64(v.toString());
    }
    writer.ldelim();
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): RemoveUsersFromOrganizationRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRemoveUsersFromOrganizationRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.organizationId = longToBigint(reader.uint64() as Long);
          continue;
        case 2:
          if (tag === 16) {
            message.userIds.push(longToBigint(reader.uint64() as Long));

            continue;
          }

          if (tag === 18) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.userIds.push(longToBigint(reader.uint64() as Long));
            }

            continue;
          }

          break;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseRemoveUsersFromOrganizationResponse(): RemoveUsersFromOrganizationResponse {
  return {};
}

export const RemoveUsersFromOrganizationResponse = {
  encode(
    _: RemoveUsersFromOrganizationResponse,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): RemoveUsersFromOrganizationResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRemoveUsersFromOrganizationResponse();
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
