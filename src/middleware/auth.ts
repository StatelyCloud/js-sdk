import { type Interceptor } from "@connectrpc/connect";
import { type AuthTokenProvider } from "../index.js";

/**
 * Create a middleware that fetches the auth token and adds it to the request as
 * a header.
 */
export function createAuthMiddleware(getToken: AuthTokenProvider): Interceptor {
  return (next) => async (req) => {
    req.header.set("Authorization", `Bearer ${await getToken()}`);
    return next(req);
  };
}
