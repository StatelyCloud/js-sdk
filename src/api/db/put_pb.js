// @generated by protoc-gen-es v2.2.2 with parameter "target=js+dts,import_extension=.js"
// @generated from file db/put.proto (package stately.db, syntax proto3)
/* eslint-disable */

import { fileDesc, messageDesc } from "@bufbuild/protobuf/codegenv1";
import { file_db_item } from "./item_pb.js";

/**
 * Describes the file db/put.proto.
 */
export const file_db_put =
  /*@__PURE__*/
  fileDesc(
    "CgxkYi9wdXQucHJvdG8SCnN0YXRlbHkuZGIiXAoKUHV0UmVxdWVzdBIQCghzdG9yZV9pZBgBIAEoBBIhCgRwdXRzGAIgAygLMhMuc3RhdGVseS5kYi5QdXRJdGVtEhkKEXNjaGVtYV92ZXJzaW9uX2lkGAMgASgNIikKB1B1dEl0ZW0SHgoEaXRlbRgBIAEoCzIQLnN0YXRlbHkuZGIuSXRlbSIuCgtQdXRSZXNwb25zZRIfCgVpdGVtcxgBIAMoCzIQLnN0YXRlbHkuZGIuSXRlbUJjCg5jb20uc3RhdGVseS5kYkIIUHV0UHJvdG9QAaICA1NEWKoCClN0YXRlbHkuRGLKAgpTdGF0ZWx5XERi4gIWU3RhdGVseVxEYlxHUEJNZXRhZGF0YeoCC1N0YXRlbHk6OkRiYgZwcm90bzM",
    [file_db_item],
  );

/**
 * Describes the message stately.db.PutRequest.
 * Use `create(PutRequestSchema)` to create a new message.
 */
export const PutRequestSchema = /*@__PURE__*/ messageDesc(file_db_put, 0);

/**
 * Describes the message stately.db.PutItem.
 * Use `create(PutItemSchema)` to create a new message.
 */
export const PutItemSchema = /*@__PURE__*/ messageDesc(file_db_put, 1);

/**
 * Describes the message stately.db.PutResponse.
 * Use `create(PutResponseSchema)` to create a new message.
 */
export const PutResponseSchema = /*@__PURE__*/ messageDesc(file_db_put, 2);
