// @generated by protoc-gen-es v2.2.3 with parameter "target=js+dts,import_extension=.js"
// @generated from file db/service.proto (package stately.db, syntax proto3)
/* eslint-disable */

import { fileDesc, serviceDesc } from "@bufbuild/protobuf/codegenv1";
import { file_db_continue_list } from "./continue_list_pb.js";
import { file_db_delete } from "./delete_pb.js";
import { file_db_get } from "./get_pb.js";
import { file_db_list } from "./list_pb.js";
import { file_db_put } from "./put_pb.js";
import { file_db_scan_root_paths } from "./scan_root_paths_pb.js";
import { file_db_sync_list } from "./sync_list_pb.js";
import { file_db_transaction } from "./transaction_pb.js";

/**
 * Describes the file db/service.proto.
 */
export const file_db_service =
  /*@__PURE__*/
  fileDesc(
    "ChBkYi9zZXJ2aWNlLnByb3RvEgpzdGF0ZWx5LmRiMu4ECg9EYXRhYmFzZVNlcnZpY2USOwoDUHV0EhYuc3RhdGVseS5kYi5QdXRSZXF1ZXN0Ghcuc3RhdGVseS5kYi5QdXRSZXNwb25zZSIDkAICEjsKA0dldBIWLnN0YXRlbHkuZGIuR2V0UmVxdWVzdBoXLnN0YXRlbHkuZGIuR2V0UmVzcG9uc2UiA5ACARJECgZEZWxldGUSGS5zdGF0ZWx5LmRiLkRlbGV0ZVJlcXVlc3QaGi5zdGF0ZWx5LmRiLkRlbGV0ZVJlc3BvbnNlIgOQAgISSgoJQmVnaW5MaXN0Ehwuc3RhdGVseS5kYi5CZWdpbkxpc3RSZXF1ZXN0Ghguc3RhdGVseS5kYi5MaXN0UmVzcG9uc2UiA5ACATABElAKDENvbnRpbnVlTGlzdBIfLnN0YXRlbHkuZGIuQ29udGludWVMaXN0UmVxdWVzdBoYLnN0YXRlbHkuZGIuTGlzdFJlc3BvbnNlIgOQAgEwARJMCghTeW5jTGlzdBIbLnN0YXRlbHkuZGIuU3luY0xpc3RSZXF1ZXN0Ghwuc3RhdGVseS5kYi5TeW5jTGlzdFJlc3BvbnNlIgOQAgEwARJUCgtUcmFuc2FjdGlvbhIeLnN0YXRlbHkuZGIuVHJhbnNhY3Rpb25SZXF1ZXN0Gh8uc3RhdGVseS5kYi5UcmFuc2FjdGlvblJlc3BvbnNlIgAoATABElkKDVNjYW5Sb290UGF0aHMSIC5zdGF0ZWx5LmRiLlNjYW5Sb290UGF0aHNSZXF1ZXN0GiEuc3RhdGVseS5kYi5TY2FuUm9vdFBhdGhzUmVzcG9uc2UiA5ACAUJnCg5jb20uc3RhdGVseS5kYkIMU2VydmljZVByb3RvUAGiAgNTRFiqAgpTdGF0ZWx5LkRiygIKU3RhdGVseVxEYuICFlN0YXRlbHlcRGJcR1BCTWV0YWRhdGHqAgtTdGF0ZWx5OjpEYmIGcHJvdG8z",
    [
      file_db_continue_list,
      file_db_delete,
      file_db_get,
      file_db_list,
      file_db_put,
      file_db_scan_root_paths,
      file_db_sync_list,
      file_db_transaction,
    ],
  );

/**
 * DatabaseService is the service for creating, reading, updating and deleting data
 * in a StatelyDB Store. Creating and modifying Stores is done by
 * stately.dbmanagement.ManagementService.
 *
 * @generated from service stately.db.DatabaseService
 */
export const DatabaseService = /*@__PURE__*/ serviceDesc(file_db_service, 0);
