import { AuthTokenProvider } from "./index.js";

const DEFAULT_GRANT_TYPE = "client_credentials";

/**
 * initServerAuth initializes an auth client for backend servers and sets up an
 * automatically refreshing access token that can be fetched with getToken().
 * This should be passed to clients as `authTokenProvider`.
 * If no clientID or clientSecret are passed then the env vars `STATELY_CLIENT_ID` and `STATELY_CLIENT_SECRET`
 * will be used by default.
 *
 * @example
 * const getToken = initServerAuth({
 *  clientID: "my-client-id",
 *  clientSecret: "my-client-secret",
 * });
 * const client = createNodeClient({
 *   authTokenProvider: getToken,
 * });
 * const dataClient = createDataClient(client, 1221515n);
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
} = {}): AuthTokenProvider {
  let accessToken: string | undefined;
  let refreshTimeout: NodeJS.Timeout | number | undefined;

  // this also fails if either are an empty string
  if (!clientID || !clientSecret) {
    throw Error(
      `Failed to resolve auth credentials. \
Please ensure the "STATELY_CLIENT_ID" and "STATELY_CLIENT_SECRET" \
environment variables are set, or pass in the client ID and secret explicitly: createNodeClient({ authTokenProvider: initServerAuth({ clientID, clientSecret }) }).`,
    );
  }

  const refresh = dedupePromise(async function refresh(): Promise<string> {
    abortSignal?.throwIfAborted();

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

    const { access_token, expires_in } = (await resp.json()) as {
      access_token: string;
      expires_in: number;
    };

    // set a timeout to refresh the token in the background
    // 5-15 sec before it's due to expire.
    refreshTimeout = setTimeout(refresh, expires_in * 1000 - 5000 - 10_000 * Math.random());

    accessToken = access_token;
    return accessToken;
  });

  abortSignal?.addEventListener("abort", () => clearTimeout(refreshTimeout));

  const getToken = async () => accessToken ?? refresh();

  // Kick off the first refresh immediately
  getToken();

  return getToken;
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
