// @generated by protoc-gen-es v2.1.0 with parameter "target=js+dts,import_extension=.js"
// @generated from file db/get.proto (package stately.db, syntax proto3)
/* eslint-disable */

import { fileDesc, messageDesc } from "@bufbuild/protobuf/codegenv1";
import { file_db_item } from "./item_pb.js";

/**
 * Describes the file db/get.proto.
 */
export const file_db_get =
  /*@__PURE__*/
  fileDesc(
    "CgxkYi9nZXQucHJvdG8SCnN0YXRlbHkuZGIicQoKR2V0UmVxdWVzdBIQCghzdG9yZV9pZBgBIAEoBBIhCgRnZXRzGAIgAygLMhMuc3RhdGVseS5kYi5HZXRJdGVtEhMKC2FsbG93X3N0YWxlGAMgASgIEhMKC3NjaGVtYV9oYXNoGAUgASgGSgQIBBAFIhsKB0dldEl0ZW0SEAoIa2V5X3BhdGgYASABKAkiLgoLR2V0UmVzcG9uc2USHwoFaXRlbXMYASADKAsyEC5zdGF0ZWx5LmRiLkl0ZW1CYwoOY29tLnN0YXRlbHkuZGJCCEdldFByb3RvUAGiAgNTRFiqAgpTdGF0ZWx5LkRiygIKU3RhdGVseVxEYuICFlN0YXRlbHlcRGJcR1BCTWV0YWRhdGHqAgtTdGF0ZWx5OjpEYmIGcHJvdG8z",
    [file_db_item],
  );

/**
 * Describes the message stately.db.GetRequest.
 * Use `create(GetRequestSchema)` to create a new message.
 */
export const GetRequestSchema = /*@__PURE__*/ messageDesc(file_db_get, 0);

/**
 * Describes the message stately.db.GetItem.
 * Use `create(GetItemSchema)` to create a new message.
 */
export const GetItemSchema = /*@__PURE__*/ messageDesc(file_db_get, 1);

/**
 * Describes the message stately.db.GetResponse.
 * Use `create(GetResponseSchema)` to create a new message.
 */
export const GetResponseSchema = /*@__PURE__*/ messageDesc(file_db_get, 2);
