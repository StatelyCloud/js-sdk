import { ManagementDefinition } from "./api/dbmanagement/service.pb.js";
import { Client, ProjectID, ServiceClient, StoreID } from "./index.js";

// re-exports
export type { StoreInfo } from "./api/dbmanagement/store-info.pb.js";

/**
 * ManagementClient holds the configuration for talking to the StatelyDB Management API,
 * which is used to read and modify stores in your account. It should be passed
 * to the various service methods exported from this module.
 */
export type ManagementClient = ServiceClient<ManagementDefinition>;

/**
 * Create a new ManagementClient that holds the configuration for talking to the
 * StatelyDB Management API, which is used to read and modify resources in your
 * account. It should be passed to the various service methods exported from
 * this module.
 * @param client - A Stately Client created by `createClient`.
 * @example
 * const client = createNodeClient({ authTokenProvider });
 * const managementClient = createManagementClient(client);
 * const store = await describeStoreById(managementClient, 12415136);
 */
export function createManagementClient(client: Client): ManagementClient {
  return client.create(ManagementDefinition);
}

/**
 * CreateStore makes a new store within your project. It will fail if the
 * store already exists or you don't have permission to create stores in that
 * project.
 * @param client - A {@linkcode ManagementClient} created by {@linkcode createManagementClient}.
 * @param projectId - The ID of the project to create the store in.
 * @param name - The human-readable name of the store.
 * @param description - A description of the store.
 */
export async function createStore(
  client: ManagementClient,
  projectId: ProjectID,
  name: string,
  description: string,
): Promise<{ storeId: StoreID }> {
  const response = await client._client.createStore(
    { projectId, name, description },
    client.callOptions,
  );
  return response;
}

/**
 * DeleteStore schedules a store to be deleted, including all data within it.
 * This operation takes some time so it returns a handle to an operation that
 * you can check to see if it is complete. This will fail if the store does
 * not exist, if the store is already being deleted, or if you do not have
 * permission to delete stores.
 * @param client - A {@linkcode ManagementClient} created by {@linkcode createManagementClient}.
 * @param storeId - The ID of the store to delete.
 */
export async function deleteStore(client: ManagementClient, storeId: StoreID) {
  await client._client.deleteStore({ storeId }, client.callOptions);
}
