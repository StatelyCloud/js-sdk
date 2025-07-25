// @generated by protoc-gen-es v2.6.1 with parameter "target=js+dts,import_extension=.js"
// @generated from file db/get.proto (package stately.db, syntax proto3)
/* eslint-disable */

import { fileDesc, messageDesc } from "@bufbuild/protobuf/codegenv2";
import { file_db_item } from "./item_pb.js";

/**
 * Describes the file db/get.proto.
 */
export const file_db_get =
  /*@__PURE__*/
  fileDesc(
    "CgxkYi9nZXQucHJvdG8SCnN0YXRlbHkuZGIiigEKCkdldFJlcXVlc3QSEAoIc3RvcmVfaWQYASABKAQSIQoEZ2V0cxgCIAMoCzITLnN0YXRlbHkuZGIuR2V0SXRlbRITCgthbGxvd19zdGFsZRgDIAEoCBIZChFzY2hlbWFfdmVyc2lvbl9pZBgFIAEoDRIRCglzY2hlbWFfaWQYBiABKARKBAgEEAUiGwoHR2V0SXRlbRIQCghrZXlfcGF0aBgBIAEoCSIuCgtHZXRSZXNwb25zZRIfCgVpdGVtcxgBIAMoCzIQLnN0YXRlbHkuZGIuSXRlbUJjCg5jb20uc3RhdGVseS5kYkIIR2V0UHJvdG9QAaICA1NEWKoCClN0YXRlbHkuRGLKAgpTdGF0ZWx5XERi4gIWU3RhdGVseVxEYlxHUEJNZXRhZGF0YeoCC1N0YXRlbHk6OkRiYgZwcm90bzM",
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
