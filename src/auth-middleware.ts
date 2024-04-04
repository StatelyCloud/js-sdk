import { CallOptions, ClientMiddlewareCall, Metadata } from "nice-grpc-common";
import { AuthTokenProvider } from "./index.js";

/**
 * Create a middleware that fetches the auth token and adds it to the request as
 * a header.
 */
export function createAuthMiddleware(getToken: AuthTokenProvider) {
  return async function* authMiddleware<Request, Response>(
    call: ClientMiddlewareCall<Request, Response>,
    options: CallOptions,
  ) {
    const metadata = Metadata(options.metadata).set("Authorization", `Bearer ${await getToken()}`);
    return yield* call.next(call.request, {
      ...options,
      metadata,
    });
  };
}
