import { Code, ConnectError } from "@connectrpc/connect";
import { StatelyErrorDetailsSchema } from "./api/errors/error_details_pb.js";

// Initially forked/inspired by ConnectError

/**
 * StatelyError captures four pieces of information: a stable Stately Error
 * Code, an error message, a gRPC/Connect Code, and an optional cause of the
 * error.
 *
 * Because developer tools typically show just the error message, we prefix it
 * with the status codes, so that the most important information is always
 * visible immediately.
 */
export class StatelyError extends Error {
  /**
   * The gRPC/Connect Code for this error.
   */
  readonly code: Code;

  /**
   * The more fine-grained Stately error code, which is a human-readable string.
   */
  readonly statelyCode: string;

  readonly cause?: string | Error;

  readonly requestId?: string;

  override name = "StatelyError";

  /**
   * Create a new StatelyError. If no code is provided, code "unknown" is used.
   */
  constructor(
    statelyCode: string,
    message: string,
    code: Code = (Code[statelyCode as unknown as number] as unknown as Code) ?? Code.Unknown,
    cause?: string | Error,
    requestId?: string,
  ) {
    super(createMessage(message, statelyCode, code, requestId));
    // see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#example
    Object.setPrototypeOf(this, new.target.prototype);
    this.statelyCode = statelyCode;
    this.code = code;
    this.cause = cause;
    this.requestId = requestId;
  }

  /**
   * Convert any value - typically a caught error into a StatelyError, following
   * these rules:
   * - If the value is already a StatelyError, return it as is.
   * - If it is a ConnectError, convert into a StatelyError, using the
   *   StatelyErrorDetails in the returned error.
   * - Otherwise convert to a ConnectError using the rules of ConnectError.from
   *   and a Stately error code of "Unknown". The converted ConnectError will be
   *   used for the "cause" property for the new ConnectError.
   */
  static from(e: unknown) {
    if (e instanceof StatelyError) {
      return e;
    } else if (e instanceof ConnectError && e.cause instanceof StatelyError) {
      return e.cause;
    }

    const connectError = ConnectError.from(e);

    const details = connectError.findDetails(StatelyErrorDetailsSchema);
    const requestId = connectError.metadata.get("st-rid") ?? undefined;

    if (details && details.length > 0) {
      const detail = details[0];
      return new StatelyError(
        detail.statelyCode,
        detail.message,
        connectError.code,
        detail.upstreamCause,
        requestId,
      );
    }
    return new StatelyError(
      Code[connectError.code],
      connectError.rawMessage,
      connectError.code,
      connectError.cause instanceof Error
        ? connectError.cause
        : typeof connectError.cause === "string"
          ? connectError.cause
          : undefined,
      requestId,
    );
  }

  /**
   * Make sure instanceof works as expected.
   */
  static [Symbol.hasInstance](v: unknown): boolean {
    if (!(v instanceof Error)) {
      return false;
    }
    if (Object.getPrototypeOf(v) === StatelyError.prototype) {
      return true;
    }
    return (
      v.name === "StatelyError" &&
      "code" in v &&
      typeof v.code === "number" &&
      "statelyCode" in v &&
      typeof v.statelyCode === "string"
    );
  }
}

/**
 * Create an error message, prefixing the given code.
 */
function createMessage(
  message: string,
  statelyCode: string,
  code: Code,
  requestId: string | undefined,
) {
  const codeString = `${Code[code]}/${statelyCode}`;
  const msg = message.length ? `(${codeString}) ${message}` : `(${codeString})`;
  if (requestId) {
    return `${msg} (Request ID: ${requestId})`;
  }
  return msg;
}
