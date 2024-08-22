import { Code, ConnectError } from "@connectrpc/connect";

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

  override name = "StatelyError";

  /**
   * Create a new ConnectError.
   * If no code is provided, code "unknown" is used.
   * Outgoing details are only relevant for the server side - a service may
   * raise an error with details, and it is up to the protocol implementation
   * to encode and send the details along with error.
   */
  constructor(
    statelyCode: string,
    message: string,
    code: Code = (Code[statelyCode as unknown as number] as unknown as Code) ?? Code.Unknown,
    _cause?: unknown,
  ) {
    super(createMessage(message, statelyCode, code));
    // see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#example
    Object.setPrototypeOf(this, new.target.prototype);
    this.statelyCode = statelyCode;
    this.code = code;
  }

  /**
   * Convert any value - typically a caught error into a StatelyError, following
   * these rules:
   * - If the value is already a StatelyError, return it as is.
   * - Convert into a ConnectError, using the rules of ConnectError.from and a
   *   Stately error code of "Unknown". The converted ConnectError will be used
   *   for the "cause" property for the new ConnectError.
   */
  static from(e: unknown) {
    if (e instanceof StatelyError) {
      return e;
    }
    const connectError = ConnectError.from(e);
    return new StatelyError("Unknown", connectError.message, connectError.code, connectError);
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
    return v.name === "StatelyError" && "code" in v && typeof v.code === "number";
  }
}

/**
 * Create an error message, prefixing the given code.
 */
function createMessage(message: string, statelyCode: string, code: Code) {
  let codeString = Code[code];
  if (statelyCode !== codeString) {
    codeString = `${codeString}/${statelyCode}`;
  }
  return message.length ? `(${codeString}) ${message}` : `(${codeString})`;
}
