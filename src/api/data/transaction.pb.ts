/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";
import { Empty } from "../google/protobuf/empty.pb.js";
import { AppendItem, AppendItemResult } from "./append.pb.js";
import { ContinueListDirection } from "./continue-list.pb.js";
import { DeleteItem, DeleteResult } from "./delete.pb.js";
import { GetItem } from "./get.pb.js";
import { SortableProperty } from "./item-property.pb.js";
import { Item } from "./item.pb.js";
import { ListFinished, ListPartialResult, SortDirection } from "./list.pb.js";
import { PutItem, PutResult } from "./put.pb.js";

/** This is a streaming request, so the client may send several of them */
export interface TransactionRequest {
  /**
   * message_id should be set to a unique number per request in this
   * transaction. It will be returned with responses to make it easier to match
   * up specific responses with their requests.
   */
  messageId: number;
  command?:
    | { $case: "begin"; begin: TransactionBegin }
    | { $case: "getItems"; getItems: TransactionGet }
    | { $case: "beginList"; beginList: TransactionBeginList }
    | { $case: "continueList"; continueList: TransactionContinueList }
    | { $case: "putItems"; putItems: TransactionPut }
    | { $case: "appendItems"; appendItems: TransactionAppend }
    | { $case: "deleteItems"; deleteItems: TransactionDelete }
    | { $case: "commit"; commit: Empty }
    | { $case: "abort"; abort: Empty }
    | undefined;
}

/** This is a streaming response, so the server may send several of them */
export interface TransactionResponse {
  /**
   * message_id is the same as the message_id of the request that triggered this
   * response. This makes it easier to distinguish between multiple responses to
   * different requests..
   */
  messageId: number;
  result?:
    | { $case: "getResults"; getResults: TransactionGetResponse }
    | { $case: "appendAck"; appendAck: TransactionAppendAck }
    | { $case: "listResults"; listResults: TransactionListResponse }
    | { $case: "finished"; finished: TransactionFinished }
    | undefined;
}

/**
 * TransactionBegin opens a transaction and sets various options that will be
 * used throughout the transaction.
 */
export interface TransactionBegin {
  /**
   * store_id is a globally unique Store ID, which can be looked up from the
   * console or CLI.
   */
  storeId: bigint;
}

/**
 * TransactionGet is a subset of the GetRequest message, for performing point
 * gets within the context of a transaction.
 */
export interface TransactionGet {
  /** gets is one or more requests to get an item its key path. */
  gets: GetItem[];
}

/**
 * TransactionBeginList is a subset of the ListRequest message, for listing within
 * the context of a transaction.
 */
export interface TransactionBeginList {
  /**
   * key_path_prefix is the a prefix that limits what items we will return. This
   * must contain at least a root segment. See Item#key_path for more details.
   */
  keyPathPrefix: string;
  /**
   * limit is the maximum number of items to return. If this is not specified or
   * set to 0, it will be unlimited. Fewer items than the limit may be
   * returned even if there are more items to get - make sure to check
   * token.can_continue.
   */
  limit: number;
  /**
   * sort_property is the property of the item to sort the results by. If this
   * is not set, we will sort by key path.
   */
  sortProperty: SortableProperty;
  /**
   * sort_direction is the direction to sort the results in. If this is not set,
   * we will sort in ascending order.
   */
  sortDirection: SortDirection;
}

export interface TransactionContinueList {
  /**
   * token is an opaque list continuation token returned by a previous call to
   * TransactionBeginList or TransactionContinueList.
   */
  tokenData: Uint8Array;
  /**
   * direction indicates whether we are expanding the result set (paginating)
   * forward (in the direction of the original List operation) or backward (in
   * the opposite direction). The default is to expand forward.
   */
  direction: ContinueListDirection;
}

/**
 * TransactionPut is a subset of the PutRequest message, for performing puts
 * within the context of a transaction. These will not be acknowledged until the
 * transaction is finished.
 */
export interface TransactionPut {
  /** puts is one or more items to be put into the Store. */
  puts: PutItem[];
}

/**
 * TransactionAppend is a subset of the AppendRequest message, for performing
 * appends within the context of a transaction. These will be acknowledged with
 * TransactionAppendAck messages that contain the item's new ID.
 */
export interface TransactionAppend {
  /**
   * parent_path is the full path, in the form
   * /item_type-item_id/[{sub_item_type}-{sub_item_id}...}], under which each
   * item will be appended. The item will be appended as a direct child of this
   * path. Note that the path *may* be "/" to create root-level items, though
   * some ID assignment options may not be available in that case.
   */
  parentPath: string;
  /** appends is one or more items to be appended under the parent path. */
  appends: AppendItem[];
}

/**
 * TransactionDelete is a subset of the DeleteRequest message, for performing
 * deletes within the context of a transaction. These will not be acknowledged
 * until the transaction is finished.
 */
export interface TransactionDelete {
  /** deletes is one or more items to be deleted from the Group. */
  deletes: DeleteItem[];
}

/**
 * TransactionGetResponse is a subset of the GetResponse message, for
 * returning results during the execution of a transaction.
 */
export interface TransactionGetResponse {
  /** items is a list that contains one entry for each Item that was found. */
  items: Item[];
}

export interface TransactionAppendAck {
  /**
   * key_paths is the list of complete path(s) that the newly appended item(s) will use on a
   * successful commit of the transaction. Keys are returned in the same order of the appended
   * items provided in TransactionAppend#appends.
   * These paths are provisional until the transaction is committed - if the
   * transaction is aborted, the item(s) will not be added and other item(s) could
   * be created with the same IDs.
   */
  keyPaths: string[];
}

/**
 * TransactionListResponse is a subset of the ListResponse message, for
 * returning results during the execution of a transaction.
 */
export interface TransactionListResponse {
  response?:
    | { $case: "result"; result: ListPartialResult }
    | { $case: "finished"; finished: ListFinished }
    | undefined;
}

export interface TransactionFinished {
  /** Did the commit finish (the alternative is that it was aborted/rolled back) */
  committed: boolean;
  /**
   * put_results contains the full result of each Put operation. This only comes
   * back with the TransactionFinished message because full metadata isn't
   * available until then.
   */
  putResults: PutResult[];
  /**
   * delete_results contains the full result of each Delete operation. This only
   * comes back with the TransactionFinished message because full metadata isn't
   * available until then.
   */
  deleteResults: DeleteResult[];
  /**
   * append_results contains the full result of each Append operation. This only
   * comes back with the TransactionFinished message because full metadata isn't
   * available until then.
   */
  appendResults: AppendItemResult[];
}

function createBaseTransactionRequest(): TransactionRequest {
  return { messageId: 0, command: undefined };
}

export const TransactionRequest = {
  encode(message: TransactionRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.messageId !== 0) {
      writer.uint32(8).uint32(message.messageId);
    }
    switch (message.command?.$case) {
      case "begin":
        TransactionBegin.encode(message.command.begin, writer.uint32(18).fork()).ldelim();
        break;
      case "getItems":
        TransactionGet.encode(message.command.getItems, writer.uint32(26).fork()).ldelim();
        break;
      case "beginList":
        TransactionBeginList.encode(message.command.beginList, writer.uint32(34).fork()).ldelim();
        break;
      case "continueList":
        TransactionContinueList.encode(
          message.command.continueList,
          writer.uint32(42).fork(),
        ).ldelim();
        break;
      case "putItems":
        TransactionPut.encode(message.command.putItems, writer.uint32(50).fork()).ldelim();
        break;
      case "appendItems":
        TransactionAppend.encode(message.command.appendItems, writer.uint32(58).fork()).ldelim();
        break;
      case "deleteItems":
        TransactionDelete.encode(message.command.deleteItems, writer.uint32(66).fork()).ldelim();
        break;
      case "commit":
        Empty.encode(message.command.commit, writer.uint32(74).fork()).ldelim();
        break;
      case "abort":
        Empty.encode(message.command.abort, writer.uint32(82).fork()).ldelim();
        break;
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.messageId = reader.uint32();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.command = {
            $case: "begin",
            begin: TransactionBegin.decode(reader, reader.uint32()),
          };
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.command = {
            $case: "getItems",
            getItems: TransactionGet.decode(reader, reader.uint32()),
          };
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.command = {
            $case: "beginList",
            beginList: TransactionBeginList.decode(reader, reader.uint32()),
          };
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.command = {
            $case: "continueList",
            continueList: TransactionContinueList.decode(reader, reader.uint32()),
          };
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.command = {
            $case: "putItems",
            putItems: TransactionPut.decode(reader, reader.uint32()),
          };
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.command = {
            $case: "appendItems",
            appendItems: TransactionAppend.decode(reader, reader.uint32()),
          };
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.command = {
            $case: "deleteItems",
            deleteItems: TransactionDelete.decode(reader, reader.uint32()),
          };
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.command = { $case: "commit", commit: Empty.decode(reader, reader.uint32()) };
          continue;
        case 10:
          if (tag !== 82) {
            break;
          }

          message.command = { $case: "abort", abort: Empty.decode(reader, reader.uint32()) };
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

function createBaseTransactionResponse(): TransactionResponse {
  return { messageId: 0, result: undefined };
}

export const TransactionResponse = {
  encode(message: TransactionResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.messageId !== 0) {
      writer.uint32(8).uint32(message.messageId);
    }
    switch (message.result?.$case) {
      case "getResults":
        TransactionGetResponse.encode(message.result.getResults, writer.uint32(18).fork()).ldelim();
        break;
      case "appendAck":
        TransactionAppendAck.encode(message.result.appendAck, writer.uint32(26).fork()).ldelim();
        break;
      case "listResults":
        TransactionListResponse.encode(
          message.result.listResults,
          writer.uint32(34).fork(),
        ).ldelim();
        break;
      case "finished":
        TransactionFinished.encode(message.result.finished, writer.uint32(42).fork()).ldelim();
        break;
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.messageId = reader.uint32();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.result = {
            $case: "getResults",
            getResults: TransactionGetResponse.decode(reader, reader.uint32()),
          };
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.result = {
            $case: "appendAck",
            appendAck: TransactionAppendAck.decode(reader, reader.uint32()),
          };
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.result = {
            $case: "listResults",
            listResults: TransactionListResponse.decode(reader, reader.uint32()),
          };
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.result = {
            $case: "finished",
            finished: TransactionFinished.decode(reader, reader.uint32()),
          };
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

function createBaseTransactionBegin(): TransactionBegin {
  return { storeId: BigInt("0") };
}

export const TransactionBegin = {
  encode(message: TransactionBegin, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.storeId !== BigInt("0")) {
      if (BigInt.asUintN(64, message.storeId) !== message.storeId) {
        throw new globalThis.Error(
          "value provided for field message.storeId of type uint64 too large",
        );
      }
      writer.uint32(8).uint64(message.storeId.toString());
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionBegin {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionBegin();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.storeId = longToBigint(reader.uint64() as Long);
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

function createBaseTransactionGet(): TransactionGet {
  return { gets: [] };
}

export const TransactionGet = {
  encode(message: TransactionGet, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.gets) {
      GetItem.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionGet {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionGet();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.gets.push(GetItem.decode(reader, reader.uint32()));
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

function createBaseTransactionBeginList(): TransactionBeginList {
  return { keyPathPrefix: "", limit: 0, sortProperty: 0, sortDirection: 0 };
}

export const TransactionBeginList = {
  encode(message: TransactionBeginList, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.keyPathPrefix !== "") {
      writer.uint32(10).string(message.keyPathPrefix);
    }
    if (message.limit !== 0) {
      writer.uint32(16).uint32(message.limit);
    }
    if (message.sortProperty !== 0) {
      writer.uint32(24).int32(message.sortProperty);
    }
    if (message.sortDirection !== 0) {
      writer.uint32(32).int32(message.sortDirection);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionBeginList {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionBeginList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.keyPathPrefix = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.limit = reader.uint32();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.sortProperty = reader.int32() as any;
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.sortDirection = reader.int32() as any;
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

function createBaseTransactionContinueList(): TransactionContinueList {
  return { tokenData: new Uint8Array(0), direction: 0 };
}

export const TransactionContinueList = {
  encode(message: TransactionContinueList, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.tokenData.length !== 0) {
      writer.uint32(10).bytes(message.tokenData);
    }
    if (message.direction !== 0) {
      writer.uint32(32).int32(message.direction);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionContinueList {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionContinueList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.tokenData = reader.bytes();
          continue;
        case 4:
          if (tag !== 32) {
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

function createBaseTransactionPut(): TransactionPut {
  return { puts: [] };
}

export const TransactionPut = {
  encode(message: TransactionPut, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.puts) {
      PutItem.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionPut {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionPut();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.puts.push(PutItem.decode(reader, reader.uint32()));
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

function createBaseTransactionAppend(): TransactionAppend {
  return { parentPath: "", appends: [] };
}

export const TransactionAppend = {
  encode(message: TransactionAppend, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.parentPath !== "") {
      writer.uint32(10).string(message.parentPath);
    }
    for (const v of message.appends) {
      AppendItem.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionAppend {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionAppend();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.parentPath = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.appends.push(AppendItem.decode(reader, reader.uint32()));
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

function createBaseTransactionDelete(): TransactionDelete {
  return { deletes: [] };
}

export const TransactionDelete = {
  encode(message: TransactionDelete, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.deletes) {
      DeleteItem.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionDelete {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionDelete();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.deletes.push(DeleteItem.decode(reader, reader.uint32()));
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

function createBaseTransactionGetResponse(): TransactionGetResponse {
  return { items: [] };
}

export const TransactionGetResponse = {
  encode(message: TransactionGetResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.items) {
      Item.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionGetResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionGetResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.items.push(Item.decode(reader, reader.uint32()));
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

function createBaseTransactionAppendAck(): TransactionAppendAck {
  return { keyPaths: [] };
}

export const TransactionAppendAck = {
  encode(message: TransactionAppendAck, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.keyPaths) {
      writer.uint32(10).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionAppendAck {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionAppendAck();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.keyPaths.push(reader.string());
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

function createBaseTransactionListResponse(): TransactionListResponse {
  return { response: undefined };
}

export const TransactionListResponse = {
  encode(message: TransactionListResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    switch (message.response?.$case) {
      case "result":
        ListPartialResult.encode(message.response.result, writer.uint32(10).fork()).ldelim();
        break;
      case "finished":
        ListFinished.encode(message.response.finished, writer.uint32(18).fork()).ldelim();
        break;
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionListResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionListResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.response = {
            $case: "result",
            result: ListPartialResult.decode(reader, reader.uint32()),
          };
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.response = {
            $case: "finished",
            finished: ListFinished.decode(reader, reader.uint32()),
          };
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

function createBaseTransactionFinished(): TransactionFinished {
  return { committed: false, putResults: [], deleteResults: [], appendResults: [] };
}

export const TransactionFinished = {
  encode(message: TransactionFinished, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.committed !== false) {
      writer.uint32(8).bool(message.committed);
    }
    for (const v of message.putResults) {
      PutResult.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.deleteResults) {
      DeleteResult.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.appendResults) {
      AppendItemResult.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionFinished {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionFinished();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.committed = reader.bool();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.putResults.push(PutResult.decode(reader, reader.uint32()));
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.deleteResults.push(DeleteResult.decode(reader, reader.uint32()));
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.appendResults.push(AppendItemResult.decode(reader, reader.uint32()));
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
