// @generated by protoc-gen-es v2.2.3 with parameter "target=js+dts,import_extension=.js"
// @generated from file db/service.proto (package stately.db, syntax proto3)
/* eslint-disable */

import { fileDesc, serviceDesc } from "@bufbuild/protobuf/codegenv1";
import { file_db_continue_list } from "./continue_list_pb.js";
import { file_db_continue_scan } from "./continue_scan_pb.js";
import { file_db_delete } from "./delete_pb.js";
import { file_db_get } from "./get_pb.js";
import { file_db_list } from "./list_pb.js";
import { file_db_put } from "./put_pb.js";
import { file_db_scan } from "./scan_pb.js";
import { file_db_scan_root_paths } from "./scan_root_paths_pb.js";
import { file_db_sync_list } from "./sync_list_pb.js";
import { file_db_transaction } from "./transaction_pb.js";

/**
 * Describes the file db/service.proto.
 */
export const file_db_service =
  /*@__PURE__*/
  fileDesc(
    "ChBkYi9zZXJ2aWNlLnByb3RvEgpzdGF0ZWx5LmRiMowGCg9EYXRhYmFzZVNlcnZpY2USOwoDUHV0EhYuc3RhdGVseS5kYi5QdXRSZXF1ZXN0Ghcuc3RhdGVseS5kYi5QdXRSZXNwb25zZSIDkAICEjsKA0dldBIWLnN0YXRlbHkuZGIuR2V0UmVxdWVzdBoXLnN0YXRlbHkuZGIuR2V0UmVzcG9uc2UiA5ACARJECgZEZWxldGUSGS5zdGF0ZWx5LmRiLkRlbGV0ZVJlcXVlc3QaGi5zdGF0ZWx5LmRiLkRlbGV0ZVJlc3BvbnNlIgOQAgISSgoJQmVnaW5MaXN0Ehwuc3RhdGVseS5kYi5CZWdpbkxpc3RSZXF1ZXN0Ghguc3RhdGVseS5kYi5MaXN0UmVzcG9uc2UiA5ACATABElAKDENvbnRpbnVlTGlzdBIfLnN0YXRlbHkuZGIuQ29udGludWVMaXN0UmVxdWVzdBoYLnN0YXRlbHkuZGIuTGlzdFJlc3BvbnNlIgOQAgEwARJKCglCZWdpblNjYW4SHC5zdGF0ZWx5LmRiLkJlZ2luU2NhblJlcXVlc3QaGC5zdGF0ZWx5LmRiLkxpc3RSZXNwb25zZSIDkAIBMAESUAoMQ29udGludWVTY2FuEh8uc3RhdGVseS5kYi5Db250aW51ZVNjYW5SZXF1ZXN0Ghguc3RhdGVseS5kYi5MaXN0UmVzcG9uc2UiA5ACATABEkwKCFN5bmNMaXN0Ehsuc3RhdGVseS5kYi5TeW5jTGlzdFJlcXVlc3QaHC5zdGF0ZWx5LmRiLlN5bmNMaXN0UmVzcG9uc2UiA5ACATABElQKC1RyYW5zYWN0aW9uEh4uc3RhdGVseS5kYi5UcmFuc2FjdGlvblJlcXVlc3QaHy5zdGF0ZWx5LmRiLlRyYW5zYWN0aW9uUmVzcG9uc2UiACgBMAESWQoNU2NhblJvb3RQYXRocxIgLnN0YXRlbHkuZGIuU2NhblJvb3RQYXRoc1JlcXVlc3QaIS5zdGF0ZWx5LmRiLlNjYW5Sb290UGF0aHNSZXNwb25zZSIDkAIBQmcKDmNvbS5zdGF0ZWx5LmRiQgxTZXJ2aWNlUHJvdG9QAaICA1NEWKoCClN0YXRlbHkuRGLKAgpTdGF0ZWx5XERi4gIWU3RhdGVseVxEYlxHUEJNZXRhZGF0YeoCC1N0YXRlbHk6OkRiYgZwcm90bzM",
    [
      file_db_continue_list,
      file_db_continue_scan,
      file_db_delete,
      file_db_get,
      file_db_list,
      file_db_put,
      file_db_scan,
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
