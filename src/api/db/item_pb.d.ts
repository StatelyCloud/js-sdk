// @generated by protoc-gen-es v2.2.2 with parameter "target=js+dts,import_extension=.js"
// @generated from file db/item.proto (package stately.db, syntax proto3)
/* eslint-disable */

import type { JsonObject, Message } from "@bufbuild/protobuf";
import type { GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";

/**
 * Describes the file db/item.proto.
 */
export declare const file_db_item: GenFile;

/**
 * Item represents data stored in StatelyDB.
 *
 * @generated from message stately.db.Item
 */
export declare type Item = Message<"stately.db.Item"> & {
  /**
   * item_type is the schema type of the item. It must correspond to one of the
   * schema's `itemType` declarations.
   *
   * @generated from field: string item_type = 1;
   */
  itemType: string;

  /**
   * The payload is the actual data of the item. Its structure is dictated by
   * your store's schema for this item type.
   *
   * @generated from oneof stately.db.Item.payload
   */
  payload:
    | {
        /**
         * proto is a serialized binary proto message, following the schema for this
         * item type. Clients will need to map the item_type to a protobuf message
         * descriptor to be able to unmarshal this.
         *
         * @generated from field: bytes proto = 2;
         */
        value: Uint8Array;
        case: "proto";
      }
    | {
        /**
         * json is the JSON representation of the item's payload, as an alternative
         * to the binary proto representation. It exists only to support clients
         * that speak the Connect-JSON protocol. Using google.protobuf.Struct means
         * the JSON is embedded inline instead of being a string, and most languages
         * should have special support for it.
         *
         * @generated from field: google.protobuf.Struct json = 3;
         */
        value: JsonObject;
        case: "json";
      }
    | { case: undefined; value?: undefined };
};

/**
 * Describes the message stately.db.Item.
 * Use `create(ItemSchema)` to create a new message.
 */
export declare const ItemSchema: GenMessage<Item>;
