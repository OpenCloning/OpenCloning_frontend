import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';

/** Assumes a valid token is already on the HTTP client (e.g. after login/register). */
export async function fetchUserAndFirstWorkspace() {
  const { data: user } = await openCloningDBHttpClient.get(endpoints.authMe);
  const { data: workspaces } = await openCloningDBHttpClient.get(endpoints.workspaces);
  return { user, workspace: workspaces[0] };
}
