// re-exports
export type { MessageInitShape, Message as ProtobufESMessage } from "@bufbuild/protobuf";
export {
  enumDesc,
  fileDesc,
  messageDesc,
  tsEnum,
  type GenEnum,
  type GenFile,
  type GenMessage,
} from "@bufbuild/protobuf/codegenv2";
export { Code, Transport } from "@connectrpc/connect";
export { SortDirection } from "./api/db/list_pb.js";
export type { ListToken } from "./api/db/list_token_pb.js";
export { accessKeyAuth } from "./auth.js";
export type * from "./database.js";
export { StatelyError } from "./errors.js";
export * from "./keypath.js";
export type {
  ListResult,
  SyncChangedItem,
  SyncDeletedItem,
  SyncReset,
  SyncResult,
  SyncUpdatedItemKeyOutsideListWindow,
} from "./list-result.js";
export { type Transaction, type TransactionResult } from "./transaction.js";
export type * from "./types.js";

import { create } from "@bufbuild/protobuf";
import { DatabaseService } from "./api/db/service_pb.js";
import { DatabaseClient } from "./database.js";
import { Item, ItemInit, type InternalClientOptions, type ItemTypeMap } from "./types.js";

/**
 * Create a new DatabaseClient that allows operations against StatelyDB. This
 * shouldn't be called directly - instead, use the generated `createClient`
 * function from your schema package.
 * @param storeId - The store ID to use for this client - all calls this client
 * is passed into will be targeted to this store.
 * @param itemTypeMap - The item type map for this client, which maps item type
 * names to their protobuf definitions. This comes from the generated schema
 * package.
 * @param schemaVersionID - The schema version ID that was used to generate the
 * itemTypeMap. This is used to ensure that the schema used by the client
 * matches the schema used by the server.
 * @param schemaID - The schema ID that was used to generate the itemTypeMap.
 * This is used to ensure that the schema used by the client is bound
 * to the storeID being used.
 * @private this is used by the generated code and should not be called directly.
 */
export function createClient<
  TypeMap extends ItemTypeMap,
  AllItemTypes extends keyof TypeMap & string,
>({
  storeId,
  itemTypeMap,
  schemaVersionID,
  schemaID,
  clientFactory,
}: InternalClientOptions<TypeMap>): DatabaseClient<TypeMap, AllItemTypes> {
  return new DatabaseClient<TypeMap, AllItemTypes>(
    clientFactory(DatabaseService),
    BigInt(storeId),
    itemTypeMap,
    schemaVersionID,
    schemaID,
  );
}

/**
 * Generate a typed `create` function for the given item type map. This is the
 * same as DatabaseClient.create, but is useful if you need to create items
 * outside of a DatabaseClient context.
 * @param typeMap - The item type map for this client, which maps item type
 * names to their protobuf definitions. This comes from the generated schema
 * package.
 * @private this is used by the generated code and should not be called directly.
 */
export function makeCreateFunction<TypeMap extends ItemTypeMap>(typeMap: TypeMap) {
  return <T extends keyof TypeMap>(typeName: T, init?: ItemInit<TypeMap, T>): Item<TypeMap, T> => {
    const protoObj = create(typeMap[typeName], init);
    return protoObj as Item<TypeMap, T>;
  };
}
