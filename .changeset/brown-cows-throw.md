---
"@opencloning/opencloning-elabftw": patch
"@opencloning/opencloningdb": patch
"opencloningdb": patch
"opencloning": patch
"@opencloning/utils": major
"@opencloning/ui": major
---

Only send the auth token to the backend, and rename the http client APIs.

- `@opencloning/utils`: `@opencloning/utils/httpClients` exports `getBackendHttpClient(backendUrl, { authenticated })`, a client that can only reach the backend (`allowAbsoluteUrls: false`) and is the only one carrying the auth token, and `getExternalHttpClient()` for whitelisted external urls. Replaces `@opencloning/utils/getHttpClient` (`getHttpClient`, `getAuthenticatedHttpClient`). `attachAuthInterceptors` refuses clients that could send the token elsewhere.
- `@opencloning/ui` (breaking): `useHttpClient` is renamed `useBackendHttpClient` and takes urls relative to `backendUrl`; `useBackendRoute` is removed; `useBackendAPI` is renamed `useSourceRequest` and `sendPostRequest` is renamed `sendSourceRequest`.
- `@opencloning/opencloningdb`, `@opencloning/opencloning-elabftw`: clients can no longer be pointed at other hosts.
