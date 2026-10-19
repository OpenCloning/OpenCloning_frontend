---
"@opencloning/utils": minor
"@opencloning/opencloning-elabftw": patch
"@opencloning/opencloningdb": patch
"@opencloning/ui": patch
---

Encode values interpolated into request URL paths to prevent client-side path traversal. A sample UID such as `../workspaces/1/users/5` could make a user's own request hit a different endpoint, e.g. "delete UID" removing a workspace member.

- `@opencloning/utils`: new `encodePathSegment` (`@opencloning/utils/urlUtils`), which applies `encodeURIComponent` and rejects `.` and `..`.
- `@opencloning/opencloningdb`: all path parameters in `endpoints.js` are encoded.
- `@opencloning/opencloning-elabftw`: eLabFTW item and upload paths are encoded.
- `@opencloning/ui`: the `example`, `key` and `template` URL parameters are encoded when loading examples and templates.
