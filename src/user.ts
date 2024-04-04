import { ClientError, Status } from "nice-grpc-common";
import { ListOrganizationsEntry } from "./api/user/list-all-organizations.pb.js";
import { UserDefinition } from "./api/user/service.pb.js";
import { WhoamiResponse } from "./api/user/whoami.pb.js";
import { Client, OrganizationID, ProjectID, ServiceClient, UserID } from "./index.js";

export { ListOrganizationsEntry } from "./api/user/list-all-organizations.pb.js";
export { MinimalUserInfo } from "./api/user/user.pb.js";
export { OrganizationNode, ProjectNode, StoreNode, WhoamiResponse } from "./api/user/whoami.pb.js";

/**
 * UserClient holds the configuration for talking to the Stately User API, which
 * is used to read and modify information about users, organizations, projects,
 * etc. It should be passed to the various service methods exported from this
 * module.
 */
export type UserClient = ServiceClient<UserDefinition>;

/**
 * Create a new UserClient that holds the configuration for talking to the
 * Stately User API, which is used to read and modify information about users,
 * organizations, projects, etc. It should be passed to the various service
 * methods exported from this module.
 * @param client - A Stately Client created by `createClient`.
 * @example
 * const client = createNodeClient({ authTokenProvider });
 * const userClient = createUserClient(client);
 * const me = await whoami(userClient);
 */
export function createUserClient(client: Client): UserClient {
  return {
    ...client.create(UserDefinition),
    callOptions: {
      // Default to 30s timeout because enrollment creates a dynamoDB
      // table which can be really slow
      deadline: 30000,
    },
  };
}

/**
 * Whoami returns information about the user that calls it (based on the auth
 * token). This includes information about what organizations the user
 * belongs to, what projects they have access to, what roles(?) they can use,
 * etc. This is meant to be called from the Web Console or CLI in order to
 * populate some basic information in the UI and allow calling other APIs like
 * ListStores.
 * @param client - A {@linkcode UserClient} created by {@linkcode createUserClient}.
 */
export async function whoami(client: UserClient): Promise<WhoamiResponse> {
  return client._client.whoami({}, client.callOptions);
}

/**
 * Enroll bootstraps a new User given a service principal ID from an auth
 * provider. This includes creating a user record for them, and a default
 * organization, project, and store for them to use. User information is
 * automatically read from the auth token.
 * @param client - A {@linkcode UserClient} created by {@linkcode createUserClient}.
 * @private
 */
export async function enroll(client: UserClient): Promise<void> {
  try {
    await client._client.enroll({}, client.callOptions);
  } catch (e) {
    // if we got AlreadyExists thats fine as well. just return
    if (e instanceof ClientError && e.code === Status.ALREADY_EXISTS) {
      return;
    }
    throw e;
  }
}

/**
 * EnrollMachineUser bootstraps a new machine user principal ID from an auth
 * provider and enrolls them in the organization ID which was passed in the
 * request. Once a machine user has been enrolled in one organization, it
 * cannot be in any other organization unless it is removed from the first
 * one. ** THIS IS AN ADMIN ONLY API **
 */
export async function enrollMachineUser(
  client: UserClient,
  organizationId: OrganizationID,
  clientId: string,
  displayName: string,
): Promise<void> {
  if (clientId.endsWith("@clients")) {
    throw new Error("Pass the client ID, not the subject");
  }
  try {
    await client._client.enrollMachineUser(
      {
        organizationId,
        oAuthSubject: `${clientId}@clients`,
        displayName,
      },
      client.callOptions,
    );
  } catch (e) {
    // if we got AlreadyExists thats fine as well. just return
    if (e instanceof ClientError && e.code === Status.ALREADY_EXISTS) {
      return;
    }
    throw e;
  }
}

/**
 * CreateProject makes a new project within your organization. It will fail if
 * the project already exists or you don't have permission to create projects
 * in that organization.
 */
export async function createProject(
  client: UserClient,
  parentOrganizationId: OrganizationID,
  name: string,
  description: string,
): Promise<ProjectID> {
  const result = await client._client.createProject(
    {
      organizationId: parentOrganizationId,
      name,
      description,
    },
    client.callOptions,
  );
  return result.projectId;
}

/**
 * DeleteProject schedules a project to be deleted, including all data within it.
 * This operation takes some time so it returns a handle to an operation that
 * you can check to see if it is complete. This will fail if the project does
 * not exist, if the project is already being deleted, or if you do not have
 * permission to delete project.
 */
export async function deleteProject(client: UserClient, projectId: ProjectID): Promise<void> {
  await client._client.deleteProject(
    {
      projectId,
    },
    client.callOptions,
  );
}

/**
 * listAllOrganizations lists all the organizations registered with Stately.
 * It will fail if you don't have permission to list all organizations (only
 * admins have this).
 */
export async function listAllOrganizations(client: UserClient): Promise<ListOrganizationsEntry[]> {
  return (await client._client.listAllOrganizations({}, client.callOptions)).organizations;
}

/**
 * CreateOrganization makes a new organization, optionally including the
 * current user as a member. It will fail if you don't have permission to
 * create organizations. Note that it is currently possible to create multiple
 * orgs with the same name.
 */
export async function createOrganization(
  client: UserClient,
  name: string,
  includeCurrentUser = true,
): Promise<void> {
  await client._client.createOrganization(
    { name, doNotAddCurrentUser: !includeCurrentUser },
    client.callOptions,
  );
}

/**
 * addUserToOrganization adds a user to an organization. This will fail if the
 * organization does not exist, or if you do not have permission to update the
 * organization. It is a noop if the user is already in the organization.
 */
export async function addUserToOrganization(
  client: UserClient,
  organizationId: OrganizationID,
  userId: UserID,
): Promise<void> {
  await client._client.addUsersToOrganization(
    { organizationId, userIds: [userId] },
    client.callOptions,
  );
}

/**
 * removeUserFromOrganization removes a user from an organization. This will
 * fail if the organization does not exist, or if you do not have permission to
 * update the organization. It is a noop if the user is not already in the
 * organization.
 */
export async function removeUserFromOrganization(
  client: UserClient,
  organizationId: OrganizationID,
  userId: UserID,
): Promise<void> {
  await client._client.removeUsersFromOrganization(
    { organizationId, userIds: [userId] },
    client.callOptions,
  );
}
