// @generated by protoc-gen-es v2.2.4 with parameter "target=js+dts,import_extension=.js"
// @generated from file db/put.proto (package stately.db, syntax proto3)
/* eslint-disable */

import type { Message } from "@bufbuild/protobuf";
import type { GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";
import type { Item } from "./item_pb.js";

/**
 * Describes the file db/put.proto.
 */
export declare const file_db_put: GenFile;

/**
 * @generated from message stately.db.PutRequest
 */
export declare type PutRequest = Message<"stately.db.PutRequest"> & {
  /**
   * store_id is a globally unique Store ID, which can be looked up from the
   * console or CLI.
   *
   * @generated from field: uint64 store_id = 1;
   */
  storeId: bigint;

  /**
   * puts is up to 50 items to be put into the Store.
   *
   * @generated from field: repeated stately.db.PutItem puts = 2;
   */
  puts: PutItem[];

  /**
   * schema_version_id refers to the item version to return.
   *
   * If the store's schema does not have this version, the operation will error
   * with SchemaVersionNotFound error. You should not have to set this manually
   * as your generated SDK should know its schema version and wire this in for
   * you.
   *
   * @generated from field: uint32 schema_version_id = 3;
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
   * @generated from field: uint64 schema_id = 4;
   */
  schemaId: bigint;
};

/**
 * Describes the message stately.db.PutRequest.
 * Use `create(PutRequestSchema)` to create a new message.
 */
export declare const PutRequestSchema: GenMessage<PutRequest>;

/**
 * @generated from message stately.db.PutItem
 */
export declare type PutItem = Message<"stately.db.PutItem"> & {
  /**
   * item is the data to be put, including its item_type.
   *
   * @generated from field: stately.db.Item item = 1;
   */
  item?: Item;

  /**
   * overwrite_metadata_timestamps indicates that any "fromMetadata" timestamp
   * fields in the incoming payload should be saved as provided in the database.
   * Normally these would be ignored as they are automatically maintained, but
   * this flag can be useful for migrations from other systems. Note that this
   * only works for timestamps (createdAtTime and lastModifiedAtTime) - versions
   * cannot be overridden.
   *
   * @generated from field: bool overwrite_metadata_timestamps = 2;
   */
  overwriteMetadataTimestamps: boolean;

  /**
   * must_not_exist is a condition that indicates this item must not already
   * exist at any of its key paths. If there is already an item at one of those
   * paths, the Put operation will fail with a ConditionalCheckFailed error.
   * Note that if the item has an `initialValue` field in its key, that initial
   * value will automatically be chosen not to conflict with existing items, so
   * this condition only applies to key paths that do not contain the
   * `initialValue` field.
   *
   * @generated from field: bool must_not_exist = 3;
   */
  mustNotExist: boolean;
};

/**
 * Describes the message stately.db.PutItem.
 * Use `create(PutItemSchema)` to create a new message.
 */
export declare const PutItemSchema: GenMessage<PutItem>;

/**
 * @generated from message stately.db.PutResponse
 */
export declare type PutResponse = Message<"stately.db.PutResponse"> & {
  /**
   * items is the full result of each put operation. The response items are in
   * the same order as the request items. Each item is fully "filled out" - for
   * example, `initialValue` and `fromMetadata` fields are resolved.
   *
   * @generated from field: repeated stately.db.Item items = 1;
   */
  items: Item[];
};

/**
 * Describes the message stately.db.PutResponse.
 * Use `create(PutResponseSchema)` to create a new message.
 */
export declare const PutResponseSchema: GenMessage<PutResponse>;
