// @generated by protoc-gen-es v2.6.1 with parameter "target=js+dts,import_extension=.js"
// @generated from file db/list.proto (package stately.db, syntax proto3)
/* eslint-disable */

import type { Message } from "@bufbuild/protobuf";
import type { GenEnum, GenFile, GenMessage } from "@bufbuild/protobuf/codegenv2";
import type { Item } from "./item_pb.js";
import type { SortableProperty } from "./item_property_pb.js";
import type { FilterCondition } from "./list_filters_pb.js";
import type { ListToken } from "./list_token_pb.js";

/**
 * Describes the file db/list.proto.
 */
export declare const file_db_list: GenFile;

/**
 * @generated from message stately.db.BeginListRequest
 */
export declare type BeginListRequest = Message<"stately.db.BeginListRequest"> & {
  /**
   * store_id is a globally unique Store ID, which can be looked up from the
   * console or CLI.
   *
   * @generated from field: uint64 store_id = 1;
   */
  storeId: bigint;

  /**
   * key_path_prefix is the a prefix that limits what items we will return. This
   * must contain at least a root segment. See Item#key_path for more details.
   *
   * @generated from field: string key_path_prefix = 2;
   */
  keyPathPrefix: string;

  /**
   * limit is the maximum number of items to return. If this is not specified or
   * set to 0, it will default to unlimited. Fewer items than the limit may be
   * returned even if there are more items to get - make sure to check
   * token.can_continue.
   *
   * @generated from field: uint32 limit = 3;
   */
  limit: number;

  /**
   * allow_stale indicates that you're okay with getting slightly stale items -
   * that is, if you had just changed an item and then call a List operation,
   * you might get the old version of the item. This can result in improved
   * performance, availability, and cost.
   *
   * @generated from field: bool allow_stale = 4;
   */
  allowStale: boolean;

  /**
   * sort_property is the property of the item to sort the results by. If this
   * is not set, we will sort by key path.
   *
   * @generated from field: stately.db.SortableProperty sort_property = 5;
   */
  sortProperty: SortableProperty;

  /**
   * sort_direction is the direction to sort the results in. If this is not set,
   * we will sort in ascending order.
   *
   * @generated from field: stately.db.SortDirection sort_direction = 6;
   */
  sortDirection: SortDirection;

  /**
   * schema_version_id is the version of the store's schema to use to interpret
   * items. If there is no version with this ID, the operation will error with
   * SchemaVersionNotFound error. You should not have to set this manually as
   * your generated SDK should know its schema version and wire this in for you.
   *
   * @generated from field: uint32 schema_version_id = 7;
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
   * @generated from field: uint64 schema_id = 8;
   */
  schemaId: bigint;

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
   * A maximum of two key conditions are allowed: one with a GREATER_THAN (or equal to)
   * operator and one with a LESS_THAN (or equal to) operator. Together these amount to
   * a "between" condition on the key path.
   *
   * If these conditions are provided they must share the same prefix as the
   * key_path_prefix. For example, the following is valid:
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
 * Describes the message stately.db.BeginListRequest.
 * Use `create(BeginListRequestSchema)` to create a new message.
 */
export declare const BeginListRequestSchema: GenMessage<BeginListRequest>;

/**
 * These are stream messages, so multiple responses may be sent.
 *
 * @generated from message stately.db.ListResponse
 */
export declare type ListResponse = Message<"stately.db.ListResponse"> & {
  /**
   * @generated from oneof stately.db.ListResponse.response
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
 * Describes the message stately.db.ListResponse.
 * Use `create(ListResponseSchema)` to create a new message.
 */
export declare const ListResponseSchema: GenMessage<ListResponse>;

/**
 * @generated from message stately.db.ListPartialResult
 */
export declare type ListPartialResult = Message<"stately.db.ListPartialResult"> & {
  /**
   * results is a list that contains one entry for each Item that was found.
   *
   * @generated from field: repeated stately.db.Item items = 1;
   */
  items: Item[];
};

/**
 * Describes the message stately.db.ListPartialResult.
 * Use `create(ListPartialResultSchema)` to create a new message.
 */
export declare const ListPartialResultSchema: GenMessage<ListPartialResult>;

/**
 * @generated from message stately.db.ListFinished
 */
export declare type ListFinished = Message<"stately.db.ListFinished"> & {
  /**
   * token is always set and represents an updated list continuation token that
   * can be used in subsequent calls to ContinueList or SyncList.
   *
   * @generated from field: stately.db.ListToken token = 1;
   */
  token?: ListToken;
};

/**
 * Describes the message stately.db.ListFinished.
 * Use `create(ListFinishedSchema)` to create a new message.
 */
export declare const ListFinishedSchema: GenMessage<ListFinished>;

/**
 * A KeyCondition is an additional constraint to be applied to the list
 * operation. It is used to filter the results based on a specific key path
 * and an operator.
 * Wherever possible, stately will apply these key conditions at the DB layer
 * to optimize the list operation latency and cost.
 * Key conditions may be combined with a key_path_prefix to further
 * optimize the list operation. HOWEVER Key conditions must share the
 * same prefix as the key_path_prefix.
 *
 * @generated from message stately.db.KeyCondition
 */
export declare type KeyCondition = Message<"stately.db.KeyCondition"> & {
  /**
   * key_path is a valid key prefix (or full key) used to filter or optimize the list
   * operation based on the operator specified below.
   *
   * @generated from field: string key_path = 1;
   */
  keyPath: string;

  /**
   * Operator indicates how to apply key_path condition to the list operation.
   * Valid options are:
   * - GREATER_THAN: key_path must be greater than the specified value
   * - GREATER_THAN_OR_EQUAL: key_path must be greater than or equal to the specified value
   * - LESS_THAN: key_path must be less than the specified value
   * - LESS_THAN_OR_EQUAL: key_path must be less than or equal to the specified value
   *
   * Note: Operators are strictly evaluated they do not change meaning based on sort direction.
   * For example, regardless of sort direction, a GREATER_THAN operator
   * will still mean that a key_path must be greater than the specified value in order
   * to be included in the result set.
   *
   * @generated from field: stately.db.Operator operator = 2;
   */
  operator: Operator;
};

/**
 * Describes the message stately.db.KeyCondition.
 * Use `create(KeyConditionSchema)` to create a new message.
 */
export declare const KeyConditionSchema: GenMessage<KeyCondition>;

/**
 * SortDirection represents the direction of iteration.
 *
 * @generated from enum stately.db.SortDirection
 */
export enum SortDirection {
  /**
   * This is the default
   *
   * @generated from enum value: SORT_ASCENDING = 0;
   */
  SORT_ASCENDING = 0,

  /**
   * @generated from enum value: SORT_DESCENDING = 1;
   */
  SORT_DESCENDING = 1,
}

/**
 * Describes the enum stately.db.SortDirection.
 */
export declare const SortDirectionSchema: GenEnum<SortDirection>;

/**
 * @generated from enum stately.db.Operator
 */
export enum Operator {
  /**
   * This is the default
   *
   * @generated from enum value: OPERATOR_UNSPECIFIED = 0;
   */
  UNSPECIFIED = 0,

  /**
   * The key must be greater than the specified value based on lexicographic ordering.
   *
   * @generated from enum value: OPERATOR_GREATER_THAN = 4;
   */
  GREATER_THAN = 4,

  /**
   * The key must be greater than or equal to the specified value based on lexicographic ordering.
   *
   * @generated from enum value: OPERATOR_GREATER_THAN_OR_EQUAL = 5;
   */
  GREATER_THAN_OR_EQUAL = 5,

  /**
   * The key must be less than the specified value based on lexicographic ordering.
   *
   * @generated from enum value: OPERATOR_LESS_THAN = 6;
   */
  LESS_THAN = 6,

  /**
   * The key must be less than or equal to the specified value based on lexicographic ordering.
   *
   * @generated from enum value: OPERATOR_LESS_THAN_OR_EQUAL = 7;
   */
  LESS_THAN_OR_EQUAL = 7,
}

/**
 * Describes the enum stately.db.Operator.
 */
export declare const OperatorSchema: GenEnum<Operator>;
