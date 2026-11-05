---
"@opencloning/opencloningdb": minor
"@opencloning/ui": minor
"standalone-app": patch
"syntax-builder": patch
"opencloningdb": patch
---

Assembler: load plasmids from the database and upload the assemblies to it.

- `@opencloning/ui`:
  - The Assembler's plasmid buttons are grouped into a "Load Plasmids" menu (from files, from the local server, from the database).
  - When the database interface provides `GetSequencesInBulkComponent`, plasmids can be loaded by tag or picked, and are used as `DatabaseSource`s. In that case the default plasmids of a syntax are not loaded.
  - When it provides `SubmitCloningStrategiesInBulkComponent`, a new "Upload to DB" button uploads the assemblies with their history, as in the bulk upload of sequences with history.
  - Both are new optional entries of the database interface (see `DummyInterface`).
- `@opencloning/opencloningdb`:
  - Implements `GetSequencesInBulkComponent` and `SubmitCloningStrategiesInBulkComponent`.
  - Exports `TagMultiSelect` (with `allowCreate` and `onCreateError`), `BulkUploadModal`, `BulkUploadPreview` and `CommonTableRow`, moved from the `opencloningdb` app.
- `opencloningdb`:
  - The "Upload sequences with history" button uses `SubmitCloningStrategiesInBulkComponent`. Its validation, submission and conflict messages are now shown in the dialog instead of as alerts.
  - The tag selects no longer drop excluded tags from the shared tags cache.
