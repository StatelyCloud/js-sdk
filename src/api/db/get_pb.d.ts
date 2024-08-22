// @generated by protoc-gen-es v2.0.0 with parameter "target=js+dts,import_extension=.js"
// @generated from file db/get.proto (package stately.db, syntax proto3)
/* eslint-disable */

import type { Message } from "@bufbuild/protobuf";
import type { GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";
import type { Item } from "./item_pb.js";

/**
 * Describes the file db/get.proto.
 */
export declare const file_db_get: GenFile;

/**
 * @generated from message stately.db.GetRequest
 */
export declare type GetRequest = Message<"stately.db.GetRequest"> & {
  /**
   * store_id is a globally unique Store ID, which can be looked up from the
   * console or CLI.
   *
   * @generated from field: uint64 store_id = 1;
   */
  storeId: bigint;

  /**
   * gets is one or more requests to get an item its key path.
   *
   * @generated from field: repeated stately.db.GetItem gets = 2;
   */
  gets: GetItem[];

  /**
   * allow_stale indicates that you're okay with getting a slightly stale item -
   * that is, if you had just changed an item and then call GetItem, you might
   * get the old version of the item. This can result in improved performance,
   * availability, and cost.
   *
   * @generated from field: bool allow_stale = 3;
   */
  allowStale: boolean;
};

/**
 * Describes the message stately.db.GetRequest.
 * Use `create(GetRequestSchema)` to create a new message.
 */
export declare const GetRequestSchema: GenMessage<GetRequest>;

/**
 * @generated from message stately.db.GetItem
 */
export declare type GetItem = Message<"stately.db.GetItem"> & {
  /**
   * key_path is the full path to the item. See Item#key_path for more details.
   *
   * @generated from field: string key_path = 1;
   */
  keyPath: string;
};

/**
 * Describes the message stately.db.GetItem.
 * Use `create(GetItemSchema)` to create a new message.
 */
export declare const GetItemSchema: GenMessage<GetItem>;

/**
 * @generated from message stately.db.GetResponse
 */
export declare type GetResponse = Message<"stately.db.GetResponse"> & {
  /**
   * results is a list that contains one entry for each Item that was found.
   *
   * @generated from field: repeated stately.db.Item items = 1;
   */
  items: Item[];
};

/**
 * Describes the message stately.db.GetResponse.
 * Use `create(GetResponseSchema)` to create a new message.
 */
export declare const GetResponseSchema: GenMessage<GetResponse>;
