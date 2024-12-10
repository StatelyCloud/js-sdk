// @generated by protoc-gen-es v2.2.3 with parameter "target=js+dts,import_extension=.js"
// @generated from file db/sync_list.proto (package stately.db, syntax proto3)
/* eslint-disable */

import { fileDesc, messageDesc } from "@bufbuild/protobuf/codegenv1";
import { file_db_item } from "./item_pb.js";
import { file_db_list } from "./list_pb.js";

/**
 * Describes the file db/sync_list.proto.
 */
export const file_db_sync_list =
  /*@__PURE__*/
  fileDesc(
    "ChJkYi9zeW5jX2xpc3QucHJvdG8SCnN0YXRlbHkuZGIiQAoPU3luY0xpc3RSZXF1ZXN0EhIKCnRva2VuX2RhdGEYASABKAwSGQoRc2NoZW1hX3ZlcnNpb25faWQYBSABKA0irwEKEFN5bmNMaXN0UmVzcG9uc2USKgoFcmVzZXQYASABKAsyGS5zdGF0ZWx5LmRiLlN5bmNMaXN0UmVzZXRIABI1CgZyZXN1bHQYAiABKAsyIy5zdGF0ZWx5LmRiLlN5bmNMaXN0UGFydGlhbFJlc3BvbnNlSAASLAoIZmluaXNoZWQYAyABKAsyGC5zdGF0ZWx5LmRiLkxpc3RGaW5pc2hlZEgAQgoKCHJlc3BvbnNlIg8KDVN5bmNMaXN0UmVzZXQioQEKF1N5bmNMaXN0UGFydGlhbFJlc3BvbnNlEicKDWNoYW5nZWRfaXRlbXMYASADKAsyEC5zdGF0ZWx5LmRiLkl0ZW0SLgoNZGVsZXRlZF9pdGVtcxgCIAMoCzIXLnN0YXRlbHkuZGIuRGVsZXRlZEl0ZW0SLQoldXBkYXRlZF9pdGVtX2tleXNfb3V0c2lkZV9saXN0X3dpbmRvdxgDIAMoCSIfCgtEZWxldGVkSXRlbRIQCghrZXlfcGF0aBgBIAEoCUJoCg5jb20uc3RhdGVseS5kYkINU3luY0xpc3RQcm90b1ABogIDU0RYqgIKU3RhdGVseS5EYsoCClN0YXRlbHlcRGLiAhZTdGF0ZWx5XERiXEdQQk1ldGFkYXRh6gILU3RhdGVseTo6RGJiBnByb3RvMw",
    [file_db_item, file_db_list],
  );

/**
 * Describes the message stately.db.SyncListRequest.
 * Use `create(SyncListRequestSchema)` to create a new message.
 */
export const SyncListRequestSchema = /*@__PURE__*/ messageDesc(file_db_sync_list, 0);

/**
 * Describes the message stately.db.SyncListResponse.
 * Use `create(SyncListResponseSchema)` to create a new message.
 */
export const SyncListResponseSchema = /*@__PURE__*/ messageDesc(file_db_sync_list, 1);

/**
 * Describes the message stately.db.SyncListReset.
 * Use `create(SyncListResetSchema)` to create a new message.
 */
export const SyncListResetSchema = /*@__PURE__*/ messageDesc(file_db_sync_list, 2);

/**
 * Describes the message stately.db.SyncListPartialResponse.
 * Use `create(SyncListPartialResponseSchema)` to create a new message.
 */
export const SyncListPartialResponseSchema = /*@__PURE__*/ messageDesc(file_db_sync_list, 3);

/**
 * Describes the message stately.db.DeletedItem.
 * Use `create(DeletedItemSchema)` to create a new message.
 */
export const DeletedItemSchema = /*@__PURE__*/ messageDesc(file_db_sync_list, 4);
