/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CallOptions, ClientError, ClientMiddleware, ClientMiddlewareCall } from "nice-grpc-common";

// Forked from https://github.com/deeplay-io/nice-grpc/blob/master/packages/nice-grpc-client-middleware-devtools/ to work around https://github.com/SafetyCulture/grpc-web-devtools/issues/171
export const devtoolsUnaryLoggingMiddleware: ClientMiddleware =
  async function* devtoolsUnaryLoggingMiddleware<Request, Response>(
    call: ClientMiddlewareCall<Request, Response>,
    options: CallOptions,
  ): AsyncGenerator<Response, Response | void, undefined> {
    // skip streaming calls
    if (call.requestStream || call.responseStream) {
      return yield* call.next(call.request, options);
    }

    // log unary calls
    const { path } = call.method;
    const reqObj = getAsObject(call.request);

    try {
      const result = yield* call.next(call.request, options);
      const resObj = getAsObject(result);
      window.postMessage(
        {
          method: path,
          methodType: "unary",
          request: reqObj,
          response: resObj,
          type: "__GRPCWEB_DEVTOOLS__",
        },
        "*",
      );
      return result;
    } catch (error) {
      if (error instanceof ClientError) {
        window.postMessage(
          {
            error: {
              code: error?.code,
              message: `${error?.message}`,
              name: error?.name,
              stack: error?.stack,
            },
            method: path,
            methodType: "unary",
            request: reqObj,
            type: "__GRPCWEB_DEVTOOLS__",
          },
          "*",
        );
      } else if (error instanceof Error) {
        window.postMessage(
          {
            error: {
              code: 2,
              message: `${error?.message}`,
              name: error?.name,
              stack: error?.stack,
            },
            method: path,
            methodType: "unary",
            request: reqObj,
            type: "__GRPCWEB_DEVTOOLS__",
          },
          "*",
        );
      }

      throw error;
    }
  };

// check whether the given object has toObject() method and return the object
// otherwise return the object itself
function getAsObject(obj: any): any {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? v.toString() : v)));
}
