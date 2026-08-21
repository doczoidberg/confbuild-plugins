# confBuild MCP tool contract

## Shared customer loop

- The installed plugin reads the packaged `references/model-loop.md` snapshot and starts sessions with `workflowSource: 'plugin'`; the server then omits runtime behavioral instructions.
- Direct MCP-only clients receive `references/model-loop.md` inside the server's essential prompt bundle before the canonical Sheet-generation prompt.
- Both paths therefore use the same acceptance, native-part, validation, four-view review, repair, and stop-gate contract, but only an explicit plugin release changes an installed plugin's behavioral workflow.
- Local repository generators, Playwright artifact workflows, service accounts, and subagent requirements are intentionally outside the customer loop.

## State boundaries

- A design session stores request/profile context. In hosted mode, the exact start-session request and latest committed Sheet snapshot are additionally written to admin-only audit history; client reasoning, model messages, screenshot analysis, screenshots, and final free-text summary are excluded.
- An edit session stores a full hydrated workbook and its base storage revision in MCP-server memory.
- Sheet patches are local until `confbuild_commit_edit`.
- Commits use the authenticated owner's private Firestore path and reject a changed base revision.
- Large workbooks use a new generation-specific chunk prefix. The project manifest and its chunks are written atomically; older project-sheet chunks are cleaned afterward.
- Each commit stores the pre-commit workbook as a rollback snapshot in the same embedded-sheet subcollection under a dedicated scope; retention keeps the newest snapshots and prunes the rest after every commit. `snapshot: false` on commit opts out.
- Render jobs are asynchronous so MCP client tool timeouts do not terminate browser work. `confbuild_get_render_result` accepts `waitMs` (max 120 s — pick a value below your client's own tool timeout) and waits server-side. Hosted jobs run in isolated server-side Chromium first; only a failed or unclaimed worker job becomes a signed-in browser-tab fallback and emits the open-tab hint. The hosted claim window is a fixed 10 minutes and is independent of `timeoutMs`, which only budgets the client-side wait.
- Render diagnostics include an approximate geometry audit (BVH-confirmed collision pairs, AABB-suspected overlaps, detached parts, outliers, bounds) and the completed result carries an `iterationDelta` against the previous render of the same project.
- `diagnostics.geometry.intersectionFindings` carries the engine's exact intersection preflight (OBB-SAT/CSG member overlaps) including a concrete fix `suggestion` per pair (which member yields, the exact `trimby=` cell to add). Treat these as first-class repair instructions — they are the same gate the local composite loop uses — and prefer them over re-deriving overlaps from screenshots.
- With the same project open in several tabs, a per-job claim lease makes exactly one tab capture; a tab that dies mid-capture is taken over after its lease expires.
- Edit sessions carry the project's saved configuration state so validation can flag VALUE cells that the editor will override (`VALUE_SHADOWED_BY_CONFIGMODEL`).
- The finish tool stores only content-free outcome enums (completion state, iteration count, fixed/residual defect categories); the free-text summary is never persisted.
- Hosted usage telemetry stores content-free operational measurements only: authenticated user/client IDs, timestamps, tool/status/error code, duration, byte counts, Sheet operation/row/cell quantities, commits, project IDs, render/export jobs, and actual returned image/artifact blocks. Metadata-only screenshot descriptors are not counted as delivered images. Detail events expire after 90 days; daily per-user aggregates remain for trends. Client-side model tokens are not observable.
- MCP project provenance stores created/edited state, timestamps/count, agent client, optional client-reported model, profile, and MCP client name/version. It stores no prompt, Sheet values, screenshots, responses, or reasoning.

## Main tools

| Phase | Tool | Result |
|---|---|---|
| Orient | `confbuild_start_design_session` | Session ID, effective profile, plugin-version status, target/editability, next tool; direct MCP-only callers additionally receive the server prompt bundle |
| Resolve | `confbuild_resolve_project_reference` | Private/public locator without guessed owner paths |
| Create | `confbuild_create_project` | User-owned private project and editor URL |
| Clone | `confbuild_clone_project` | Editable private copy of public/read-only source |
| Inspect | `confbuild_read_project` | Hydrated workbook; filter by `sheetNames`, page with `startRow`/`maxRowsPerSheet` (unknown names error with the available list) |
| Edit | `confbuild_begin_edit` | Edit ID, base revision, workbook (filter with `sheetNames`/`maxRowsPerSheet` or `summaryOnly: true` when you already read it) |
| Patch | `confbuild_apply_sheet_patch` | In-memory workbook operations and immediate validation |
| Gate | `confbuild_validate_edit` | Errors and warnings: structure, formula analysis (parse traps, `,` separators, row-1/beyond-sheet refs, cycles), SHEET:/PROJECT: reference resolution, row-type catalog check with typo suggestions, input MIN/MAX plausibility, engine-trap lint, configmodel shadowing |
| Persist | `confbuild_commit_edit` | Atomic revision-protected save, pre-commit rollback snapshot, new revision. A failed validation returns the errors inline; a skipped snapshot is reported via `snapshotSkippedReason` |
| Recover | `confbuild_list_project_snapshots` | Rollback snapshots of an owned project, newest first |
| Recover | `confbuild_restore_project_snapshot` | Commits a stored snapshot back; the pre-restore state is snapshotted first |
| Render | `confbuild_render_and_wait` | PREFERRED: starts the render and long-polls it in one call; hosted jobs use server-side Chromium and emit an open-tab hint only while the authenticated fallback is unclaimed |
| Render | `confbuild_render_project` | Background job ID only. `views` accepts `default`, `right`, `front`, `left`, `back`, `top`, `bottom`; default is the four-view review set, a single targeted view saves tokens on a re-check |
| Scope | `captureScope` (on both render tools) | `isolateOutputIds` renders only those subtrees (subpart review), `zoomToOutputIds` frames the camera on them (defaults to the isolated parts), `sectionPlane {axis, position, invert}` cuts the model open. Requires a current frontend in the rendering tab; `diagnostics.captureScopeApplied: false` means the capture ran unscoped |
| Review | `confbuild_get_render_result` | Long-pollable (`waitMs`, max 120 s) multi-view image blocks plus scene/browser/geometry diagnostics and an iteration delta |
| Export | `confbuild_export_project` | Starts an export through the app’s own exporters in server-side Chromium with browser-tab fallback: `step` (simple/complex, exact OCCT B-reps where available), `stl`, `glb`, `3mf`, `bom-json`, `bom-csv`. Complex STEP can take minutes on large models |
| Export | `confbuild_get_export_result` | Long-polls the export job; embeds files up to `maxContentBytes` (default 8 MB) and directs larger files to the safe chunk tool without exposing private storage paths |
| Export | `confbuild_get_export_chunk` | Returns up to 4 MB from a completed export at `offsetBytes`; continue with `chunk.nextOffsetBytes` until `chunk.complete` |
| Search | `confbuild_find_rows` | Locates rows by cell content (substring/exact/regex, optional column filter) in an edit session or project — cheaper than reading whole sheets to find one row |
| Resume | `confbuild_list_edit_sessions` | Lists live edit sessions (project, dirty state, commit count, expiry) so a lost `editSessionId` can be recovered instead of abandoning the session |
| Close | `confbuild_finish_design_session` | Final URL, structured content-free outcome, closed local session state |

Profile selection belongs to the MCP client: classify the request yourself and pass an explicit `profile` (`building`, `machine`, `3dprint`, `structure` for halls/frames/trusses, `furniture`, or `generic`). `auto` falls back to a server keyword heuristic intended only for clients that cannot classify. Installed plugins pass `workflowSource: 'plugin'` and receive no prompt bundle. Direct MCP-only clients keep the default `workflowSource: 'server'`; they may pass `knownBundleHashes` on repeat sessions so a matching bundle returns without its text, plus `knownSectionHashes` (the `sections[].sha256` values they cached) so an updated bundle resends only changed sections.

Error results carry machine-readable `structuredContent` with `code`, optional `retryable`, and context (for example the current revision on `REVISION_CONFLICT`, or the available sheet names on `UNKNOWN_SHEET_NAME`). The hosted endpoint rate-limits per user (HTTP 429 with `retry-after`); long-polling with `waitMs` instead of rapid polling stays well inside the limits.

Pass the start tool's `designSessionId` to `confbuild_create_project`, `confbuild_clone_project`, and `confbuild_begin_edit`. Hosted mode retains a latest-session fallback for older clients, but the explicit ID is required for correct association when one user runs concurrent agents. Pass the exact public model identifier to start-session `model` only when it is known; never infer one. Installed plugin skills also pass their bundled `pluginVersion`; the response's `clientPackage` block reports whether that version is current and supplies the host-specific update command when an update exists. Direct MCP-only clients may omit it. The server never silently changes local client files.

## Project scripting and animation

- Animations, camera/drone flights, pneumatic cycles, and interactive buttons live in project `scriptcode`, not Sheet rows. Read it with `confbuild_read_project` plus `includeScriptCode: true`; commit `projectPatch.scriptcode` to change it. Omit that field to preserve the script and use an empty string only to remove it.
- The script uses the editor's global `API`: parameters/cells, object animation, scene-object lookup, registered actions, input-row `ONCLICK`, reload-safe timers, pneumatic simulation, particles, and robot helpers. Camera flights animate `__threeCamera` and `__threeControls` in a cancellable `requestAnimationFrame` loop.
- `async function ONLOADED()` establishes a coherent resting pose and must not auto-start motion. MCP renders prove resting or deliberately committed parameter poses; continuous motion still requires a manual check in the live editor.
- Prefer extending existing scripts and keep output IDs/object names stable. A commit syntax error persists nothing.

## Patch addressing

- `sheetIndex` is zero-based.
- Rows/columns in patch arguments and A1 addresses are one-based.
- Supported operations: replace workbook, upsert/delete/rename/show sheet, set cells, replace/insert/delete rows.
- `replace_rows` without `count` replaces exactly as many existing rows as the replacement has — "replace rows 5–20 with 5 rows" would leave 11 old rows in place. Pass `count` (rows to remove before inserting) whenever the block shrinks or grows, e.g. `startRow: 5, count: 16, rows: [...5 rows]`.
- Row addresses are capped (50 000): a `row: 100000` typo would otherwise silently pad the sheet with empty rows.

## Authentication

The server uses the same normal user email/password path as repository Playwright automation. It reads `CONFBUILD_EMAIL`/`CONFBUILD_PASSWORD`, macOS Keychain service `codex-confbuild-playwright`, or `CONFBUILD_FIREBASE_CUSTOM_TOKEN`. It never returns credentials to the client and never defaults to a Firebase Admin service account.

The hosted Remote MCP uses OAuth authorization code with PKCE S256. Consent occurs in the signed-in confBuild web app; short-lived access tokens, rotating refresh tokens, persistent sessions, project operations, and render jobs stay bound to that Firebase UID. Tools additionally enforce the granted scopes: `mcp` for the protocol/prompt surface, `projects:read` for project/session reads, `projects:write` for mutations, and `render` for render/export jobs and artifact delivery. Starting a render or export requires both `projects:read` and `render`.

## Browser modes

- `attached`: connect to `CONFBUILD_MCP_CDP_URL`; never silently debug an arbitrary browser.
- `headed`: persistent visible Playwright Chromium profile under `output/playwright/confbuild-mcp/browser-profile`.
- `headless`: isolated deterministic fallback.
- `auto`: attached when explicitly configured, then headed, then headless if headed launch fails.
- Local modes use `reuseOpenTab: true` by default: exact project tab, same-project route alias, then empty startup tab. A different project's tab is never repurposed.
- Hosted Remote MCP: private render job completed by an isolated scale-to-zero server-side Chromium worker; after a worker failure or queue timeout, the matching open project in the user's signed-in browser tab may complete it. The fallback bridge never opens or navigates a tab.
