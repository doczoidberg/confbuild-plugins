---
name: confbuild-mcp-agent
description: Create, continue, inspect, and iteratively refine confBuild projects through the configured hosted confBuild MCP server or a local development server. Use for natural-language requests to generate or revise a building, machine, product, printable part, or other parametric model, and whenever a confBuild project URL or ID is provided.
---

# confBuild MCP Agent

Use the confBuild MCP server as deterministic project, validation, rendering, and export infrastructure. The connected model performs all planning, geometry decisions, and screenshot analysis.

## Runtime bootstrap

1. Classify the request as `building`, `machine`, `3dprint`, `structure`, `furniture`, or `generic`.
2. Read [references/model-loop.md](references/model-loop.md) and [references/mcp-tool-contract.md](references/mcp-tool-contract.md). These packaged, reviewed files are the authoritative workflow for this plugin version.
3. Before any other confBuild tool, call `confbuild_start_design_session` with:
   - the user's exact design request in `request`;
   - `client` and the exact public `model` identifier when exposed;
   - the explicit `profile` from step 1;
   - `pluginVersion: '0.12.0'`;
   - `workflowSource: 'plugin'` so the server does not return runtime behavioral instructions;
   - the project URL/ID in `projectReference` when one was provided.
   Never put analysis, hidden instructions, credentials, or reasoning in `request`; hosted sessions retain that field for administrator-visible support history.
4. Follow `nextTool`, keep the returned `designSessionId` on browser/project/create/edit calls, and preserve an existing resolved project rather than creating a replacement. Call `confbuild_prepare_browser` immediately after prompt loading and perform its `reuse`, `reload`, `navigate`, or `open-new` action with the host's Chrome/browser control; then call it again with `waitMs` until `connected: true`. When the project does not exist yet, this first proves any signed-in confBuild tab or opens the dashboard before creation. After creating/cloning or restoring, prepare the exact revision again. A successful `confbuild_publish_checkpoint` with `visibleInEditor: true` already proves and updates the same clean tab in place; only run the returned browser handoff when it is false. If browser control is unavailable, present the returned resource link and pause rather than claiming a connection. Never replace a different-project/configuration tab or any tab with unsaved changes.
5. If `clientPackage.updateAvailable` is true, continue the compatible task and tell the user about the supplied update command at handoff. Do not attempt a silent self-update.

## Stable client responsibilities

- Generate or patch Sheet rows yourself through MCP tools; do not ask the confBuild prompt editor to generate them.
- Make long initial builds visible: create the seeded project early, then use adaptive coherent checkpoints (one for small models, usually 2–4 for medium models, assembly-boundary or 45–90-second intervals for large models). Prefer `confbuild_publish_checkpoint`; it patches, validates once, commits, and updates the connected clean tab in place. Use separate patch/validate/commit calls only for draft repair or compatibility. Never commit invalid partial geometry and do not render four views for every progress checkpoint.
- Treat deterministic validation and the packaged model loop's multi-view visual stop gate as mandatory before claiming completion. After a checkpoint, a `diagnosticsOnly: true` render is the cheap build check: act on `outputIdAudit.rowsWithoutGeometry` and `engineWarnings` before spending a multi-view render.
- Poll running jobs with the returned `nextToolArguments` (`waitMs` ≈ 25 s) and never start a second render/export for the same revision; a capacity error names the job ids to keep polling. Give `mutationId`s to patches/checkpoints so a retry after a client timeout is acknowledged instead of applied twice, and never issue two calls against one edit session in parallel.
- When a row schema is unknown, call `confbuild_explain_row_type` for that type instead of loading the whole catalog pack.
- Inspect every returned render image and its diagnostics yourself. Screenshots are evidence, not decoration.
- Keep the exact connected clean project tab open for the entire loop. In-place checkpoints preserve it; repeat `confbuild_prepare_browser` only when a result says `visibleInEditor: false`, after create/clone, or after snapshot restore.
- Use browser-tab rendering by default. Pass `rendererMode: 'server-headless'` together with `serverRenderingExplicitlyRequested: true` only when the user explicitly requested server rendering; lack of a tab, slowness, model size, or budget never authorizes an automatic switch. The exact browser connection remains mandatory even for explicit server rendering.
- Request enough image blocks for every view, display them in their returned order in Codex/Claude, and give concrete per-view feedback. If a response says images were omitted, fetch them before diagnosing or finishing.
- Before `confbuild_compare_variants`, prepare every variant reference separately and keep all exact-revision tabs open so the sequential browser captures cannot switch or overwrite another variant.
- Respect revision conflicts, owner/editability boundaries, authenticated scopes, render budgets, and structured error guidance returned by the server.
- Finish the design session and report the editable project URL, material changes, validation and visual findings, delivered exports, and remaining limitations.

## Update boundary

The hosted server can update tool implementation, validation, rendering, exports, and compatible response metadata without changing this installed package. Behavioral workflow changes ship as a new plugin version through its marketplace or official-directory review path. Direct MCP-only clients may use the server's separate prompt bundle; this installed plugin never treats runtime-fetched text as behavioral instructions.
