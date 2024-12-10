// @generated by protoc-gen-es v2.2.3 with parameter "target=js+dts,import_extension=.js"
// @generated from file db/delete.proto (package stately.db, syntax proto3)
/* eslint-disable */

import type { Message } from "@bufbuild/protobuf";
import type { GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";

/**
 * Describes the file db/delete.proto.
 */
export declare const file_db_delete: GenFile;

/**
 * @generated from message stately.db.DeleteRequest
 */
export declare type DeleteRequest = Message<"stately.db.DeleteRequest"> & {
  /**
   * store_id is a globally unique Store ID, which can be looked up from the
   * console or CLI.
   *
   * @generated from field: uint64 store_id = 1;
   */
  storeId: bigint;

  /**
   * deletes is up to 50 items to be deleted from the Group.
   *
   * @generated from field: repeated stately.db.DeleteItem deletes = 3;
   */
  deletes: DeleteItem[];

  /**
   * schema_version_id refers to the item version to delete from.
   *
   * If the store's schema does not have this version, the operation
   * will error with SchemaVersionNotFound error. You should not have to
   * set this manually as your generated SDK should know its schema version
   * and wire this in for you.
   *
   * @generated from field: uint32 schema_version_id = 5;
   */
  schemaVersionId: number;
};

/**
 * Describes the message stately.db.DeleteRequest.
 * Use `create(DeleteRequestSchema)` to create a new message.
 */
export declare const DeleteRequestSchema: GenMessage<DeleteRequest>;

/**
 * @generated from message stately.db.DeleteItem
 */
export declare type DeleteItem = Message<"stately.db.DeleteItem"> & {
  /**
   * key_path is the full path to the item. See Item#key_path for more details.
   *
   * @generated from field: string key_path = 1;
   */
  keyPath: string;
};

/**
 * Describes the message stately.db.DeleteItem.
 * Use `create(DeleteItemSchema)` to create a new message.
 */
export declare const DeleteItemSchema: GenMessage<DeleteItem>;

/**
 * @generated from message stately.db.DeleteResult
 */
export declare type DeleteResult = Message<"stately.db.DeleteResult"> & {
  /**
   * The key_path of the item that was deleted.
   *
   * @generated from field: string key_path = 1;
   */
  keyPath: string;
};

/**
 * Describes the message stately.db.DeleteResult.
 * Use `create(DeleteResultSchema)` to create a new message.
 */
export declare const DeleteResultSchema: GenMessage<DeleteResult>;

/**
 * @generated from message stately.db.DeleteResponse
 */
export declare type DeleteResponse = Message<"stately.db.DeleteResponse"> & {
  /**
   * results is the result of each delete operation, whether it succeeded or failed.
   *
   * @generated from field: repeated stately.db.DeleteResult results = 1;
   */
  results: DeleteResult[];
};

/**
 * Describes the message stately.db.DeleteResponse.
 * Use `create(DeleteResponseSchema)` to create a new message.
 */
export declare const DeleteResponseSchema: GenMessage<DeleteResponse>;
