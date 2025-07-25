// @generated by protoc-gen-es v2.6.1 with parameter "target=js+dts,import_extension=.js"
// @generated from file db/transaction.proto (package stately.db, syntax proto3)
/* eslint-disable */

import type { Message } from "@bufbuild/protobuf";
import type { GenFile, GenMessage } from "@bufbuild/protobuf/codegenv2";
import type { Empty } from "@bufbuild/protobuf/wkt";
import type { ContinueListDirection } from "./continue_list_pb.js";
import type { DeleteItem, DeleteResult } from "./delete_pb.js";
import type { GetItem } from "./get_pb.js";
import type { Item } from "./item_pb.js";
import type { SortableProperty } from "./item_property_pb.js";
import type { FilterCondition } from "./list_filters_pb.js";
import type { KeyCondition, ListFinished, ListPartialResult, SortDirection } from "./list_pb.js";
import type { PutItem } from "./put_pb.js";

/**
 * Describes the file db/transaction.proto.
 */
export declare const file_db_transaction: GenFile;

/**
 * This is a streaming request, so the client may send several of them
 *
 * @generated from message stately.db.TransactionRequest
 */
export declare type TransactionRequest = Message<"stately.db.TransactionRequest"> & {
  /**
   * message_id should be set to a unique number per request in this
   * transaction. It will be returned with responses to make it easier to match
   * up specific responses with their requests.
   *
   * @generated from field: uint32 message_id = 1;
   */
  messageId: number;

  /**
   * @generated from oneof stately.db.TransactionRequest.command
   */
  command:
    | {
        /**
         * begin sets up options for the transaction, such as what store we're
         * operating on. It is not acknowledged unless there is an error, which
         * kills the whole transaction.
         *
         * @generated from field: stately.db.TransactionBegin begin = 2;
         */
        value: TransactionBegin;
        case: "begin";
      }
    | {
        /**
         * The client is requesting to get one or more items. The results will be
         * returned in TransactionResponse#get_results.
         *
         * @generated from field: stately.db.TransactionGet get_items = 3;
         */
        value: TransactionGet;
        case: "getItems";
      }
    | {
        /**
         * The client is requesting a list of a path prefix. The results will be
         * returned in TransactionResponse#list.
         *
         * @generated from field: stately.db.TransactionBeginList begin_list = 4;
         */
        value: TransactionBeginList;
        case: "beginList";
      }
    | {
        /**
         * ContinueList takes the token from a BeginList call and returns the next
         * "page" of results based on the original query parameters and pagination
         * options. It has few options because it is a continuation of a previous
         * list operation. It will return a new  token which can be used for
         * another ContinueList call, and so on. Each time you call either
         * ContinueList, you should pass the latest version of the token, and then
         * use the new token from the result in subsequent calls. Calls to
         * ContinueList are tied to the authorization of the original BeginList
         * call, so if the original BeginList call was allowed, ContinueList with
         * its token should also be allowed.
         *
         * @generated from field: stately.db.TransactionContinueList continue_list = 5;
         */
        value: TransactionContinueList;
        case: "continueList";
      }
    | {
        /**
         * The client is requesting to create new items. This is acknowledged in
         * TransactionResponse#put_ack which contains the item's tentative full path
         * (pending the transaction's commit). The final result of all puts will be
         * returned in TransactionFinished#put_results.
         *
         * @generated from field: stately.db.TransactionPut put_items = 6;
         */
        value: TransactionPut;
        case: "putItems";
      }
    | {
        /**
         * The client is requesting to delete items. It is not acknowledged unless
         * there is an error, which kills the whole transaction. The final result of
         * all deletes will be returned in TransactionFinished#delete_results.
         *
         * @generated from field: stately.db.TransactionDelete delete_items = 7;
         */
        value: TransactionDelete;
        case: "deleteItems";
      }
    | {
        /**
         * The client is requesting to commit the transaction. The final results of
         * the transaction will be returned in TransactionResponse#finished.
         *
         * @generated from field: google.protobuf.Empty commit = 8;
         */
        value: Empty;
        case: "commit";
      }
    | {
        /**
         * The client is requesting to abort/rollback the transaction.
         *
         * @generated from field: google.protobuf.Empty abort = 9;
         */
        value: Empty;
        case: "abort";
      }
    | { case: undefined; value?: undefined };
};

/**
 * Describes the message stately.db.TransactionRequest.
 * Use `create(TransactionRequestSchema)` to create a new message.
 */
export declare const TransactionRequestSchema: GenMessage<TransactionRequest>;

/**
 * This is a streaming response, so the server may send several of them
 *
 * @generated from message stately.db.TransactionResponse
 */
export declare type TransactionResponse = Message<"stately.db.TransactionResponse"> & {
  /**
   * message_id is the same as the message_id of the request that triggered this
   * response. This makes it easier to distinguish between multiple responses to
   * different requests..
   *
   * @generated from field: uint32 message_id = 1;
   */
  messageId: number;

  /**
   * @generated from oneof stately.db.TransactionResponse.result
   */
  result:
    | {
        /**
         * The server is responding to a GetItem request
         *
         * @generated from field: stately.db.TransactionGetResponse get_results = 2;
         */
        value: TransactionGetResponse;
        case: "getResults";
      }
    | {
        /**
         * put_ack contains provisionally updated items from a put, including
         * tentative IDs (pending transaction commit).
         *
         * @generated from field: stately.db.TransactionPutAck put_ack = 3;
         */
        value: TransactionPutAck;
        case: "putAck";
      }
    | {
        /**
         * list_results is the result of a list request.
         *
         * @generated from field: stately.db.TransactionListResponse list_results = 4;
         */
        value: TransactionListResponse;
        case: "listResults";
      }
    | {
        /**
         * Final information about the transaction, regardless of whether it was committed or aborted.
         *
         * @generated from field: stately.db.TransactionFinished finished = 5;
         */
        value: TransactionFinished;
        case: "finished";
      }
    | { case: undefined; value?: undefined };
};

/**
 * Describes the message stately.db.TransactionResponse.
 * Use `create(TransactionResponseSchema)` to create a new message.
 */
export declare const TransactionResponseSchema: GenMessage<TransactionResponse>;

/**
 * TransactionBegin opens a transaction and sets various options that will be
 * used throughout the transaction.
 *
 * @generated from message stately.db.TransactionBegin
 */
export declare type TransactionBegin = Message<"stately.db.TransactionBegin"> & {
  /**
   * store_id is a globally unique Store ID, which can be looked up from the
   * console or CLI.
   *
   * @generated from field: uint64 store_id = 1;
   */
  storeId: bigint;

  /**
   * schema_version_id refers to the item version to base this txn from. All items
   * created or modified in this transaction will be based on this schema
   * version.
   *
   * If the store's schema does not have this version, the operation
   * will error with SchemaVersionNotFound error. You should not have to
   * set this manually as your generated SDK should know its schema version
   * and wire this in for you.
   *
   * @generated from field: uint32 schema_version_id = 2;
   */
  schemaVersionId: number;

  /**
   * schema_id refers to the schema to use for this operation.
   * If the store_id does not have a schema with this ID, the operation will
   * error with SchemaNotFound error. You should not have to set this manually
   * as your generated SDK should know its schema and wire this in for you.
   *
   * ; (after clients have been regen'd and updated)
   *
   * @generated from field: uint64 schema_id = 3;
   */
  schemaId: bigint;
};

/**
 * Describes the message stately.db.TransactionBegin.
 * Use `create(TransactionBeginSchema)` to create a new message.
 */
export declare const TransactionBeginSchema: GenMessage<TransactionBegin>;

/**
 * TransactionGet is a subset of the GetRequest message, for performing point
 * gets within the context of a transaction.
 *
 * @generated from message stately.db.TransactionGet
 */
export declare type TransactionGet = Message<"stately.db.TransactionGet"> & {
  /**
   * key paths to of each item to get.
   *
   * @generated from field: repeated stately.db.GetItem gets = 1;
   */
  gets: GetItem[];
};

/**
 * Describes the message stately.db.TransactionGet.
 * Use `create(TransactionGetSchema)` to create a new message.
 */
export declare const TransactionGetSchema: GenMessage<TransactionGet>;

/**
 * TransactionBeginList is a subset of the ListRequest message, for listing within
 * the context of a transaction.
 *
 * @generated from message stately.db.TransactionBeginList
 */
export declare type TransactionBeginList = Message<"stately.db.TransactionBeginList"> & {
  /**
   * key_path_prefix is the a prefix that limits what items we will return. This
   * must contain at least a root segment. See Item#key_path for more details.
   *
   * @generated from field: string key_path_prefix = 1;
   */
  keyPathPrefix: string;

  /**
   * limit is the maximum number of items to return. If this is not specified or
   * set to 0, it will be unlimited. Fewer items than the limit may be
   * returned even if there are more items to get - make sure to check
   * token.can_continue.
   *
   * @generated from field: uint32 limit = 2;
   */
  limit: number;

  /**
   * sort_property is the property of the item to sort the results by. If this
   * is not set, we will sort by key path.
   *
   * @generated from field: stately.db.SortableProperty sort_property = 3;
   */
  sortProperty: SortableProperty;

  /**
   * sort_direction is the direction to sort the results in. If this is not set,
   * we will sort in ascending order.
   *
   * @generated from field: stately.db.SortDirection sort_direction = 4;
   */
  sortDirection: SortDirection;

  /**
   * filter_conditions are a set of conditions to filter the list result by.
   * If no conditions are provided, all items in the store will be returned.
   * Filter conditions are combined with OR.
   *
   * @generated from field: repeated stately.db.FilterCondition filter_conditions = 9;
   */
  filterConditions: FilterCondition[];

  /**
   * key_conditions are a set of conditions to apply to the list operation.
   * Wherever possible, Stately will apply these key conditions at the DB layer
   * to optimize the list operation cost.
   *
   * A maximum of two key conditions are allowed, one with a GREATER_THAN (or equal to)
   * operator and one with a LESS_THAN (or equal to) operator. Together these amount to
   * a "between" condition on the key path.
   *
   * If these conditions are provided they must share the same prefix as the
   * key_path_prefix. For example this is valid:
   *
   *   key_path_prefix: "/group-:groupID/namespace"
   *   key_conditions:
   *     - key_path: "/group-:groupID/namespace-44"
   *       operator: GREATER_THAN_OR_EQUAL
   *     - key_path: "/group-:groupID/namespace-100"
   *       operator: LESS_THAN_OR_EQUAL
   *
   * A key_path_prefix of "/group-:groupID" would also be valid above, as the prefix is shared
   * with the key conditions.
   *
   * The following is NOT valid because the key_path_prefix does not
   * share the same prefix as the key conditions:
   *
   *   key_path_prefix: "/group-:groupID/namespace"
   *   key_conditions:
   *     - key_path: "/group-:groupID/beatles-1984"
   *       operator: GREATER_THAN_OR_EQUAL
   *
   * @generated from field: repeated stately.db.KeyCondition key_conditions = 10;
   */
  keyConditions: KeyCondition[];
};

/**
 * Describes the message stately.db.TransactionBeginList.
 * Use `create(TransactionBeginListSchema)` to create a new message.
 */
export declare const TransactionBeginListSchema: GenMessage<TransactionBeginList>;

/**
 * @generated from message stately.db.TransactionContinueList
 */
export declare type TransactionContinueList = Message<"stately.db.TransactionContinueList"> & {
  /**
   * token is an opaque list continuation token returned by a previous call to
   * TransactionBeginList or TransactionContinueList.
   *
   * @generated from field: bytes token_data = 1;
   */
  tokenData: Uint8Array;

  /**
   * direction indicates whether we are expanding the result set (paginating)
   * forward (in the direction of the original List operation) or backward (in
   * the opposite direction). The default is to expand forward.
   *
   * @generated from field: stately.db.ContinueListDirection direction = 4;
   */
  direction: ContinueListDirection;
};

/**
 * Describes the message stately.db.TransactionContinueList.
 * Use `create(TransactionContinueListSchema)` to create a new message.
 */
export declare const TransactionContinueListSchema: GenMessage<TransactionContinueList>;

/**
 * TransactionPut is a subset of the PutRequest message, for performing puts
 * within the context of a transaction. These will not be acknowledged until the
 * transaction is finished.
 *
 * @generated from message stately.db.TransactionPut
 */
export declare type TransactionPut = Message<"stately.db.TransactionPut"> & {
  /**
   * items to put into the store.
   *
   * @generated from field: repeated stately.db.PutItem puts = 1;
   */
  puts: PutItem[];
};

/**
 * Describes the message stately.db.TransactionPut.
 * Use `create(TransactionPutSchema)` to create a new message.
 */
export declare const TransactionPutSchema: GenMessage<TransactionPut>;

/**
 * TransactionDelete is a subset of the DeleteRequest message, for performing
 * deletes within the context of a transaction. These will not be acknowledged
 * until the transaction is finished.
 *
 * @generated from message stately.db.TransactionDelete
 */
export declare type TransactionDelete = Message<"stately.db.TransactionDelete"> & {
  /**
   * key paths of items to delete.
   *
   * @generated from field: repeated stately.db.DeleteItem deletes = 1;
   */
  deletes: DeleteItem[];
};

/**
 * Describes the message stately.db.TransactionDelete.
 * Use `create(TransactionDeleteSchema)` to create a new message.
 */
export declare const TransactionDeleteSchema: GenMessage<TransactionDelete>;

/**
 * TransactionGetResponse is a subset of the GetResponse message, for
 * returning results during the execution of a transaction.
 *
 * @generated from message stately.db.TransactionGetResponse
 */
export declare type TransactionGetResponse = Message<"stately.db.TransactionGetResponse"> & {
  /**
   * items is a list that contains one entry for each Item that was found.
   *
   * @generated from field: repeated stately.db.Item items = 1;
   */
  items: Item[];
};

/**
 * Describes the message stately.db.TransactionGetResponse.
 * Use `create(TransactionGetResponseSchema)` to create a new message.
 */
export declare const TransactionGetResponseSchema: GenMessage<TransactionGetResponse>;

/**
 * GeneratedID represents a unique ID that was generated by the server for a new item.
 *
 * @generated from message stately.db.GeneratedID
 */
export declare type GeneratedID = Message<"stately.db.GeneratedID"> & {
  /**
   * Right now we only ever generate uint or bytes values from our id generators
   * (initialValue). If neither is set, this represents a put that didn't
   * generate any ID (e.g. it was fully specified in the input).
   *
   * @generated from oneof stately.db.GeneratedID.value
   */
  value:
    | {
        /**
         * @generated from field: uint64 uint = 1;
         */
        value: bigint;
        case: "uint";
      }
    | {
        /**
         * @generated from field: bytes bytes = 2;
         */
        value: Uint8Array;
        case: "bytes";
      }
    | { case: undefined; value?: undefined };
};

/**
 * Describes the message stately.db.GeneratedID.
 * Use `create(GeneratedIDSchema)` to create a new message.
 */
export declare const GeneratedIDSchema: GenMessage<GeneratedID>;

/**
 * @generated from message stately.db.TransactionPutAck
 */
export declare type TransactionPutAck = Message<"stately.db.TransactionPutAck"> & {
  /**
   * generated_ids is a list of generated identifiers for the items in a
   * TransactionPut. IDs are returned in the same order of the PutItems provided
   * in TransactionPut#puts. For each item where an ID was chosen via its
   * "initialValue" property, the chosen value is represented in the returned
   * GeneratedID. There is only at most one generated ID per Put, because we
   * only allow a single ID property to be generated per item. If the Put didn't
   * need any generated IDs, the GeneratedID in its position will be empty.
   *
   * Clients can use these IDs in subsequent Put operations (e.g. to insert
   * child or related items). If the transaction is aborted, the item(s) will
   * not be added and other item(s) could be created with the same IDs.
   *
   * @generated from field: repeated stately.db.GeneratedID generated_ids = 1;
   */
  generatedIds: GeneratedID[];
};

/**
 * Describes the message stately.db.TransactionPutAck.
 * Use `create(TransactionPutAckSchema)` to create a new message.
 */
export declare const TransactionPutAckSchema: GenMessage<TransactionPutAck>;

/**
 * TransactionListResponse is a subset of the ListResponse message, for
 * returning results during the execution of a transaction.
 *
 * @generated from message stately.db.TransactionListResponse
 */
export declare type TransactionListResponse = Message<"stately.db.TransactionListResponse"> & {
  /**
   * @generated from oneof stately.db.TransactionListResponse.response
   */
  response:
    | {
        /**
         * Result is a segment of the result set - multiple of these may be returned
         * in a stream before the final "finished" message.
         *
         * @generated from field: stately.db.ListPartialResult result = 1;
         */
        value: ListPartialResult;
        case: "result";
      }
    | {
        /**
         * Finished is sent when there are no more results in this operation, and
         * there will only be one.
         *
         * @generated from field: stately.db.ListFinished finished = 2;
         */
        value: ListFinished;
        case: "finished";
      }
    | { case: undefined; value?: undefined };
};

/**
 * Describes the message stately.db.TransactionListResponse.
 * Use `create(TransactionListResponseSchema)` to create a new message.
 */
export declare const TransactionListResponseSchema: GenMessage<TransactionListResponse>;

/**
 * @generated from message stately.db.TransactionFinished
 */
export declare type TransactionFinished = Message<"stately.db.TransactionFinished"> & {
  /**
   * Did the commit finish (the alternative is that it was aborted/rolled back)
   *
   * @generated from field: bool committed = 1;
   */
  committed: boolean;

  /**
   * put_results contains the full result of each Put operation. This only comes
   * back with the TransactionFinished message because full metadata isn't
   * available until then.
   *
   * @generated from field: repeated stately.db.Item put_results = 2;
   */
  putResults: Item[];

  /**
   * delete_results contains the full result of each Delete operation. This only
   * comes back with the TransactionFinished message because full metadata isn't
   * available until then.
   *
   * @generated from field: repeated stately.db.DeleteResult delete_results = 3;
   */
  deleteResults: DeleteResult[];
};

/**
 * Describes the message stately.db.TransactionFinished.
 * Use `create(TransactionFinishedSchema)` to create a new message.
 */
export declare const TransactionFinishedSchema: GenMessage<TransactionFinished>;
