/* eslint-disable */
import type { CallContext, CallOptions } from "nice-grpc-common";
import {
  AddUsersToOrganizationRequest,
  AddUsersToOrganizationResponse,
} from "./add-users-to-organization.pb.js";
import { CreateOrganizationRequest, CreateOrganizationResponse } from "./create-organization.pb.js";
import { CreateProjectRequest, CreateProjectResponse } from "./create-project.pb.js";
import { DeleteOrganizationRequest, DeleteOrganizationResponse } from "./delete-organization.pb.js";
import { DeleteProjectRequest, DeleteProjectResponse } from "./delete-project.pb.js";
import {
  EnrollMachineUserRequest,
  EnrollMachineUserResponse,
  EnrollRequest,
  EnrollResponse,
} from "./enroll.pb.js";
import { GetCallerIdentityRequest, GetCallerIdentityResponse } from "./get-caller-identity.pb.js";
import {
  ListAllOrganizationsRequest,
  ListAllOrganizationsResponse,
} from "./list-all-organizations.pb.js";
import {
  RemoveUsersFromOrganizationRequest,
  RemoveUsersFromOrganizationResponse,
} from "./remove-users-from-organization.pb.js";
import { WhoamiRequest, WhoamiResponse } from "./whoami.pb.js";

/** User service is used to manage users, organizations, teams, projects, etc. */
export type UserDefinition = typeof UserDefinition;
export const UserDefinition = {
  name: "User",
  fullName: "stately.User",
  methods: {
    /**
     * Whoami returns information about the user that calls it (based on the auth
     * token). This includes information about what organizations the user belongs
     * to, what projects they have access to, what roles(?) they can use, etc.
     * This is meant to be called from the Web Console or CLI in order to populate
     * some basic information in the UI and allow calling other APIs like
     * ListStores. It will return a NotFound error if the user does not exist -
     * you can call Enroll to create the user and then try again.
     */
    whoami: {
      name: "Whoami",
      requestType: WhoamiRequest,
      requestStream: false,
      responseType: WhoamiResponse,
      responseStream: false,
      options: { idempotencyLevel: "NO_SIDE_EFFECTS" },
    },
    /**
     * GetCallerIdentity returns the Stately UserID of the caller.
     * This simple API is meant for testing execution environments to ensure that the
     * client is correctly authenticated.
     * If the caller is not enrolled in Stately then NotFound will be returned.
     */
    getCallerIdentity: {
      name: "GetCallerIdentity",
      requestType: GetCallerIdentityRequest,
      requestStream: false,
      responseType: GetCallerIdentityResponse,
      responseStream: false,
      options: { idempotencyLevel: "NO_SIDE_EFFECTS" },
    },
    /**
     * Enroll bootstraps a new User given a service principal ID from an auth
     * provider. This includes creating a user record for them, and a default
     * organization, project, and store for them to use. User information is
     * automatically read from the auth token.
     */
    enroll: {
      name: "Enroll",
      requestType: EnrollRequest,
      requestStream: false,
      responseType: EnrollResponse,
      responseStream: false,
      options: { idempotencyLevel: "IDEMPOTENT" },
    },
    /**
     * EnrollMachineUser bootstraps a new machine user principal ID from an auth
     * provider and enrolls them in the organization ID which was passed in the
     * request. Once a machine user has been enrolled in one organization, it
     * cannot be in any other organization unless it is removed from the first
     * one. ** THIS IS AN ADMIN ONLY API **
     */
    enrollMachineUser: {
      name: "EnrollMachineUser",
      requestType: EnrollMachineUserRequest,
      requestStream: false,
      responseType: EnrollMachineUserResponse,
      responseStream: false,
      options: { idempotencyLevel: "IDEMPOTENT" },
    },
    /**
     * CreateProject makes a new project within an organization. It will fail if
     * the project already exists or you don't have permission to create projects
     * in that organization.
     */
    createProject: {
      name: "CreateProject",
      requestType: CreateProjectRequest,
      requestStream: false,
      responseType: CreateProjectResponse,
      responseStream: false,
      options: {},
    },
    /**
     * DeleteProject schedules a project to be deleted, including all data within it.
     * This operation takes some time so it returns a handle to an operation that
     * you can check to see if it is complete. This will fail if the project does
     * not exist, if the project is already being deleted, or if you do not have
     * permission to delete project.
     */
    deleteProject: {
      name: "DeleteProject",
      requestType: DeleteProjectRequest,
      requestStream: false,
      responseType: DeleteProjectResponse,
      responseStream: false,
      options: { idempotencyLevel: "IDEMPOTENT" },
    },
    /**
     * CreateOrganization makes a new organization, optionally including the
     * current user as a member. It will fail if you don't have permission to
     * create organizations. Note that it is currently possible to create multiple
     * orgs with the same name.
     */
    createOrganization: {
      name: "CreateOrganization",
      requestType: CreateOrganizationRequest,
      requestStream: false,
      responseType: CreateOrganizationResponse,
      responseStream: false,
      options: {},
    },
    /**
     * ListAllOrganizations lists all the organizations registered with Stately.
     * It will fail if you don't have permission to list all organizations (only
     * admins have this). This includes information about all the members and
     * resources in each organization.
     */
    listAllOrganizations: {
      name: "ListAllOrganizations",
      requestType: ListAllOrganizationsRequest,
      requestStream: false,
      responseType: ListAllOrganizationsResponse,
      responseStream: false,
      options: { idempotencyLevel: "NO_SIDE_EFFECTS" },
    },
    /**
     * DeleteOrganization deletes an organization, including all data within it.
     * This will fail if the organization does not exist, or if you do not have
     * permission to delete the organization. It is safe to retry this operation.
     */
    deleteOrganization: {
      name: "DeleteOrganization",
      requestType: DeleteOrganizationRequest,
      requestStream: false,
      responseType: DeleteOrganizationResponse,
      responseStream: false,
      options: { idempotencyLevel: "IDEMPOTENT" },
    },
    /**
     * AddUsersToOrganization adds users to an organization. This will fail if the
     * organization does not exist, or if you do not have permission to update the
     * organization. It is a noop if the user is already in the organization.
     */
    addUsersToOrganization: {
      name: "AddUsersToOrganization",
      requestType: AddUsersToOrganizationRequest,
      requestStream: false,
      responseType: AddUsersToOrganizationResponse,
      responseStream: false,
      options: { idempotencyLevel: "IDEMPOTENT" },
    },
    /**
     * RemoveUsersFromOrganization removes users from an organization. This will
     * fail if the organization does not exist, or if you do not have permission
     * to update the organization. It is a noop if the user is not in the
     * organization.
     */
    removeUsersFromOrganization: {
      name: "RemoveUsersFromOrganization",
      requestType: RemoveUsersFromOrganizationRequest,
      requestStream: false,
      responseType: RemoveUsersFromOrganizationResponse,
      responseStream: false,
      options: { idempotencyLevel: "IDEMPOTENT" },
    },
  },
} as const;

export interface UserServiceImplementation<CallContextExt = {}> {
  /**
   * Whoami returns information about the user that calls it (based on the auth
   * token). This includes information about what organizations the user belongs
   * to, what projects they have access to, what roles(?) they can use, etc.
   * This is meant to be called from the Web Console or CLI in order to populate
   * some basic information in the UI and allow calling other APIs like
   * ListStores. It will return a NotFound error if the user does not exist -
   * you can call Enroll to create the user and then try again.
   */
  whoami(request: WhoamiRequest, context: CallContext & CallContextExt): Promise<WhoamiResponse>;
  /**
   * GetCallerIdentity returns the Stately UserID of the caller.
   * This simple API is meant for testing execution environments to ensure that the
   * client is correctly authenticated.
   * If the caller is not enrolled in Stately then NotFound will be returned.
   */
  getCallerIdentity(
    request: GetCallerIdentityRequest,
    context: CallContext & CallContextExt,
  ): Promise<GetCallerIdentityResponse>;
  /**
   * Enroll bootstraps a new User given a service principal ID from an auth
   * provider. This includes creating a user record for them, and a default
   * organization, project, and store for them to use. User information is
   * automatically read from the auth token.
   */
  enroll(request: EnrollRequest, context: CallContext & CallContextExt): Promise<EnrollResponse>;
  /**
   * EnrollMachineUser bootstraps a new machine user principal ID from an auth
   * provider and enrolls them in the organization ID which was passed in the
   * request. Once a machine user has been enrolled in one organization, it
   * cannot be in any other organization unless it is removed from the first
   * one. ** THIS IS AN ADMIN ONLY API **
   */
  enrollMachineUser(
    request: EnrollMachineUserRequest,
    context: CallContext & CallContextExt,
  ): Promise<EnrollMachineUserResponse>;
  /**
   * CreateProject makes a new project within an organization. It will fail if
   * the project already exists or you don't have permission to create projects
   * in that organization.
   */
  createProject(
    request: CreateProjectRequest,
    context: CallContext & CallContextExt,
  ): Promise<CreateProjectResponse>;
  /**
   * DeleteProject schedules a project to be deleted, including all data within it.
   * This operation takes some time so it returns a handle to an operation that
   * you can check to see if it is complete. This will fail if the project does
   * not exist, if the project is already being deleted, or if you do not have
   * permission to delete project.
   */
  deleteProject(
    request: DeleteProjectRequest,
    context: CallContext & CallContextExt,
  ): Promise<DeleteProjectResponse>;
  /**
   * CreateOrganization makes a new organization, optionally including the
   * current user as a member. It will fail if you don't have permission to
   * create organizations. Note that it is currently possible to create multiple
   * orgs with the same name.
   */
  createOrganization(
    request: CreateOrganizationRequest,
    context: CallContext & CallContextExt,
  ): Promise<CreateOrganizationResponse>;
  /**
   * ListAllOrganizations lists all the organizations registered with Stately.
   * It will fail if you don't have permission to list all organizations (only
   * admins have this). This includes information about all the members and
   * resources in each organization.
   */
  listAllOrganizations(
    request: ListAllOrganizationsRequest,
    context: CallContext & CallContextExt,
  ): Promise<ListAllOrganizationsResponse>;
  /**
   * DeleteOrganization deletes an organization, including all data within it.
   * This will fail if the organization does not exist, or if you do not have
   * permission to delete the organization. It is safe to retry this operation.
   */
  deleteOrganization(
    request: DeleteOrganizationRequest,
    context: CallContext & CallContextExt,
  ): Promise<DeleteOrganizationResponse>;
  /**
   * AddUsersToOrganization adds users to an organization. This will fail if the
   * organization does not exist, or if you do not have permission to update the
   * organization. It is a noop if the user is already in the organization.
   */
  addUsersToOrganization(
    request: AddUsersToOrganizationRequest,
    context: CallContext & CallContextExt,
  ): Promise<AddUsersToOrganizationResponse>;
  /**
   * RemoveUsersFromOrganization removes users from an organization. This will
   * fail if the organization does not exist, or if you do not have permission
   * to update the organization. It is a noop if the user is not in the
   * organization.
   */
  removeUsersFromOrganization(
    request: RemoveUsersFromOrganizationRequest,
    context: CallContext & CallContextExt,
  ): Promise<RemoveUsersFromOrganizationResponse>;
}

export interface UserClient<CallOptionsExt = {}> {
  /**
   * Whoami returns information about the user that calls it (based on the auth
   * token). This includes information about what organizations the user belongs
   * to, what projects they have access to, what roles(?) they can use, etc.
   * This is meant to be called from the Web Console or CLI in order to populate
   * some basic information in the UI and allow calling other APIs like
   * ListStores. It will return a NotFound error if the user does not exist -
   * you can call Enroll to create the user and then try again.
   */
  whoami(request: WhoamiRequest, options?: CallOptions & CallOptionsExt): Promise<WhoamiResponse>;
  /**
   * GetCallerIdentity returns the Stately UserID of the caller.
   * This simple API is meant for testing execution environments to ensure that the
   * client is correctly authenticated.
   * If the caller is not enrolled in Stately then NotFound will be returned.
   */
  getCallerIdentity(
    request: GetCallerIdentityRequest,
    options?: CallOptions & CallOptionsExt,
  ): Promise<GetCallerIdentityResponse>;
  /**
   * Enroll bootstraps a new User given a service principal ID from an auth
   * provider. This includes creating a user record for them, and a default
   * organization, project, and store for them to use. User information is
   * automatically read from the auth token.
   */
  enroll(request: EnrollRequest, options?: CallOptions & CallOptionsExt): Promise<EnrollResponse>;
  /**
   * EnrollMachineUser bootstraps a new machine user principal ID from an auth
   * provider and enrolls them in the organization ID which was passed in the
   * request. Once a machine user has been enrolled in one organization, it
   * cannot be in any other organization unless it is removed from the first
   * one. ** THIS IS AN ADMIN ONLY API **
   */
  enrollMachineUser(
    request: EnrollMachineUserRequest,
    options?: CallOptions & CallOptionsExt,
  ): Promise<EnrollMachineUserResponse>;
  /**
   * CreateProject makes a new project within an organization. It will fail if
   * the project already exists or you don't have permission to create projects
   * in that organization.
   */
  createProject(
    request: CreateProjectRequest,
    options?: CallOptions & CallOptionsExt,
  ): Promise<CreateProjectResponse>;
  /**
   * DeleteProject schedules a project to be deleted, including all data within it.
   * This operation takes some time so it returns a handle to an operation that
   * you can check to see if it is complete. This will fail if the project does
   * not exist, if the project is already being deleted, or if you do not have
   * permission to delete project.
   */
  deleteProject(
    request: DeleteProjectRequest,
    options?: CallOptions & CallOptionsExt,
  ): Promise<DeleteProjectResponse>;
  /**
   * CreateOrganization makes a new organization, optionally including the
   * current user as a member. It will fail if you don't have permission to
   * create organizations. Note that it is currently possible to create multiple
   * orgs with the same name.
   */
  createOrganization(
    request: CreateOrganizationRequest,
    options?: CallOptions & CallOptionsExt,
  ): Promise<CreateOrganizationResponse>;
  /**
   * ListAllOrganizations lists all the organizations registered with Stately.
   * It will fail if you don't have permission to list all organizations (only
   * admins have this). This includes information about all the members and
   * resources in each organization.
   */
  listAllOrganizations(
    request: ListAllOrganizationsRequest,
    options?: CallOptions & CallOptionsExt,
  ): Promise<ListAllOrganizationsResponse>;
  /**
   * DeleteOrganization deletes an organization, including all data within it.
   * This will fail if the organization does not exist, or if you do not have
   * permission to delete the organization. It is safe to retry this operation.
   */
  deleteOrganization(
    request: DeleteOrganizationRequest,
    options?: CallOptions & CallOptionsExt,
  ): Promise<DeleteOrganizationResponse>;
  /**
   * AddUsersToOrganization adds users to an organization. This will fail if the
   * organization does not exist, or if you do not have permission to update the
   * organization. It is a noop if the user is already in the organization.
   */
  addUsersToOrganization(
    request: AddUsersToOrganizationRequest,
    options?: CallOptions & CallOptionsExt,
  ): Promise<AddUsersToOrganizationResponse>;
  /**
   * RemoveUsersFromOrganization removes users from an organization. This will
   * fail if the organization does not exist, or if you do not have permission
   * to update the organization. It is a noop if the user is not in the
   * organization.
   */
  removeUsersFromOrganization(
    request: RemoveUsersFromOrganizationRequest,
    options?: CallOptions & CallOptionsExt,
  ): Promise<RemoveUsersFromOrganizationResponse>;
}
