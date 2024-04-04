# Stately JavaScript Client

This is the JavaScript (+ TypeScript!) client for the Stately Cloud API. We're
still in an invite-only preview mode - if you're interested, please reach out to
preview@stately.cloud.

This client is currently meant for use from NodeJS server applications.

The client library can be installed from NPM:

```
npm install @stately-cloud/client
# or
pnpm install @stately-cloud/client
# or
yarn add @stately-cloud/client
```

When you join the preview program, we'll set you up with a few bits of information:

1. `STATELY_CLIENT_ID` - a client identifier so we know what client you are.
2. `STATELY_CLIENT_SECRET` - a sensitive secret that lets your applications authenticate with the API.
3. A store ID that identifies which store in your organization you're using.
4. A link to more in-depth documentation than this README.

To use the client from NodeJS:

```ts
import { createNodeClient } from "@stately-cloud/client/node";
import { initServerAuth } from "@stately-cloud/client/auth";

// Create a NodeJS client. This will use the environment variables
// STATELY_CLIENT_ID and STATELY_CLIENT_SECRET for your client.
const client = createNodeClient();

// Or, if you don't want to use environment variables:
const client = createNodeClient({
  authTokenProvider: initServerAuth({
    clientID: "my-client-id",
    clientSecret: "my-client-secret", // but please don't actually check this into source 🙏
  }),
});

// Then, create a client for the Data API that talks to a specific store ID:
const dataClient = createDataClient(client, 1221515n);
```

Now, you can call the Data API:

```ts
import { put } from "@stately-cloud/client/data";

await put(dataClient, "/user-1", { name: "Stiley" });
```

## Tree-Shaking

While our JS SDK is currently focused on NodeJS, it's written to have the
minimum impact on bundle size. Here's some info about how and why:

We want to have users "pay" in bundle size for only the things they use.
Ideally down to individual operations - e.g. I don't pay for the code to
serialize/deserialize the PutRequest and PutResponse if I only use Append.
This is typically done with "tree-shaking" which is really just dead-code
elimination of unused imports. What can and can't be "tree-shaken" is really
up to the specifics of different bundlers and minifiers (Webpack, Terser,
etc.) and takes some experience to know. That said, there are some limits to
how much we can tree-shake due to the structure of the code that ts-proto
generates - if we really wanted to do per-method imports, we would have to
generate each method separately, instead of as a single object for the whole
service. To do that we'd really need to take over code generation, even
though we can reuse a fair bit of code from nice-grpc. gRPC-Web (especially
unary) isn't that complicated so this is potentially worth it!

However, there's another mitigating factor, which is that this client should
eventually split into (at least) two - one for NodeJS, intended for use by
backend services, and one for browser clients. The NodeJS client is not
nearly as concerned with tree-shaking (many projects don't even bundle their
NodeJS code!) although it can still be beneficial to startup time and reduce
the amount of code deployed to limited runtimes like AWS Lambda. The NodeJS
client can also use features that aren't available in browsers, like
streaming.

In the meantime, the best we can do is have separate clients for our
major services, so you only get the ones you need. We still require users to
pass these clients into individual functions instead of exposing an object
full of functions - this is bad for discoverability, but gives us a way to
implement more tree-shaking later without forcing everyone to rewrite their
code.

Example:

```ts
const client = createNodeClient({ authTokenProvider });
const dataClient = createDataClient(client, 2135n);
const response = await put(dataClient, key, value);
```

# Developing

## Getting Started

- Install `node`
- Run `corepack enable`
- Run `pnpm install`
- Run `pnpm run build`

## Tests

- `pnpm run tests`

## Coding Standards

We have a `eslint` linter and `prettier` formatter setup in the repo:

- Format with `pnpm format`
- Lint with `pnpm lint`
