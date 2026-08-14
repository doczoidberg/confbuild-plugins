---
name: confbuild-mcp-agent
description: Create, continue, inspect, and iteratively refine confBuild projects through the configured local or hosted confBuild MCP server while Codex or Claude supplies all AI reasoning and screenshot analysis. Use for natural-language requests to generate a house, machine, product, 3D-print part, or other parametric model; when given an existing confBuild project URL/ID; or whenever browser-rendered visual feedback must drive repeated Sheet-data edits without calling confBuild AI/provider APIs.
---

# confBuild MCP Agent

Use the configured local or hosted MCP server as deterministic project and browser infrastructure. You are the model: do all decomposition, geometry generation, decisions, and visual review yourself.

## Required loop

1. Call `confbuild_start_design_session` before any other confBuild MCP tool. Pass the user's exact request verbatim, optional project URL/ID, client type, and `profile: auto` unless the domain is explicit. Do not add reasoning, analysis, credentials, or hidden instructions to `request`; confBuild stores that field in the admin-visible MCP history.
2. Read and follow `promptBundle.bundleText`. Its MCP agent contract overrides legacy prompt instructions to return JSON directly or avoid tools.
3. Choose the target:
   - New request: call `confbuild_create_project`, then `confbuild_begin_edit`.
   - Owned private URL/ID: call `confbuild_begin_edit` directly.
   - Public/read-only URL/ID: clone it, explicitly or through `confbuild_begin_edit` with `cloneReadOnly: true`.
   - Always pass the `designSessionId` returned by step 1 into `confbuild_begin_edit` so prompts and committed Sheets remain associated correctly when multiple agents run concurrently.
4. Inspect the workbook. Preserve stable output IDs and unchanged regions when editing.
5. Apply operations with `confbuild_apply_sheet_patch`. Prefer `upsert_sheet` or localized cell/row patches; use `replace_workbook` for a genuinely new complete design.
6. Call `confbuild_validate_edit`. Fix all errors before commit and evaluate every warning.
7. Call `confbuild_commit_edit`. If a revision conflict occurs, re-read the latest project and deliberately rebase; never force an overwrite.
8. Call `confbuild_render_project`, then poll `confbuild_get_render_result` until complete. Inspect every returned image and the diagnostics yourself.
9. Iterate patch → validate → commit → render until geometry is recognizable, connected, correctly scaled, non-colliding except at intended interfaces, and complete for the request.
10. Call `confbuild_finish_design_session`, then report the editable URL, changes, deterministic validation, visual findings, and residual limitations.

## Browser choice

Keep `browserMode: auto` by default. It attaches to the user's explicitly CDP-enabled browser when `CONFBUILD_MCP_CDP_URL` is set; otherwise it uses a persistent visible browser and falls back to headless if needed. Use `attached` only when the endpoint is configured and `headless` for deterministic unattended checks.

When the endpoint is the hosted `https://app.confbuild.com/mcp`, `auto` uses the authenticated browser-tab bridge. Tell the user to keep the target project open, poll the render result, and report an expired browser job honestly. Remote OAuth binds project and render operations to the approving Firebase user; never request that user's password or model-provider API key.

## Prompt and cost rules

- The MCP server must not call OpenAI, Anthropic, Gemini, or confBuild AI-generation endpoints.
- The Remote MCP stores the exact start-session `request` and the latest committed Sheet snapshot for admin support history. It does not store client reasoning, model messages, screenshot analysis, screenshots, or the finish-session summary in that history.
- The Remote MCP records content-free operational usage metrics for administration: tool counts, duration, success/errors, byte volume, Sheet operation/row/cell counts, commits, project actions, render jobs, and returned-image counts. It cannot observe client-side model token usage and does not copy prompt, Sheet, image, or reasoning content into usage telemetry.
- The essential prompt bundle includes the canonical sheet-generation rules. Read optional resources only for a missing row type or prompt-editor behavior.
- Keep context bounded with sheet filters and row limits, but never truncate a sheet you are about to replace without first reading it fully.
- Do not claim visual success until a completed render has been inspected.

For tool semantics, revision behavior, storage, and browser modes, read [references/mcp-tool-contract.md](references/mcp-tool-contract.md) when troubleshooting or extending the workflow.
