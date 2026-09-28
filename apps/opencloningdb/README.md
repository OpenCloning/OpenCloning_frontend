# OpenCloningDB

Frontend for the OpenCloning database. Authentication is pluggable. Set `VITE_OIDC_PROVIDER` to choose the provider. The default is `clerk`.

Only `clerk` and `test` are supported today. Another provider can be added the same way; see [Contributing a provider](#contributing-a-provider).

## Shared flow

`VITE_OIDC_PROVIDER` selects a provider in [`src/auth/oidcConfig.js`](src/auth/oidcConfig.js). An unknown id throws.

Every provider fills [`OidcAuthContext`](src/auth/OidcAuthContext.jsx) with `isLoaded`, `isSignedIn`, `getToken`, and `signOut`. After sign-in, [`useAuthBootstrap`](src/hooks/useAuthBootstrap.js) calls `getToken({ template: 'default' })`, stores the bearer token, and loads `GET /auth/me` plus the first workspace. The API provisions the local user from that token on first use.

## Clerk

This is the default (`yarn workspace opencloningdb dev`). It requires `VITE_CLERK_PUBLISHABLE_KEY`.

`/login` and `/signup` render Clerk's components and redirect to `/sequences`. The session JWT must be a real OIDC token the API can verify, so leave `OIDC_TEST_MODE` off. Local backend claim names in `.env.dev` are `email_address` and `display_name`. The Clerk JWT template passed to `getToken` is `default`.

## Test

`yarn workspace opencloningdb dev:test` sets `VITE_OIDC_PROVIDER=test`. There is no identity provider.

`/login` picks a seeded user from [`src/auth/testUsers.js`](src/auth/testUsers.js). `/signup` builds a token of the form `test:<subject>|<email>|<display name>`. The API must be started with `OIDC_TEST_MODE=1`, or it rejects those tokens.

Cypress groups `opencloningdb1` and `opencloningdb2` use this provider.

## Contributing a provider

Add a module that exports `AuthProvider`, `LoginPage`, and `SignUpPage`. `AuthProvider` must provide `OidcAuthContext` with `isLoaded`, `isSignedIn`, `getToken`, and `signOut`.

Register that trio on the `providers` object in [`src/auth/oidcConfig.js`](src/auth/oidcConfig.js), then select it with `VITE_OIDC_PROVIDER`.

`getToken` must return a bearer token the API accepts: either a verified OIDC JWT for the configured issuer, or a `test:` token when the API is in test mode.
