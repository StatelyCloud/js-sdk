import { CallOptions, ClientMiddlewareCall, Metadata } from "nice-grpc-common";

/** Middleware that adds a random request ID. */
export async function* requestIdMiddleware<Request, Response>(
  call: ClientMiddlewareCall<Request, Response>,
  options: CallOptions,
) {
  const metadata = Metadata(options.metadata);

  let requestId: string | undefined;
  if ("crypto" in globalThis && "randomUUID" in globalThis.crypto) {
    requestId = globalThis.crypto.randomUUID();
  }
  if (requestId) {
    metadata.set("X-Stately-Request-ID", requestId);
  }

  return yield* call.next(call.request, {
    ...options,
    metadata,
  });
}
