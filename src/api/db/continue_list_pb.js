// @generated by protoc-gen-es v2.6.1 with parameter "target=js+dts,import_extension=.js"
// @generated from file db/continue_list.proto (package stately.db, syntax proto3)
/* eslint-disable */

import { enumDesc, fileDesc, messageDesc, tsEnum } from "@bufbuild/protobuf/codegenv2";

/**
 * Describes the file db/continue_list.proto.
 */
export const file_db_continue_list =
  /*@__PURE__*/
  fileDesc(
    "ChZkYi9jb250aW51ZV9saXN0LnByb3RvEgpzdGF0ZWx5LmRiIo0BChNDb250aW51ZUxpc3RSZXF1ZXN0EhIKCnRva2VuX2RhdGEYASABKAwSNAoJZGlyZWN0aW9uGAIgASgOMiEuc3RhdGVseS5kYi5Db250aW51ZUxpc3REaXJlY3Rpb24SGQoRc2NoZW1hX3ZlcnNpb25faWQYBSABKA0SEQoJc2NoZW1hX2lkGAYgASgEKk4KFUNvbnRpbnVlTGlzdERpcmVjdGlvbhIZChVDT05USU5VRV9MSVNUX0ZPUldBUkQQABIaChZDT05USU5VRV9MSVNUX0JBQ0tXQVJEEAFCbAoOY29tLnN0YXRlbHkuZGJCEUNvbnRpbnVlTGlzdFByb3RvUAGiAgNTRFiqAgpTdGF0ZWx5LkRiygIKU3RhdGVseVxEYuICFlN0YXRlbHlcRGJcR1BCTWV0YWRhdGHqAgtTdGF0ZWx5OjpEYmIGcHJvdG8z",
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
