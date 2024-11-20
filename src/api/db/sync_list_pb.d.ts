// @generated by protoc-gen-es v2.2.2 with parameter "target=js+dts,import_extension=.js"
// @generated from file db/sync_list.proto (package stately.db, syntax proto3)
/* eslint-disable */

import type { Message } from "@bufbuild/protobuf";
import type { GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";
import type { Item } from "./item_pb.js";
import type { ListFinished } from "./list_pb.js";

/**
 * Describes the file db/sync_list.proto.
 */
export declare const file_db_sync_list: GenFile;

/**
 * @generated from message stately.db.SyncListRequest
 */
export declare type SyncListRequest = Message<"stately.db.SyncListRequest"> & {
  /**
   * token_data is an opaque list continuation token returned by a previous call to
   * List, ContinueList, or SyncList.
   *
   * @generated from field: bytes token_data = 1;
   */
  tokenData: Uint8Array;

  /**
   * schema_version_id is the schema version id the client is using. This is
   * used to ensure a consistent schema version is used for all items in the result set.
   * If the version the token was created with is different from the client's
   * current version, the response will contain a SyncListReset response followed by
   * items in the client's current schema version. The returned list token can then
   * be used for further SyncList and ContinueList calls with the current schema
   * version, without having to start a new BeginList call.
   * TODO this will soon be required.
   *
   * @generated from field: uint32 schema_version_id = 5;
   */
  schemaVersionId: number;
};

/**
 * Describes the message stately.db.SyncListRequest.
 * Use `create(SyncListRequestSchema)` to create a new message.
 */
export declare const SyncListRequestSchema: GenMessage<SyncListRequest>;

/**
 * These are stream messages, so multiple responses may be sent.
 *
 * @generated from message stately.db.SyncListResponse
 */
export declare type SyncListResponse = Message<"stately.db.SyncListResponse"> & {
  /**
   * @generated from oneof stately.db.SyncListResponse.response
   */
  response:
    | {
        /**
         * SyncListReset is returned if the provided token is too far behind to be able to
         * report deleted items, or if the client is using a different schema version than
         * it started the list with. The following results will start over with a fresh
         * result set. Clients should discard any cached data from this result set and start
         * re-populating it from the rest of the sync response.
         *
         * @generated from field: stately.db.SyncListReset reset = 1;
         */
        value: SyncListReset;
        case: "reset";
      }
    | {
        /**
         * Result is a segment of sync results - multiple of these may be returned.
         *
         * @generated from field: stately.db.SyncListPartialResponse result = 2;
         */
        value: SyncListPartialResponse;
        case: "result";
      }
    | {
        /**
         * Finished is sent when the sync is complete, and there will only be one.
         *
         * @generated from field: stately.db.ListFinished finished = 3;
         */
        value: ListFinished;
        case: "finished";
      }
    | { case: undefined; value?: undefined };
};

/**
 * Describes the message stately.db.SyncListResponse.
 * Use `create(SyncListResponseSchema)` to create a new message.
 */
export declare const SyncListResponseSchema: GenMessage<SyncListResponse>;

/**
 * SyncListReset is returned if the provided token is too far behind to be able to
 * report deleted items, and subsequent results will start over with a fresh result
 * set. Clients should discard any cached data from this result set and start re-populating it.
 *
 * currently empty, but in the future we could return:
 * - how far out-of-date (time)
 * - reset reason (too many changes, out-of-date, migrated, etc)
 *
 * @generated from message stately.db.SyncListReset
 */
export declare type SyncListReset = Message<"stately.db.SyncListReset"> & {};

/**
 * Describes the message stately.db.SyncListReset.
 * Use `create(SyncListResetSchema)` to create a new message.
 */
export declare const SyncListResetSchema: GenMessage<SyncListReset>;

/**
 * @generated from message stately.db.SyncListPartialResponse
 */
export declare type SyncListPartialResponse = Message<"stately.db.SyncListPartialResponse"> & {
  /**
   * Items in the token window that were added or updated since the last
   * sync/list.
   *
   * @generated from field: repeated stately.db.Item changed_items = 1;
   */
  changedItems: Item[];

  /**
   * Items in the token window that were deleted since the last sync/list.
   *
   * @generated from field: repeated stately.db.DeletedItem deleted_items = 2;
   */
  deletedItems: DeletedItem[];

  /**
   * Keys of items that were updated but Stately cannot tell if they were in the
   * sync window. Treat these as deleted in most cases. For more information
   * see: https://docs.stately.cloud/api/sync
   *
   * @generated from field: repeated string updated_item_keys_outside_list_window = 3;
   */
  updatedItemKeysOutsideListWindow: string[];
};

/**
 * Describes the message stately.db.SyncListPartialResponse.
 * Use `create(SyncListPartialResponseSchema)` to create a new message.
 */
export declare const SyncListPartialResponseSchema: GenMessage<SyncListPartialResponse>;

/**
 * @generated from message stately.db.DeletedItem
 */
export declare type DeletedItem = Message<"stately.db.DeletedItem"> & {
  /**
   * Since the item was deleted, only the key is provided.
   *
   * @generated from field: string key_path = 1;
   */
  keyPath: string;
};

/**
 * Describes the message stately.db.DeletedItem.
 * Use `create(DeletedItemSchema)` to create a new message.
 */
export declare const DeletedItemSchema: GenMessage<DeletedItem>;
