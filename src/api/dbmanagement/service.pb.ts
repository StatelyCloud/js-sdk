/* eslint-disable */
import type { CallContext, CallOptions } from "nice-grpc-common";
import { CreateStoreRequest, CreateStoreResponse } from "./create-store.pb.js";
import { DeleteStoreRequest, DeleteStoreResponse } from "./delete-store.pb.js";

/**
 * The DB Management service is used to read info about, provision, and delete
 * Stores, which are our top level container for data. In general, customers
 * will not interact with this service, as they get a default store created for
 * them per project. However, it is useful for clients to discover Store IDs,
 * and for us to be able to create and destroy stores for testing.
 */
export type ManagementDefinition = typeof ManagementDefinition;
export const ManagementDefinition = {
  name: "Management",
  fullName: "stately.Management",
  methods: {
    /**
     * CreateStore makes a new store within your project. It will fail if you
     * don't have permission to create stores in that project.
     */
    createStore: {
      name: "CreateStore",
      requestType: CreateStoreRequest,
      requestStream: false,
      responseType: CreateStoreResponse,
      responseStream: false,
      options: {},
    },
    /**
     * DeleteStore schedules a store to be deleted, including all data within it.
     * This operation takes some time so it returns a handle to an operation that
     * you can check to see if it is complete. This will fail if the store does
     * not exist, if the store is already being deleted, or if you do not have
     * permission to delete stores.
     */
    deleteStore: {
      name: "DeleteStore",
      requestType: DeleteStoreRequest,
      requestStream: false,
      responseType: DeleteStoreResponse,
      responseStream: false,
      options: { idempotencyLevel: "IDEMPOTENT" },
    },
  },
} as const;

export interface ManagementServiceImplementation<CallContextExt = {}> {
  /**
   * CreateStore makes a new store within your project. It will fail if you
   * don't have permission to create stores in that project.
   */
  createStore(
    request: CreateStoreRequest,
    context: CallContext & CallContextExt,
  ): Promise<CreateStoreResponse>;
  /**
   * DeleteStore schedules a store to be deleted, including all data within it.
   * This operation takes some time so it returns a handle to an operation that
   * you can check to see if it is complete. This will fail if the store does
   * not exist, if the store is already being deleted, or if you do not have
   * permission to delete stores.
   */
  deleteStore(
    request: DeleteStoreRequest,
    context: CallContext & CallContextExt,
  ): Promise<DeleteStoreResponse>;
}

export interface ManagementClient<CallOptionsExt = {}> {
  /**
   * CreateStore makes a new store within your project. It will fail if you
   * don't have permission to create stores in that project.
   */
  createStore(
    request: CreateStoreRequest,
    options?: CallOptions & CallOptionsExt,
  ): Promise<CreateStoreResponse>;
  /**
   * DeleteStore schedules a store to be deleted, including all data within it.
   * This operation takes some time so it returns a handle to an operation that
   * you can check to see if it is complete. This will fail if the store does
   * not exist, if the store is already being deleted, or if you do not have
   * permission to delete stores.
   */
  deleteStore(
    request: DeleteStoreRequest,
    options?: CallOptions & CallOptionsExt,
  ): Promise<DeleteStoreResponse>;
}
