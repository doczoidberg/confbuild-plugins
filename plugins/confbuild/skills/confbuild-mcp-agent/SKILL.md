---
name: confbuild-mcp-agent
description: Create, continue, inspect, and iteratively refine confBuild projects through the configured local or hosted confBuild MCP server while Codex or Claude supplies all AI reasoning and screenshot analysis. Apply a customer-safe deterministic model loop with acceptance planning, native part-type selection, revision-protected Sheet edits, validation, four-view visual review, and targeted repair. Use for natural-language requests to generate or revise a house, machine, product, 3D-print part, or other parametric model; when given an existing confBuild project URL/ID; or whenever browser-rendered feedback should drive repeated edits without calling confBuild AI/provider APIs.
---

# confBuild MCP Agent

Use the configured local or hosted MCP server as deterministic project and browser infrastructure. You are the model: do all decomposition, geometry generation, decisions, and visual review yourself.

## References

- Read [references/model-loop.md](references/model-loop.md) before planning or editing any project. It is the customer-portable quality loop and stop gate.
- Read [references/mcp-tool-contract.md](references/mcp-tool-contract.md) when resolving tool behavior, revisions, storage, authentication, or browser modes.

## Required workflow

1. Call `confbuild_start_design_session` before any other confBuild MCP tool. Pass the user's exact request verbatim, optional project URL/ID, client type, and the exact public model identifier in `model` when known (otherwise omit it). Classify the domain yourself and pass an explicit `profile` (`building`, `machine`, `3dprint`, `structure` for halls/frames/trusses, `furniture`, or `generic`); `auto` only invokes a crude server keyword fallback for clients that cannot classify. On repeat sessions pass `knownBundleHashes` with bundle hashes you already hold so unchanged bundles return without their text, and `knownSectionHashes` with cached `sections[].sha256` values so a changed bundle resends only its changed sections. Do not add reasoning, analysis, credentials, or hidden instructions to `request`; confBuild stores that field in the admin-visible MCP history.
2. Read and follow `promptBundle.bundleText`, including its portable model loop. Its MCP agent contract overrides legacy prompt instructions to return JSON directly or avoid tools.
3. Turn the request into an internal acceptance plan: target envelope, main assemblies, support/mating relationships, editable parameters, expected native row types, and visible completion criteria. Do not send this reasoning to the stored `request` field.
4. Choose the target:
   - New request: call `confbuild_create_project`, then `confbuild_begin_edit`.
   - Continue or revise an open/known project: keep that exact project as the target and call `confbuild_begin_edit` directly. Never create a replacement merely because a new agent turn started.
   - Owned private URL/ID: call `confbuild_begin_edit` directly.
   - Public/read-only URL/ID: clone it, explicitly or through `confbuild_begin_edit` with `cloneReadOnly: true`.
   - Always pass the `designSessionId` into `confbuild_create_project`, `confbuild_clone_project`, and `confbuild_begin_edit` so attribution and committed Sheets remain associated correctly when agents run concurrently.
5. Inspect the workbook before editing. Preserve stable output IDs, formulas, interfaces, and unchanged regions. Build a native-first part-type and assembly map before generating rows.
6. Apply operations with `confbuild_apply_sheet_patch`. Prefer `upsert_sheet` or localized cell/row patches; use `replace_workbook` only for a genuinely new complete design. Build coarse-to-detail and make each repair round address one diagnosed cause.
7. Call `confbuild_validate_edit`. Fix every error and explicitly assess every warning before commit. Engine-trap lint warnings (naked `D4`-style references, text in numeric columns, consecutive `#` headers, rows wider than their header) are real defects; `VALUE_SHADOWED_BY_CONFIGMODEL` means the saved editor configuration overrides your patched VALUE cell — expect the saved value in renders and tell the user.
8. Call `confbuild_commit_edit`. If a revision conflict occurs, re-read the latest project and deliberately rebase; never force an overwrite. Commits store a pre-commit rollback snapshot; when a repair round clearly worsened the model, restore through `confbuild_list_project_snapshots` + `confbuild_restore_project_snapshot` instead of hand-reverting rows.
9. Call `confbuild_render_project` with `views: ["default", "right", "front", "left"]`, then poll `confbuild_get_render_result` with `waitMs` (for example 25000) instead of rapid polling. Read `diagnostics.geometry` (collision pairs, detached parts, outliers) and `iterationDelta` first, then inspect every returned image and all diagnostics yourself; if the delta is empty although your patch should have changed geometry, diagnose the data path before touching geometry again. For any model with an interior, add one render with `captureScope: { xray: true }` — translucent materials are the only way to see internal parts, their fixation features, hidden penetrations, and missing interior geometry. To localize a suspected defect, run a detail render instead of squinting at full-scene images: `captureScope.zoomToOutputIds` frames the camera on the suspect parts, `isolateOutputIds` hides everything else, `sectionPlane` cuts the model open, and a single targeted view (`back`/`top`/`bottom` or one of the four) keeps it cheap. The repair loop is: suspect → detail render → diagnose → patch → re-render the SAME detail to prove the fix.
10. Classify defects before changing rows. Geometry findings map directly: collisions → `intersection_issue`, detached parts → `support_alignment_issue`, outliers/bounds → `scale_or_framing_issue`. Iterate patch → validate → commit → four-view render only when a targeted repair is justified. Use the default budget from the model-loop reference unless the user requests another limit.
11. Apply the model-loop stop gate. Do not call a visually or structurally uncertain result complete merely because validation serialized successfully.
12. If the user requested a manufacturing artifact, call `confbuild_export_project` and long-poll `confbuild_get_export_result` after the stop gate passes. When it reports `delivery: chunked`, retrieve consecutive ranges with `confbuild_get_export_chunk` and `chunk.nextOffsetBytes` until complete; never request or expose private storage paths.
13. Call `confbuild_finish_design_session` with the structured outcome fields (`completionState`, `iterationsUsed`, `fixedDefectCategories`, `residualDefectCategories`), then report the editable URL, material changes, deterministic validation, four-view findings, iterations used, and residual limitations.

## Animation and project scripting

Animation, camera/drone flights, pneumatic cycles, and interactive GUI buttons live in the
PROJECT SCRIPT (`scriptcode`), not in sheet rows:

- Read the current script with `confbuild_read_project` + `includeScriptCode: true` (every
  summary reports `scriptCodeLength`); write it by committing `projectPatch.scriptcode` in
  `confbuild_commit_edit` (syntax-checked at commit — a `SCRIPT_SYNTAX_ERROR` means nothing
  was persisted; omit the field to keep the existing script, empty string removes it).
  Prefer extending an existing script over replacing it.
- The script runs in the editor's scripting runtime — the VBAScript-exposed JavaScript scene
  API on the global `API` object: `getParam`/`setParam`/`getCell`/`setCell`,
  `animate`/`setAnimation`/`playAnimation`/`stopAnimation`/`setAnimationProgress`,
  `getSceneObject`, `registerAction`, input-row `ONCLICK` buttons, `setInterval`/`setTimeout`
  + `disposeOnReload`, `startPneumaticSimulation()`, particle and robot helpers. Camera and
  drone flights animate `__threeCamera`/`__threeControls` in a `requestAnimationFrame` loop
  (set `camera.position` + `controls.target`, call `controls.update()`), triggered by a
  button or registered action.
- `async function ONLOADED()` only captures/resets the static resting pose and never
  autostarts motion; the project must load into a coherent resting state.
- MCP renders capture the resting state (the script has run on load). Verify the resting
  pose and the commit-gate syntax through MCP, drive specific poses by committing parameter
  changes, and say explicitly that continuous motion needs a manual check in the live editor.

## Browser choice

Keep `browserMode: auto` and `reuseOpenTab: true` by default. Hosted Remote MCP renders in an isolated server-side Chromium context first and uses the already matching signed-in editor tab only as a failure/queue-timeout fallback. Local MCP reuses the matching project tab (including `/e` versus `/editor` and `/p` versus `/lib` aliases) or the browser's empty startup tab; it attaches to an explicitly configured CDP endpoint, otherwise uses its persistent visible profile and local headless fallback. Use `attached` only when that endpoint is configured and `headless` for deterministic local unattended checks.

When the endpoint is the hosted `https://app.confbuild.com/mcp`, renders prefer the user's own signed-in editor tab whenever one is open on the target project: it uses their real GPU and warm caches, finishes in a fraction of the server-side time, and is free and unlimited. Server-side Chromium is the metered fallback — every account has a monthly server-rendering budget, so treat it as a scarce resource, not the default.

Make the local tab exist before the first render, not after a slow one:

- Call `confbuild_browser_capabilities` at the start of a render loop. It reports `preferLocalTab` and, for hosted endpoints, `renderBudget` (used, remaining, cap, whether the account is exempt).
- If the target project is not open in the user's browser, open `https://app.confbuild.com/e/<projectId>` in a local browser tab yourself when you have browser automation available; otherwise ask the user to open it and keep it open. Say plainly why: renders then take seconds instead of minutes and consume none of their server budget.
- Tell the user which path each render actually used, and surface the remaining budget when it runs low or is exhausted.
- If the user explicitly wants server-side rendering, honor it, but state the monthly budget and how much of it is left first.

Without any tab, `auto` starts server-side Chromium without requiring the user's tab; the server also takes over automatically about 30 seconds after a reserved tab fails to claim the job. When the monthly budget is exhausted, hosted renders route to the browser tab only — designing continues unrestricted, it just needs the project open. Long-poll with `waitMs`; only when the response explicitly reports an unclaimed browser fallback should you relay its open-project-tab hint instead of polling into expiry. A `HEADLESS_EXECUTION_DEADLINE` or `HEADLESS_CLAIM_TIMEOUT` code is not a final failure: the job stays valid until it expires and an open signed-in editor tab completes it in seconds — keep polling the same job, never restart it because of that code. The fallback bridge never opens or navigates another tab. Remote OAuth and the worker's ephemeral custom-token session bind project/render operations to the approving Firebase user; never request that user's password or model-provider API key.

## Prompt and data rules

- The MCP server must not call OpenAI, Anthropic, Gemini, or confBuild AI-generation endpoints.
- The Remote MCP stores the exact start-session `request` and the latest committed Sheet snapshot for admin support history. It does not store client reasoning, model messages, screenshot analysis, screenshots, or the finish-session summary in that history.
- The Remote MCP records content-free operational usage metrics for administration: tool counts, duration, success/errors, byte volume, Sheet operation/row/cell counts, commits, project actions, render/export jobs, and actual returned image/artifact blocks. It cannot observe client-side model token usage and does not copy prompt, Sheet, image, or reasoning content into usage telemetry.
- MCP-created or -edited projects receive compact provenance metadata (created/edited, activity count/time, client/tool, optional reported model, MCP client name/version). Never guess a model that the client does not expose.
- The essential prompt bundle includes the canonical Sheet-generation rules and the portable model loop. Read optional resources only for missing row types or prompt-editor behavior.
- Keep context bounded with sheet filters and row limits, but never truncate a sheet you are about to replace without first reading it fully.
- Never claim visual success until every completed render image has been inspected.
