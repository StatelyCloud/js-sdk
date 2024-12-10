// @generated by protoc-gen-es v2.2.3 with parameter "target=js+dts,import_extension=.js"
// @generated from file errors/error_details.proto (package stately.errors, syntax proto3)
/* eslint-disable */

import type { Message } from "@bufbuild/protobuf";
import type { GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";

/**
 * Describes the file errors/error_details.proto.
 */
export declare const file_errors_error_details: GenFile;

/**
 * StatelyErrorDetails is a message containing detailed error information.
 * This is returned from the Stately API via Connect error details:
 *  https://connectrpc.com/docs/go/errors#error-details
 * Note: As a customer, you should not need to handle this message directly unless writing
 * a custom low-level SDK. Instead, language-specific SDKs will provide a more user-friendly
 * error object that wraps this message.
 *
 * @generated from message stately.errors.StatelyErrorDetails
 */
export declare type StatelyErrorDetails = Message<"stately.errors.StatelyErrorDetails"> & {
  /**
   * stately_code is the error code that was returned by the Stately API.
   * The full list of codes is available at https://docs.stately.cloud/api/error-codes/
   * and documentation on a specific code can be found at https://docs.stately.cloud/api/error-codes/#{stately_code}
   *
   * @generated from field: string stately_code = 1;
   */
  statelyCode: string;

  /**
   * message is a human-readable error message that can be displayed to the user that
   * provides more context about the error.
   *
   * @generated from field: string message = 2;
   */
  message: string;

  /**
   * upstream_cause is additional information about the error that can be used to help debug the error,
   * This field will only optionally be supplied by the Stately API.
   * Note: This may row over as the error is passed through multiple services.
   *
   * @generated from field: string upstream_cause = 3;
   */
  upstreamCause: string;

  /**
   * The Connect/gRPC code associated with this error. This generally isn't set,
   * because the overall API response has an error code. But this can be used in
   * the case that we're returning multiple different errors, or communicating
   * errors across non-Connect APIs.
   *
   * @generated from field: uint32 code = 4;
   */
  code: number;
};

/**
 * Describes the message stately.errors.StatelyErrorDetails.
 * Use `create(StatelyErrorDetailsSchema)` to create a new message.
 */
export declare const StatelyErrorDetailsSchema: GenMessage<StatelyErrorDetails>;
