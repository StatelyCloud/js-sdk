import { DatabaseService } from "./api/db/service_pb.js";
import { DatabaseClient } from "./database.js";
import { createNodeClient } from "./node.js";
import { type ClientOptions, type ItemTypeMap, type StoreID } from "./types.js";

// re-exports
export { Code } from "@connectrpc/connect";
export { SortableProperty } from "./api/db/item_property_pb.js";
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
 * @param options - Options for the client, like the auth token provider and
 * endpoint.s
 * @example
 * const client = createClient(1221515n, itemTypeMap, { region: "us-west-2" });
 * const item = await client.get("/jedi-luke/equipment-lightsaber");
 * const orderItems = await client.withStoreId(6545212412n).beginList("/orders-454/items").items;
 */
export function createClient<TypeMap extends ItemTypeMap, AllItemTypes extends keyof TypeMap>(
  storeId: StoreID,
  itemTypeMap: TypeMap,
  schemaVersionID: number,
  opts: ClientOptions = {},
): DatabaseClient<TypeMap, AllItemTypes> {
  const clientFactory = createNodeClient(opts);
  return new DatabaseClient(clientFactory(DatabaseService), storeId, itemTypeMap, schemaVersionID);
}
