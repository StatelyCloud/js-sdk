import { type Interceptor } from "@connectrpc/connect";

/** Middleware that adds a random request ID. */
export const requestIdMiddleware: Interceptor = (next) => (req) => {
  if ("crypto" in globalThis && "randomUUID" in globalThis.crypto) {
    req.header.set("X-Stately-Request-ID", globalThis.crypto.randomUUID());
  }
  return next(req);
};
