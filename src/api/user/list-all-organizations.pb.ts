/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";
import { MinimalUserInfo } from "./user.pb.js";
import { ProjectNode } from "./whoami.pb.js";

export interface ListAllOrganizationsRequest {}

export interface ListAllOrganizationsResponse {
  /**
   * organizations is a list of all organizations this user has access to. The
   * user can subsequently call DescribeOrganization to get more info about an
   * individual organization.
   */
  organizations: ListOrganizationsEntry[];
}

/** ListOrganizationsEntry provides a sample of information about an organization. */
export interface ListOrganizationsEntry {
  /** organization_id is a globally unique identifier. */
  organizationId: bigint;
  /** name is a required human readable name that will be displayed in the UI. */
  name: string;
  /** the list of users, mostly to help identify the organization. */
  members: MinimalUserInfo[];
  /** projects is a list of projects that belong to this organization. */
  projects: ProjectNode[];
}

function createBaseListAllOrganizationsRequest(): ListAllOrganizationsRequest {
  return {};
}

export const ListAllOrganizationsRequest = {
  encode(_: ListAllOrganizationsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListAllOrganizationsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListAllOrganizationsRequest();
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

function createBaseListAllOrganizationsResponse(): ListAllOrganizationsResponse {
  return { organizations: [] };
}

export const ListAllOrganizationsResponse = {
  encode(
    message: ListAllOrganizationsResponse,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    for (const v of message.organizations) {
      ListOrganizationsEntry.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListAllOrganizationsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListAllOrganizationsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.organizations.push(ListOrganizationsEntry.decode(reader, reader.uint32()));
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

function createBaseListOrganizationsEntry(): ListOrganizationsEntry {
  return { organizationId: BigInt("0"), name: "", members: [], projects: [] };
}

export const ListOrganizationsEntry = {
  encode(message: ListOrganizationsEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.organizationId !== BigInt("0")) {
      if (BigInt.asUintN(64, message.organizationId) !== message.organizationId) {
        throw new globalThis.Error(
          "value provided for field message.organizationId of type uint64 too large",
        );
      }
      writer.uint32(8).uint64(message.organizationId.toString());
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    for (const v of message.members) {
      MinimalUserInfo.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.projects) {
      ProjectNode.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListOrganizationsEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListOrganizationsEntry();
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
          if (tag !== 18) {
            break;
          }

          message.name = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.members.push(MinimalUserInfo.decode(reader, reader.uint32()));
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.projects.push(ProjectNode.decode(reader, reader.uint32()));
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
