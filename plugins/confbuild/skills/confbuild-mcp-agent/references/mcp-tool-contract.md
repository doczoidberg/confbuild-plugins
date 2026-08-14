# confBuild MCP tool contract

## State boundaries

- A design session stores request/profile context. In hosted mode, the exact start-session request and latest committed Sheet snapshot are additionally written to admin-only audit history; client reasoning, model messages, screenshot analysis, screenshots, and final free-text summary are excluded.
- An edit session stores a full hydrated workbook and its base storage revision in MCP-server memory.
- Sheet patches are local until `confbuild_commit_edit`.
- Commits use the authenticated owner's private Firestore path and reject a changed base revision.
- Large workbooks use a new generation-specific chunk prefix. The project manifest and its chunks are written atomically; older project-sheet chunks are cleaned afterward.
- Render jobs are asynchronous so MCP client tool timeouts do not terminate browser work.
- Hosted usage telemetry stores content-free operational measurements only: authenticated user/client IDs, timestamps, tool/status/error code, duration, byte counts, Sheet operation/row/cell quantities, commits, project IDs, render jobs, and returned-image counts. Detail events expire after 90 days; daily per-user aggregates remain for trends. Client-side model tokens are not observable.

## Main tools

| Phase | Tool | Result |
|---|---|---|
| Orient | `confbuild_start_design_session` | Prompt bundle, inferred profile, target/editability, next tool |
| Resolve | `confbuild_resolve_project_reference` | Private/public locator without guessed owner paths |
| Create | `confbuild_create_project` | User-owned private project and editor URL |
| Clone | `confbuild_clone_project` | Editable private copy of public/read-only source |
| Inspect | `confbuild_read_project` | Hydrated workbook, optionally filtered |
| Edit | `confbuild_begin_edit` | Edit ID, base revision, full workbook |
| Patch | `confbuild_apply_sheet_patch` | In-memory workbook operations and immediate validation |
| Gate | `confbuild_validate_edit` | Errors, warnings, row/cell/output counts, serialized size |
| Persist | `confbuild_commit_edit` | Atomic revision-protected save and new revision |
| Render | `confbuild_render_project` | Background job ID |
| Review | `confbuild_get_render_result` | Multi-view image blocks plus scene/browser diagnostics |
| Close | `confbuild_finish_design_session` | Final URL and closed local session state |

Pass the start tool's `designSessionId` to `confbuild_begin_edit`. Hosted mode retains a latest-session fallback for older clients, but the explicit ID is required for correct association when one user runs concurrent agents.

## Patch addressing

- `sheetIndex` is zero-based.
- Rows/columns in patch arguments and A1 addresses are one-based.
- Supported operations: replace workbook, upsert/delete/rename/show sheet, set cells, replace/insert/delete rows.

## Authentication

The server uses the same normal user email/password path as repository Playwright automation. It reads `CONFBUILD_EMAIL`/`CONFBUILD_PASSWORD`, macOS Keychain service `codex-confbuild-playwright`, or `CONFBUILD_FIREBASE_CUSTOM_TOKEN`. It never returns credentials to the client and never defaults to a Firebase Admin service account.

The hosted Remote MCP uses OAuth authorization code with PKCE S256. Consent occurs in the signed-in confBuild web app; short-lived access tokens, rotating refresh tokens, persistent sessions, project operations, and render jobs stay bound to that Firebase UID.

## Browser modes

- `attached`: connect to `CONFBUILD_MCP_CDP_URL`; never silently debug an arbitrary browser.
- `headed`: persistent visible Playwright Chromium profile under `output/playwright/confbuild-mcp/browser-profile`.
- `headless`: isolated deterministic fallback.
- `auto`: attached when explicitly configured, then headed, then headless if headed launch fails.
- Hosted Remote MCP: private render job completed by the matching open project in the user's signed-in browser tab.
