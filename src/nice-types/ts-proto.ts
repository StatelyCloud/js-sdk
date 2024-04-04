import { MethodDefinition } from "./service-definition.js";

/** Copied from nice-grpc / nice-grpc-web - these types should be in nice-grpc-common */

/* eslint-disable */

export interface TsProtoServiceDefinition {
  name: string;
  fullName: string;
  methods: {
    [method: string]: TsProtoMethodDefinition<any, any>;
  };
}

export interface TsProtoMethodDefinition<Request, Response> {
  name: string;
  requestType: TsProtoMessageType<Request>;
  requestStream: boolean;
  responseType: TsProtoMessageType<Response>;
  responseStream: boolean;
  options: {
    idempotencyLevel?: "IDEMPOTENT" | "NO_SIDE_EFFECTS";
    _unknownFields?: {};
  };
}

export interface TsProtoMessageType<Message> {
  encode: (message: Message) => ProtobufJsWriter;
  decode: (input: Uint8Array) => Message;
  fromPartial?: (object: unknown) => Message;
}

export interface ProtobufJsWriter {
  finish: () => Uint8Array;
}

export type TsProtoMessageIn<Type extends TsProtoMessageType<any>> =
  Type["fromPartial"] extends Function
    ? Parameters<Type["fromPartial"]>[0]
    : Type extends TsProtoMessageType<infer Message>
      ? Message
      : never;

export type FromTsProtoServiceDefinition<Service extends TsProtoServiceDefinition> = {
  [M in keyof Service["methods"]]: FromTsProtoMethodDefinition<Service["methods"][M]>;
};

export type FromTsProtoMethodDefinition<Method> =
  Method extends TsProtoMethodDefinition<infer Request, infer Response>
    ? MethodDefinition<
        TsProtoMessageIn<Method["requestType"]>,
        Request,
        TsProtoMessageIn<Method["responseType"]>,
        Response,
        Method["requestStream"],
        Method["responseStream"]
      >
    : never;
