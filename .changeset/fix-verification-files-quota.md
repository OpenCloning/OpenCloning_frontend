---
"@opencloning/utils": patch
"@opencloning/store": patch
"@opencloning/ui": patch
---

Fix QuotaExceededError when adding more than ~10 AB1/sequencing files (OpenCloning/OpenCloning#82). The raw contents of the verification files used to be persisted in Web Storage (localStorage, later sessionStorage), which has a quota of ~5 MB, so submitting around 10+ AB1 files failed with `QuotaExceededError` and the files/alignments disappeared. The contents are now kept in an in-memory store for the duration of the tab session, which has no quota.
