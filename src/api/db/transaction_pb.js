// @generated by protoc-gen-es v2.2.2 with parameter "target=js+dts,import_extension=.js"
// @generated from file db/transaction.proto (package stately.db, syntax proto3)
/* eslint-disable */

import { fileDesc, messageDesc } from "@bufbuild/protobuf/codegenv1";
import { file_google_protobuf_empty } from "@bufbuild/protobuf/wkt";
import { file_db_continue_list } from "./continue_list_pb.js";
import { file_db_delete } from "./delete_pb.js";
import { file_db_get } from "./get_pb.js";
import { file_db_item } from "./item_pb.js";
import { file_db_item_property } from "./item_property_pb.js";
import { file_db_list } from "./list_pb.js";
import { file_db_put } from "./put_pb.js";

/**
 * Describes the file db/transaction.proto.
 */
export const file_db_transaction =
  /*@__PURE__*/
  fileDesc(
    "ChRkYi90cmFuc2FjdGlvbi5wcm90bxIKc3RhdGVseS5kYiLEAwoSVHJhbnNhY3Rpb25SZXF1ZXN0EhIKCm1lc3NhZ2VfaWQYASABKA0SLQoFYmVnaW4YAiABKAsyHC5zdGF0ZWx5LmRiLlRyYW5zYWN0aW9uQmVnaW5IABIvCglnZXRfaXRlbXMYAyABKAsyGi5zdGF0ZWx5LmRiLlRyYW5zYWN0aW9uR2V0SAASNgoKYmVnaW5fbGlzdBgEIAEoCzIgLnN0YXRlbHkuZGIuVHJhbnNhY3Rpb25CZWdpbkxpc3RIABI8Cg1jb250aW51ZV9saXN0GAUgASgLMiMuc3RhdGVseS5kYi5UcmFuc2FjdGlvbkNvbnRpbnVlTGlzdEgAEi8KCXB1dF9pdGVtcxgGIAEoCzIaLnN0YXRlbHkuZGIuVHJhbnNhY3Rpb25QdXRIABI1CgxkZWxldGVfaXRlbXMYByABKAsyHS5zdGF0ZWx5LmRiLlRyYW5zYWN0aW9uRGVsZXRlSAASKAoGY29tbWl0GAggASgLMhYuZ29vZ2xlLnByb3RvYnVmLkVtcHR5SAASJwoFYWJvcnQYCSABKAsyFi5nb29nbGUucHJvdG9idWYuRW1wdHlIAEIJCgdjb21tYW5kIpICChNUcmFuc2FjdGlvblJlc3BvbnNlEhIKCm1lc3NhZ2VfaWQYASABKA0SOQoLZ2V0X3Jlc3VsdHMYAiABKAsyIi5zdGF0ZWx5LmRiLlRyYW5zYWN0aW9uR2V0UmVzcG9uc2VIABIwCgdwdXRfYWNrGAMgASgLMh0uc3RhdGVseS5kYi5UcmFuc2FjdGlvblB1dEFja0gAEjsKDGxpc3RfcmVzdWx0cxgEIAEoCzIjLnN0YXRlbHkuZGIuVHJhbnNhY3Rpb25MaXN0UmVzcG9uc2VIABIzCghmaW5pc2hlZBgFIAEoCzIfLnN0YXRlbHkuZGIuVHJhbnNhY3Rpb25GaW5pc2hlZEgAQggKBnJlc3VsdCI/ChBUcmFuc2FjdGlvbkJlZ2luEhAKCHN0b3JlX2lkGAEgASgEEhkKEXNjaGVtYV92ZXJzaW9uX2lkGAIgASgNIjMKDlRyYW5zYWN0aW9uR2V0EiEKBGdldHMYASADKAsyEy5zdGF0ZWx5LmRiLkdldEl0ZW0ipgEKFFRyYW5zYWN0aW9uQmVnaW5MaXN0EhcKD2tleV9wYXRoX3ByZWZpeBgBIAEoCRINCgVsaW1pdBgCIAEoDRIzCg1zb3J0X3Byb3BlcnR5GAMgASgOMhwuc3RhdGVseS5kYi5Tb3J0YWJsZVByb3BlcnR5EjEKDnNvcnRfZGlyZWN0aW9uGAQgASgOMhkuc3RhdGVseS5kYi5Tb3J0RGlyZWN0aW9uImMKF1RyYW5zYWN0aW9uQ29udGludWVMaXN0EhIKCnRva2VuX2RhdGEYASABKAwSNAoJZGlyZWN0aW9uGAQgASgOMiEuc3RhdGVseS5kYi5Db250aW51ZUxpc3REaXJlY3Rpb24iMwoOVHJhbnNhY3Rpb25QdXQSIQoEcHV0cxgBIAMoCzITLnN0YXRlbHkuZGIuUHV0SXRlbSI8ChFUcmFuc2FjdGlvbkRlbGV0ZRInCgdkZWxldGVzGAEgAygLMhYuc3RhdGVseS5kYi5EZWxldGVJdGVtIjkKFlRyYW5zYWN0aW9uR2V0UmVzcG9uc2USHwoFaXRlbXMYASADKAsyEC5zdGF0ZWx5LmRiLkl0ZW0iNwoLR2VuZXJhdGVkSUQSDgoEdWludBgBIAEoBEgAEg8KBWJ5dGVzGAIgASgMSABCBwoFdmFsdWUiQwoRVHJhbnNhY3Rpb25QdXRBY2sSLgoNZ2VuZXJhdGVkX2lkcxgBIAMoCzIXLnN0YXRlbHkuZGIuR2VuZXJhdGVkSUQihAEKF1RyYW5zYWN0aW9uTGlzdFJlc3BvbnNlEi8KBnJlc3VsdBgBIAEoCzIdLnN0YXRlbHkuZGIuTGlzdFBhcnRpYWxSZXN1bHRIABIsCghmaW5pc2hlZBgCIAEoCzIYLnN0YXRlbHkuZGIuTGlzdEZpbmlzaGVkSABCCgoIcmVzcG9uc2UigQEKE1RyYW5zYWN0aW9uRmluaXNoZWQSEQoJY29tbWl0dGVkGAEgASgIEiUKC3B1dF9yZXN1bHRzGAIgAygLMhAuc3RhdGVseS5kYi5JdGVtEjAKDmRlbGV0ZV9yZXN1bHRzGAMgAygLMhguc3RhdGVseS5kYi5EZWxldGVSZXN1bHRCawoOY29tLnN0YXRlbHkuZGJCEFRyYW5zYWN0aW9uUHJvdG9QAaICA1NEWKoCClN0YXRlbHkuRGLKAgpTdGF0ZWx5XERi4gIWU3RhdGVseVxEYlxHUEJNZXRhZGF0YeoCC1N0YXRlbHk6OkRiYgZwcm90bzM",
    [
      file_db_continue_list,
      file_db_delete,
      file_db_get,
      file_db_item,
      file_db_item_property,
      file_db_list,
      file_db_put,
      file_google_protobuf_empty,
    ],
  );

/**
 * Describes the message stately.db.TransactionRequest.
 * Use `create(TransactionRequestSchema)` to create a new message.
 */
export const TransactionRequestSchema = /*@__PURE__*/ messageDesc(file_db_transaction, 0);

/**
 * Describes the message stately.db.TransactionResponse.
 * Use `create(TransactionResponseSchema)` to create a new message.
 */
export const TransactionResponseSchema = /*@__PURE__*/ messageDesc(file_db_transaction, 1);

/**
 * Describes the message stately.db.TransactionBegin.
 * Use `create(TransactionBeginSchema)` to create a new message.
 */
export const TransactionBeginSchema = /*@__PURE__*/ messageDesc(file_db_transaction, 2);

/**
 * Describes the message stately.db.TransactionGet.
 * Use `create(TransactionGetSchema)` to create a new message.
 */
export const TransactionGetSchema = /*@__PURE__*/ messageDesc(file_db_transaction, 3);

/**
 * Describes the message stately.db.TransactionBeginList.
 * Use `create(TransactionBeginListSchema)` to create a new message.
 */
export const TransactionBeginListSchema = /*@__PURE__*/ messageDesc(file_db_transaction, 4);

/**
 * Describes the message stately.db.TransactionContinueList.
 * Use `create(TransactionContinueListSchema)` to create a new message.
 */
export const TransactionContinueListSchema = /*@__PURE__*/ messageDesc(file_db_transaction, 5);

/**
 * Describes the message stately.db.TransactionPut.
 * Use `create(TransactionPutSchema)` to create a new message.
 */
export const TransactionPutSchema = /*@__PURE__*/ messageDesc(file_db_transaction, 6);

/**
 * Describes the message stately.db.TransactionDelete.
 * Use `create(TransactionDeleteSchema)` to create a new message.
 */
export const TransactionDeleteSchema = /*@__PURE__*/ messageDesc(file_db_transaction, 7);

/**
 * Describes the message stately.db.TransactionGetResponse.
 * Use `create(TransactionGetResponseSchema)` to create a new message.
 */
export const TransactionGetResponseSchema = /*@__PURE__*/ messageDesc(file_db_transaction, 8);

/**
 * Describes the message stately.db.GeneratedID.
 * Use `create(GeneratedIDSchema)` to create a new message.
 */
export const GeneratedIDSchema = /*@__PURE__*/ messageDesc(file_db_transaction, 9);

/**
 * Describes the message stately.db.TransactionPutAck.
 * Use `create(TransactionPutAckSchema)` to create a new message.
 */
export const TransactionPutAckSchema = /*@__PURE__*/ messageDesc(file_db_transaction, 10);

/**
 * Describes the message stately.db.TransactionListResponse.
 * Use `create(TransactionListResponseSchema)` to create a new message.
 */
export const TransactionListResponseSchema = /*@__PURE__*/ messageDesc(file_db_transaction, 11);

/**
 * Describes the message stately.db.TransactionFinished.
 * Use `create(TransactionFinishedSchema)` to create a new message.
 */
export const TransactionFinishedSchema = /*@__PURE__*/ messageDesc(file_db_transaction, 12);
