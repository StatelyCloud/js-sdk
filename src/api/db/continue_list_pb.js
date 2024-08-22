// @generated by protoc-gen-es v2.0.0 with parameter "target=js+dts,import_extension=.js"
// @generated from file db/continue_list.proto (package stately.db, syntax proto3)
/* eslint-disable */

import { enumDesc, fileDesc, messageDesc, tsEnum } from "@bufbuild/protobuf/codegenv1";

/**
 * Describes the file db/continue_list.proto.
 */
export const file_db_continue_list =
  /*@__PURE__*/
  fileDesc(
    "ChZkYi9jb250aW51ZV9saXN0LnByb3RvEgpzdGF0ZWx5LmRiIl8KE0NvbnRpbnVlTGlzdFJlcXVlc3QSEgoKdG9rZW5fZGF0YRgBIAEoDBI0CglkaXJlY3Rpb24YAiABKA4yIS5zdGF0ZWx5LmRiLkNvbnRpbnVlTGlzdERpcmVjdGlvbipOChVDb250aW51ZUxpc3REaXJlY3Rpb24SGQoVQ09OVElOVUVfTElTVF9GT1JXQVJEEAASGgoWQ09OVElOVUVfTElTVF9CQUNLV0FSRBABQmwKDmNvbS5zdGF0ZWx5LmRiQhFDb250aW51ZUxpc3RQcm90b1ABogIDU0RYqgIKU3RhdGVseS5EYsoCClN0YXRlbHlcRGLiAhZTdGF0ZWx5XERiXEdQQk1ldGFkYXRh6gILU3RhdGVseTo6RGJiBnByb3RvMw",
  );

/**
 * Describes the message stately.db.ContinueListRequest.
 * Use `create(ContinueListRequestSchema)` to create a new message.
 */
export const ContinueListRequestSchema = /*@__PURE__*/ messageDesc(file_db_continue_list, 0);

/**
 * Describes the enum stately.db.ContinueListDirection.
 */
export const ContinueListDirectionSchema = /*@__PURE__*/ enumDesc(file_db_continue_list, 0);

/**
 * ContinueListDirection is used to indicate whether we are expanding the result
 * set (paginating) forward (in the direction of the original List operation) or
 * backward (in the opposite direction).
 *
 * @generated from enum stately.db.ContinueListDirection
 */
export const ContinueListDirection = /*@__PURE__*/ tsEnum(ContinueListDirectionSchema);
