import { FromTsProtoServiceDefinition, TsProtoServiceDefinition } from "./ts-proto.js";

/** Copied from nice-grpc / nice-grpc-web but with the grpc-js types removed - these types should be in nice-grpc-common */

/**
 * A nice-grpc service definition.
 */
export interface ServiceDefinition {
  [method: string]: AnyMethodDefinition;
}

/**
 * A nice-grpc method definition.
 */
export interface MethodDefinition<
  RequestIn,
  RequestOut,
  ResponseIn,
  ResponseOut,
  RequestStream extends boolean = boolean,
  ResponseStream extends boolean = boolean,
> {
  path: string;
  requestStream: RequestStream;
  responseStream: ResponseStream;
  requestSerialize: (value: RequestIn) => Uint8Array;
  requestDeserialize: (bytes: Uint8Array) => RequestOut;
  responseSerialize: (value: ResponseIn) => Uint8Array;
  responseDeserialize: (bytes: Uint8Array) => ResponseOut;
  options: {
    idempotencyLevel?: "IDEMPOTENT" | "NO_SIDE_EFFECTS";
  };
}

/**
 * A nice-grpc method definition with any request and response types.
 */
export type AnyMethodDefinition = MethodDefinition<any, any, any, any>;

/**
 * A service definition that can be converted to a nice-grpc service definition
 * i.e. a nice-grpc service definition, a grpc-js service definition or a
 * ts-proto service definition.
 */
export type CompatServiceDefinition = ServiceDefinition | TsProtoServiceDefinition;

/**
 * A nice-grpc service definition converted from a CompatServiceDefinition.
 */
export type NormalizedServiceDefinition<Service extends CompatServiceDefinition> =
  Service extends ServiceDefinition
    ? Service
    : Service extends TsProtoServiceDefinition
      ? FromTsProtoServiceDefinition<Service>
      : never;

export type MethodRequestIn<Definition extends MethodDefinition<any, any, any, any>> =
  Definition extends MethodDefinition<infer T, any, any, any> ? T : never;
export type MethodRequestOut<Definition extends MethodDefinition<any, any, any, any>> =
  Definition extends MethodDefinition<any, infer T, any, any> ? T : never;
export type MethodResponseIn<Definition extends MethodDefinition<any, any, any, any>> =
  Definition extends MethodDefinition<any, any, infer T, any> ? T : never;
export type MethodResponseOut<Definition extends MethodDefinition<any, any, any, any>> =
  Definition extends MethodDefinition<any, any, any, infer T> ? T : never;
