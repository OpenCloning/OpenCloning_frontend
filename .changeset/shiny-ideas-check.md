---
"@opencloning/ui": minor
---

* Rename `useAlerts` to `useCloningAlerts`, separate alerts in cloning and opencloningdb apps.
* Add `react-query` to avoid managing requests with `useState`/`useEffect`. Going forward, prefer `useMutation` or `useQuery` over manual `useState`/`useEffect` patterns, we will replace them over time.
* Prevent importing the same primer from the database twice (remove it from options in `PrimerDatabaseImportForm`).
* Add `Imported from unknown database` option in `FinishedSource` component, not to fail when `DatabaseSource` is present, but no database is set up.
* Improve placement of app alerts to be within the `OpenCloning` component, not app-wide.
* Fix hiding ancestors.
* Add standalone `SequenceViewer` component.
* Refactor alignment functionality into a separate hook for better reusability into `useSequencingAlignment.js`.
* Add support for loading
