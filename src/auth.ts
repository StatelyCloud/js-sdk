import { Code, createClient, Transport } from "@connectrpc/connect";
import { AuthService } from "./api/auth/service_pb.js";
import { StatelyError } from "./errors.js";
import { type AuthTokenProvider } from "./types.js";

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
} = {}): (transport: Transport, close: () => void) => AuthTokenProvider {
  return (transport, close) => {
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

    const onAbort = () => {
      clearTimeout(refreshTimeout);
      close();
      abortSignal?.removeEventListener("abort", onAbort);
    };
    abortSignal?.addEventListener("abort", onAbort);

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
