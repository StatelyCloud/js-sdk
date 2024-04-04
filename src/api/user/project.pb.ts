/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";

/** Project describes a project, which is a container for cloud resources. */
export interface Project {
  /** project_id is a globally unique identifier for this project. */
  projectId: bigint;
  /** name is a required human readable name that will be displayed in the UI. */
  name: string;
  /** description is an optional human readable explanation for what the project is for. */
  description: string;
  /**
   * organization_id is the identifier for the organization this project
   * belongs to.
   */
  organizationId: bigint;
}

function createBaseProject(): Project {
  return { projectId: BigInt("0"), name: "", description: "", organizationId: BigInt("0") };
}

export const Project = {
  encode(message: Project, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.projectId !== BigInt("0")) {
      if (BigInt.asUintN(64, message.projectId) !== message.projectId) {
        throw new globalThis.Error(
          "value provided for field message.projectId of type uint64 too large",
        );
      }
      writer.uint32(8).uint64(message.projectId.toString());
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.description !== "") {
      writer.uint32(26).string(message.description);
    }
    if (message.organizationId !== BigInt("0")) {
      if (BigInt.asUintN(64, message.organizationId) !== message.organizationId) {
        throw new globalThis.Error(
          "value provided for field message.organizationId of type uint64 too large",
        );
      }
      writer.uint32(32).uint64(message.organizationId.toString());
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Project {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProject();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.projectId = longToBigint(reader.uint64() as Long);
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
        case 4:
          if (tag !== 32) {
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
