// @generated by protoc-gen-es v2.0.0 with parameter "target=js+dts,import_extension=.js"
// @generated from file db/continue_list.proto (package stately.db, syntax proto3)
/* eslint-disable */

import type { Message } from "@bufbuild/protobuf";
import type { GenEnum, GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";

/**
 * Describes the file db/continue_list.proto.
 */
export declare const file_db_continue_list: GenFile;

/**
 * @generated from message stately.db.ContinueListRequest
 */
export declare type ContinueListRequest = Message<"stately.db.ContinueListRequest"> & {
  /**
   * token_data is an opaque list continuation token returned by a previous call to
   * BeginList, ContinueList, or SyncList.
   *
   * @generated from field: bytes token_data = 1;
   */
  tokenData: Uint8Array;

  /**
   * direction indicates whether we are expanding the result set (paginating)
   * forward (in the direction of the original List operation) or backward (in
   * the opposite direction). The default is to expand forward.
   *
   * @generated from field: stately.db.ContinueListDirection direction = 2;
   */
  direction: ContinueListDirection;
};

/**
 * Describes the message stately.db.ContinueListRequest.
 * Use `create(ContinueListRequestSchema)` to create a new message.
 */
export declare const ContinueListRequestSchema: GenMessage<ContinueListRequest>;

/**
 * ContinueListDirection is used to indicate whether we are expanding the result
 * set (paginating) forward (in the direction of the original List operation) or
 * backward (in the opposite direction).
 *
 * @generated from enum stately.db.ContinueListDirection
 */
export enum ContinueListDirection {
  /**
   * this is the default
   *
   * @generated from enum value: CONTINUE_LIST_FORWARD = 0;
   */
  CONTINUE_LIST_FORWARD = 0,

  /**
   * @generated from enum value: CONTINUE_LIST_BACKWARD = 1;
   */
  CONTINUE_LIST_BACKWARD = 1,
}

/**
 * Describes the enum stately.db.ContinueListDirection.
 */
export declare const ContinueListDirectionSchema: GenEnum<ContinueListDirection>;
