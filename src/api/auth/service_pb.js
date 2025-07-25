// @generated by protoc-gen-es v2.6.1 with parameter "target=js+dts,import_extension=.js"
// @generated from file auth/service.proto (package stately.auth, syntax proto3)
/* eslint-disable */

import { fileDesc, serviceDesc } from "@bufbuild/protobuf/codegenv2";
import { file_auth_get_auth_token } from "./get_auth_token_pb.js";

/**
 * Describes the file auth/service.proto.
 */
export const file_auth_service =
  /*@__PURE__*/
  fileDesc(
    "ChJhdXRoL3NlcnZpY2UucHJvdG8SDHN0YXRlbHkuYXV0aDJpCgtBdXRoU2VydmljZRJaCgxHZXRBdXRoVG9rZW4SIS5zdGF0ZWx5LmF1dGguR2V0QXV0aFRva2VuUmVxdWVzdBoiLnN0YXRlbHkuYXV0aC5HZXRBdXRoVG9rZW5SZXNwb25zZSIDkAIBQnEKEGNvbS5zdGF0ZWx5LmF1dGhCDFNlcnZpY2VQcm90b1ABogIDU0FYqgIMU3RhdGVseS5BdXRoygIMU3RhdGVseVxBdXRo4gIYU3RhdGVseVxBdXRoXEdQQk1ldGFkYXRh6gINU3RhdGVseTo6QXV0aGIGcHJvdG8z",
    [file_auth_get_auth_token],
  );

/**
 * AuthService is the service for vending access tokens used to connect to
 * StatelyDB. This API is meant to be used from SDKs. Access Keys are created
 * and managed from the stately.dbmanagement.UserService.
 *
 * @generated from service stately.auth.AuthService
 */
export const AuthService = /*@__PURE__*/ serviceDesc(file_auth_service, 0);
