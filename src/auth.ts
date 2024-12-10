import { Code, createClient } from "@connectrpc/connect";
import { createConnectTransport, Http2SessionManager } from "@connectrpc/connect-node";
import { AuthService } from "./api/auth/service_pb.js";
import { StatelyError } from "./errors.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { type AuthTokenProvider } from "./types.js";

const DEFAULT_GRANT_TYPE = "client_credentials";
const maxRetries = 10;
const initialBackoffMs = 200;
const maxBackoffMs = 15_000;

/**
 * accessKeyAuth initializes an auth client for backend servers that uses
 * Stately Access Keys to authenticate. An access key is like a
 * username+password and should be kept secret. The access key gets exchanged
 * for an auth token that is automatically refreshed in the background. The
 * automatic refresh can be stopped by providing an abortSignal. This should be
 * passed to clients as `authTokenProvider`. If no accessKey is
 * passed then this will read the env var `STATELY_ACCESS_KEY`.
 * @example
 * const client = createClient({
 *   authTokenProvider: accessKeyAuth({
 *     accessKey: "my-access-key",
 *   }),
 * });
 */
export function accessKeyAuth({
  accessKey = process.env.STATELY_ACCESS_KEY,
  abortSignal,
}: {
  accessKey?: string;
  abortSignal?: AbortSignal;
} = {}): (endpoint: string) => AuthTokenProvider {
  return (endpoint) => {
    let accessToken: string | undefined;
    // The time at which the current token expires, in milliseconds since epoch
    let expiresAt = 0;
    let refreshTimeout: NodeJS.Timeout | number | undefined;

    // this also fails if either are an empty string
    if (!accessKey) {
      throw new StatelyError(
        "MissingCredentials",
        `Failed to resolve auth credentials. \
Please ensure the "STATELY_ACCESS_KEY" \
environment variable is set, or pass in the access key: \
createClient({ authTokenProvider: accessKeyAuth({ accessKey: 'my-access-key' }) }).`,
        Code.FailedPrecondition,
      );
    }

    const sessionManager = new Http2SessionManager(endpoint);

    const transport = createConnectTransport({
      baseUrl: endpoint,
      httpVersion: "2",
      interceptors: [requestIdMiddleware],
      sessionManager,
    });

    const authClient = createClient(AuthService, transport);

    const validAccessToken = () =>
      accessToken && Date.now() < expiresAt ? accessToken : undefined;

    const refresh = dedupePromise(async function refresh(): Promise<string> {
      clearTimeout(refreshTimeout);
      let refreshed = false;
      let attempt = 0;
      while (!accessToken || !refreshed) {
        abortSignal?.throwIfAborted();
        try {
          const response = await authClient.getAuthToken(
            {
              identity: { case: "accessKey", value: accessKey },
            },
            { signal: abortSignal },
          );

          const expiresInMs = Number(response.expiresInS) * 1000;
          const newExpiresAt = Date.now() + expiresInMs;
          // Only update the token if the new one expires later
          if (newExpiresAt > expiresAt) {
            expiresAt = newExpiresAt;
            accessToken = response.authToken;
          }
          refreshTimeout = setTimeout(refresh, expiresInMs * jitter());

          refreshed = true;
        } catch (e) {
          const err = StatelyError.from(e);
          if (
            err.code === Code.Unauthenticated ||
            err.code === Code.PermissionDenied ||
            err.code === Code.NotFound ||
            err.code === Code.InvalidArgument ||
            attempt > maxRetries
          ) {
            // Access key is invalid, no use retrying
            throw err;
          }

          // Wait and retry
          await new Promise((resolve) =>
            setTimeout(resolve, backoff(attempt, initialBackoffMs, maxBackoffMs)),
          );
        }
        attempt++;
      }

      return accessToken;
    });

    abortSignal?.addEventListener("abort", () => {
      clearTimeout(refreshTimeout);
      sessionManager.abort();
    });

    const getToken = async () => validAccessToken() ?? refresh();

    // Kick off the first refresh immediately
    getToken();

    return getToken;
  };
}

class HttpStatusError extends Error {
  status: number;
  statusText: string;

  constructor(status: number, statusText: string) {
    super(`HTTP ${status} ${statusText}`);
    this.name = "HttpStatusError";
    this.status = status;
    this.statusText = statusText;
  }
}

/**
 * initServerAuth initializes an auth client for backend servers and sets up an
 * automatically refreshing access token that can be fetched with getToken().
 * This should be passed to clients as `authTokenProvider`.
 * If no clientID or clientSecret are passed then the env vars `STATELY_CLIENT_ID` and `STATELY_CLIENT_SECRET`
 * will be used by default.
 * @deprecated use accessKeyAuth instead
 * @example
 * const client = createClient({
 *   authTokenProvider: initServerAuth({
 *     clientID: "my-client-id",
 *     clientSecret: "my-client-secret",
 *   }),
 * });
 */
export function initServerAuth({
  clientID = process.env.STATELY_CLIENT_ID,
  clientSecret = process.env.STATELY_CLIENT_SECRET,
  authDomain = "https://oauth.stately.cloud",
  audience = "api.stately.cloud",
  abortSignal,
}: {
  clientID?: string;
  clientSecret?: string;
  authDomain?: string;
  audience?: string;
  abortSignal?: AbortSignal;
} = {}): () => AuthTokenProvider {
  return () => {
    let accessToken: string | undefined;
    // The time at which the current token expires, in milliseconds since epoch
    let expiresAt = 0;
    let refreshTimeout: NodeJS.Timeout | number | undefined;

    // this also fails if either are an empty string
    if (!clientID || !clientSecret) {
      throw new StatelyError(
        "MissingCredentials",
        `Failed to resolve auth credentials. \
Please ensure the "STATELY_CLIENT_ID" and "STATELY_CLIENT_SECRET" \
environment variables are set, or pass in the client ID and secret explicitly: createClient({ authTokenProvider: initServerAuth({ clientID, clientSecret }) }).`,
        Code.FailedPrecondition,
      );
    }

    const validAccessToken = () =>
      accessToken && Date.now() < expiresAt ? accessToken : undefined;

    const refresh = dedupePromise(async function refresh(): Promise<string> {
      clearTimeout(refreshTimeout);
      let refreshed = false;
      let attempt = 0;
      while (!accessToken || !refreshed) {
        abortSignal?.throwIfAborted();

        try {
          const resp = await fetch(`${authDomain}/oauth/token`, {
            method: "POST",
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              client_id: clientID,
              client_secret: clientSecret,
              audience,
              grant_type: DEFAULT_GRANT_TYPE,
            }),
          });

          if (!resp.ok) {
            throw new HttpStatusError(resp.status, resp.statusText);
          }

          const { access_token, expires_in } = (await resp.json()) as {
            access_token: string;
            expires_in: number; // in seconds
          };

          const expiresInMs = expires_in * 1000;
          expiresAt = Date.now() + expiresInMs;
          accessToken = access_token;
          refreshTimeout = setTimeout(refresh, expiresInMs * jitter());

          refreshed = true;
        } catch (e) {
          if (
            (e instanceof HttpStatusError && (e.status === 401 || e.status === 403)) ||
            attempt > maxRetries
          ) {
            throw StatelyError.from(e);
          }
          // Wait and retry
          await new Promise((resolve) => setTimeout(resolve, backoff(attempt, 200, 15000)));
        }
        attempt++;
      }

      return accessToken;
    });

    abortSignal?.addEventListener("abort", () => clearTimeout(refreshTimeout));

    const getToken = async () => validAccessToken() ?? refresh();

    // Kick off the first refresh immediately
    getToken();

    return getToken;
  };
}

/**
 * Transform an async function into a version that will only execute once at a time - if there's already
 * a version going, the existing promise will be returned instead of running it again.
 */
export function dedupePromise<T extends unknown[], K>(
  func: (...args: T) => Promise<K>,
): (...args: T) => Promise<K> {
  let promiseCache: Promise<K> | null = null;
  return async (...args: T) => {
    if (promiseCache) {
      return promiseCache;
    }
    promiseCache = func(...args);
    try {
      return await promiseCache;
    } finally {
      promiseCache = null;
    }
  };
}

// Calculate a random multiplier to apply to the expiry so that we refresh
// in the background ahead of expiration, but avoid multiple processes
// hammering the service at the same time.
function jitter() {
  return Math.random() * 0.05 + 0.9;
}

// backoff returns a duration to wait before retrying a request. `attempt` is
// the current attempt number, starting from 0 (e.g. the first attempt is 0,
// then 1, then 2...).
function backoff(attempt: number, baseBackoffMs: number, max: number): number {
  // Double the base backoff time per attempt, starting with 1
  const exp = 1 << attempt; // 2^attempt
  // Add a full jitter to the backoff time, from no wait to 100% of the exponential backoff.
  // See https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
  const jitter = Math.random();
  return Math.min(max, exp * jitter * baseBackoffMs);
}
