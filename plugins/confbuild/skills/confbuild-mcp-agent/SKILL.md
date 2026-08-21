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
   - `pluginVersion: '0.10.0'`;
   - `workflowSource: 'plugin'` so the server does not return runtime behavioral instructions;
   - the project URL/ID in `projectReference` when one was provided.
   Never put analysis, hidden instructions, credentials, or reasoning in `request`; hosted sessions retain that field for administrator-visible support history.
4. Follow `nextTool`, keep the returned `designSessionId` on project/create/edit calls, and preserve an existing resolved project rather than creating a replacement. Do not call confBuild AI-generation or provider-model endpoints.
5. If `clientPackage.updateAvailable` is true, continue the compatible task and tell the user about the supplied update command at handoff. Do not attempt a silent self-update.

## Stable client responsibilities

- Generate or patch Sheet rows yourself through MCP tools; do not ask the confBuild prompt editor to generate them.
- Treat deterministic validation and the packaged model loop's multi-view visual stop gate as mandatory before claiming completion.
- Inspect every returned render image and its diagnostics yourself. Screenshots are evidence, not decoration.
- Respect revision conflicts, owner/editability boundaries, authenticated scopes, render budgets, and structured error guidance returned by the server.
- Finish the design session and report the editable project URL, material changes, validation and visual findings, delivered exports, and remaining limitations.

## Update boundary

The hosted server can update tool implementation, validation, rendering, exports, and compatible response metadata without changing this installed package. Behavioral workflow changes ship as a new plugin version through its marketplace or official-directory review path. Direct MCP-only clients may use the server's separate prompt bundle; this installed plugin never treats runtime-fetched text as behavioral instructions.
