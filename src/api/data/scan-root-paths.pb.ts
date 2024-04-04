/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";

export interface ScanRootPathsRequest {
  /**
   * store_id is a globally unique Store ID, which can be looked up from the
   * console or CLI.
   */
  storeId: bigint;
  /** Limit sets an upper bound on how many root paths to return. */
  limit: number;
  /**
   * pagination_token is an optional token to continue retrieving the next page of results.
   * This value must be read from a ScanRootPathsResponse and passed with a clone of the
   * previous request to fetch the next page of data
   */
  paginationToken: Uint8Array;
}

export interface ScanRootPathsResponse {
  /** results is a list that contains one entry for each root path that was found. */
  results: ScanRootPathResult[];
  /**
   * This field is optional and will be set if there are more query results to fetch.
   * To fetch the next page of results you must make the exact same ScanRootPathsRequest as before
   * but set ScanRootPathsRequest.pagination_token to the value returned here.
   */
  paginationToken: Uint8Array;
}

export interface ScanRootPathResult {
  /**
   * key_path is a single root key path. Users can Query by this root path to
   * get all of the items under it.
   */
  keyPath: string;
}

function createBaseScanRootPathsRequest(): ScanRootPathsRequest {
  return { storeId: BigInt("0"), limit: 0, paginationToken: new Uint8Array(0) };
}

export const ScanRootPathsRequest = {
  encode(message: ScanRootPathsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.storeId !== BigInt("0")) {
      if (BigInt.asUintN(64, message.storeId) !== message.storeId) {
        throw new globalThis.Error(
          "value provided for field message.storeId of type uint64 too large",
        );
      }
      writer.uint32(8).uint64(message.storeId.toString());
    }
    if (message.limit !== 0) {
      writer.uint32(16).uint32(message.limit);
    }
    if (message.paginationToken.length !== 0) {
      writer.uint32(26).bytes(message.paginationToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ScanRootPathsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseScanRootPathsRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.storeId = longToBigint(reader.uint64() as Long);
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.limit = reader.uint32();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.paginationToken = reader.bytes();
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

function createBaseScanRootPathsResponse(): ScanRootPathsResponse {
  return { results: [], paginationToken: new Uint8Array(0) };
}

export const ScanRootPathsResponse = {
  encode(message: ScanRootPathsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.results) {
      ScanRootPathResult.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.paginationToken.length !== 0) {
      writer.uint32(18).bytes(message.paginationToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ScanRootPathsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseScanRootPathsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.results.push(ScanRootPathResult.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.paginationToken = reader.bytes();
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

function createBaseScanRootPathResult(): ScanRootPathResult {
  return { keyPath: "" };
}

export const ScanRootPathResult = {
  encode(message: ScanRootPathResult, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.keyPath !== "") {
      writer.uint32(10).string(message.keyPath);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ScanRootPathResult {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseScanRootPathResult();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.keyPath = reader.string();
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
