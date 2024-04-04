/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";

/**
 * There is no input to enroll - the Auth0 user ID is read from the auth token
 * itself (and thus cannot be spoofed).
 */
export interface EnrollRequest {}

/**
 * There is no output here either. This is an idempotent operation and cannot fail unless
 * there is an internal error.
 * To retrieve the user's information you must make a Whoami() request
 */
export interface EnrollResponse {}

/**
 * Enrolling a machine user is slightly different to enrolling a normal user.
 * This is an admin operation that is ACL authorized so we can pass parameters in the request.
 * This is necessary because we enroll the user on their behalf so its not possible to read the
 * subject out of the auth token.
 * We also must pass the organization ID in which to enroll the user. This is why a machine user
 * cannot enroll themselves
 */
export interface EnrollMachineUserRequest {
  /**
   * The oAuth subject of the user we are enrolling. Auth0 will create tokens
   * where the subject is "<client_id>@clients" where client_id is the machine
   * user's client ID which can be read in the Auth0 console.
   */
  oAuthSubject: string;
  /** display name for the user for us to show in audit trail etc */
  displayName: string;
  /**
   * The organization ID in which we are enrolling the machine user. The machine user will get full
   * access to all the stores in this organization.
   */
  organizationId: bigint;
}

/**
 * like a regular enrollment - this is an idempotent operation that cannot fail.
 * We return an empty response
 */
export interface EnrollMachineUserResponse {}

function createBaseEnrollRequest(): EnrollRequest {
  return {};
}

export const EnrollRequest = {
  encode(_: EnrollRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EnrollRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEnrollRequest();
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

function createBaseEnrollResponse(): EnrollResponse {
  return {};
}

export const EnrollResponse = {
  encode(_: EnrollResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EnrollResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEnrollResponse();
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

function createBaseEnrollMachineUserRequest(): EnrollMachineUserRequest {
  return { oAuthSubject: "", displayName: "", organizationId: BigInt("0") };
}

export const EnrollMachineUserRequest = {
  encode(message: EnrollMachineUserRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.oAuthSubject !== "") {
      writer.uint32(10).string(message.oAuthSubject);
    }
    if (message.displayName !== "") {
      writer.uint32(18).string(message.displayName);
    }
    if (message.organizationId !== BigInt("0")) {
      if (BigInt.asUintN(64, message.organizationId) !== message.organizationId) {
        throw new globalThis.Error(
          "value provided for field message.organizationId of type uint64 too large",
        );
      }
      writer.uint32(24).uint64(message.organizationId.toString());
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EnrollMachineUserRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEnrollMachineUserRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.oAuthSubject = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.displayName = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
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

function createBaseEnrollMachineUserResponse(): EnrollMachineUserResponse {
  return {};
}

export const EnrollMachineUserResponse = {
  encode(_: EnrollMachineUserResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EnrollMachineUserResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEnrollMachineUserResponse();
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
