# confBuild agent plugin

This package is the distribution unit for the hosted confBuild MCP and its agent workflow. Installing the package gives a host both the OAuth-authenticated Remote MCP connection and the `confbuild-mcp-agent` skill. Adding the MCP URL by itself gives the tools and `confbuild-design` prompt, but does not install the skill.

## Host manifests

- `.codex-plugin/plugin.json`: Codex/ChatGPT package metadata.
- `.claude-plugin/plugin.json`: Claude Code package metadata.
- `.mcp.json`: shared Remote MCP connection.
- `skills/confbuild-mcp-agent`: shared native-first create/edit/validate/four-view repair workflow.

The customer skill carries the portable quality principles from confBuild's internal model loop without requiring repository access or local generator scripts. It plans acceptance and assemblies before writing rows, prefers native part types, gates every commit through deterministic validation, inspects four rendered views, classifies defects before repair, and stops after a clean pass or a bounded iteration budget. Installed plugins use the reviewed workflow snapshot packaged in `skills/`; direct MCP-only clients receive the same loop inside the server prompt bundle.

Codex invokes the installed skill as `$confbuild-mcp-agent`. Claude Code namespaces plugin skills, so its explicit command is `/confbuild:confbuild-mcp-agent`.

## What you can ask confBuild to do

Ask for the outcome in normal language. The agent chooses the MCP tools, validates every saved change, and normally renders the result for review. Include dimensions, materials, adjustable parameters, must-keep details, and the desired downstream files whenever you know them.

### Generate a new parametric model

```text
Create a parametric belt conveyor in confBuild. Make length, belt width, working
height, speed, and support spacing adjustable. Include the frame, legs, rollers,
drive, guards, materials, and a BOM. Validate the workbook, save it, render front,
right, top, and perspective views, inspect the images, and repair visible defects.
Return the editable project link.
```

The same workflow works for buildings, structural halls, furniture, printable parts, fixtures, machines, skids, enclosures, and generic configurable products:

```text
Build a 20 m × 40 m steel portal-frame hall with adjustable bay spacing, eaves
height, roof pitch, cladding, doors, and windows. Add a cutaway review view and a
bill of materials. Keep all structural values explicitly marked as preliminary.
```

```text
Design a printable wall bracket for FDM. Parameters: width 80 mm, height 120 mm,
wall thickness 4 mm, four countersunk holes, 0.4 mm nozzle, and no unsupported
overhang above 45 degrees. Render it, check printability, and export STL and 3MF.
```

### Continue or inspect an existing project

```text
Continue this project: https://app.confbuild.com/e/PROJECT_ID
Change only the frame width to 1,400 mm and add two cross-braces. Preserve every
other sheet, formula, script, and output ID. Validate, commit, render the changed
area, and compare it with the previous result.
```

```text
Inspect https://app.confbuild.com/e/PROJECT_ID without changing it. Summarize its
parameters, sheets, materials, BOM readiness, unresolved references, validation
risks, and the parts that appear detached or colliding in a four-view render.
```

```text
Clone this public confBuild template into my account, rename the copy “Customer A
Concept”, replace the dimensions with the values below, and leave the source
untouched: …
```

### Review, repair, and recover

```text
Find every row containing “drive_motor”, explain which sheets reference it, and
change only the motor power and mounting offset. Show the pending workbook diff,
validate it, then save and render a close-up of that subassembly.
```

```text
Render front, right, top, and perspective views of this project. Use the geometry
diagnostics to check collisions, detached parts, outliers, model bounds, and whether
the last patch changed the scene. Fix only confirmed defects and rerender.
```

```text
List the rollback snapshots for this project and restore the snapshot from before
the last commit. Do not overwrite anything until you have shown me the selected
snapshot and the current revision.
```

### Create manufacturing and commercial outputs

```text
Export this committed project as STEP, STL, GLB, and 3MF. Also deliver BOM JSON and
CSV. If an artifact is too large for the inline result, retrieve all chunks and
reassemble the original file.
```

```text
Generate a vector drawing-set PDF with standard views and a sheet-metal flat-pattern
DXF. Check that every drawing page is populated and that hidden inactive sheet-metal
parts are excluded from the DXF.
```

```text
Create a cost calculation as JSON, a customer quote as PDF, and purchasing lists as
JSON and CSV. Keep currencies separate, report price coverage, and stop the quote if
required prices or seller identity are missing. Do not invent prices or exchange
rates.
```

### Compare saved variants

```text
Compare these saved confBuild variants by total price in EUR, then by mass, generic
cradle-to-gate CO2e, X/Y/Z extent, and bounding volume: [URL A], [URL B], [URL C].
Show coverage and warnings for every row, keep failed variants visible, and never
treat missing values as zero.
```

## Complete prompt-to-tool map

You normally do not need to name tools. This table shows which natural-language request should cause the agent to use each of the **29 tools** exposed by the hosted server.

| MCP tool | Example user prompt |
|---|---|
| `confbuild_start_design_session` | “Plan and build a configurable workbench with adjustable width, height, drawers, and material.” |
| `confbuild_get_prompt_sections` | “Use the machine profile and load only the geometry, assembly, and catalog rules needed for this design.” |
| `confbuild_get_prompt_bundle` | “Before editing, show which versioned confBuild rule bundle applies to a structural-hall model.” |
| `confbuild_list_prompt_resources` | “List the available confBuild prompt resources with their hashes so I can audit what the agent uses.” |
| `confbuild_auth_status` | “Check whether my confBuild MCP connection is authenticated and tell me which account context is active.” |
| `confbuild_resolve_project_reference` | “Resolve this project/configuration URL and tell me whether it is owned, public, editable, and which saved configuration it targets.” |
| `confbuild_create_project` | “Create a new private parametric conveyor project in my confBuild account.” |
| `confbuild_clone_project` | “Clone this public template into my account and leave the source unchanged.” |
| `confbuild_read_project` | “Read this project without changing it; return only Main Part and Frame plus the project script.” |
| `confbuild_begin_edit` | “Open this owned project for a revision-protected edit and preserve the complete current workbook.” |
| `confbuild_apply_sheet_patch` | “Change cells C2 and C5 in Main Part and add one brace row without replacing unrelated sheets.” |
| `confbuild_validate_edit` | “Validate the pending edit for formula errors, bad references, duplicate IDs, invalid row types, and engine traps.” |
| `confbuild_read_edit_workbook` | “Show me the current unsaved Frame sheet from the active edit session.” |
| `confbuild_commit_edit` | “Save the validated edit atomically, create a rollback snapshot, and rename the project to ‘Conveyor 1400’.” |
| `confbuild_list_project_snapshots` | “List the newest rollback snapshots for this project with their dates and revisions.” |
| `confbuild_restore_project_snapshot` | “Restore the selected pre-commit snapshot as a new revision, while preserving the current state as another snapshot.” |
| `confbuild_discard_edit` | “Discard my uncommitted edit session; do not change the saved project.” |
| `confbuild_browser_capabilities` | “Tell me whether rendering will use an open browser tab or isolated server-side Chromium and which capture features are available.” |
| `confbuild_render_project` | “Start a background render of front, right, top, and default views and give me the job ID.” |
| `confbuild_get_render_result` | “Wait for that render, return the images and geometry diagnostics, and compare it with the previous iteration.” |
| `confbuild_render_and_wait` | “Render this committed project now, wait up to 90 seconds, and return four review views with diagnostics.” |
| `confbuild_export_project` | “Export STEP plus BOM CSV,” “create the drawing PDF and flat-pattern DXF,” or “generate cost, quote, and purchasing outputs.” |
| `confbuild_get_export_result` | “Wait for the export job and return the file inline when it is small enough.” |
| `confbuild_get_export_chunk` | “Download every chunk of the large completed STEP export and reassemble it without exposing private storage paths.” |
| `confbuild_compare_variants` | “Compare these three saved variants by EUR price, mass, CO2e, or scene bounds and rank only adequately covered values.” |
| `confbuild_get_variant_comparison_result` | “Wait for the comparison and show rankings, deltas, coverage, warnings, and per-variant failures.” |
| `confbuild_find_rows` | “Find every row that contains ‘motor’ in the type and identifier columns without reading every sheet in full.” |
| `confbuild_list_edit_sessions` | “List my open edit sessions and recover the one for this project after the previous client disconnected.” |
| `confbuild_finish_design_session` | “Finish the design session only after the final commit and render; return the project link and remaining limitations.” |

The [online prompt guide](https://confbuild.com/docs/confbuild-mcp-prompts/) contains the same catalog in a documentation-friendly format. Exact parameters, export formats, coverage rules, and safety limits are documented in the [MCP tool reference](https://confbuild.com/docs/confbuild-mcp-reference/).

## Install from the confBuild marketplace

The public self-hosted marketplace is distributed from `doczoidberg/confbuild-plugins`. The installation and setup guide is available at <https://confbuild.com/docs/confbuild-mcp-setup/>.

For Codex and ChatGPT, add the marketplace and install **confBuild** from that source:

```bash
codex plugin marketplace add doczoidberg/confbuild-plugins
codex plugin add confbuild@confbuild
```

Restart an already-open client after installation so the new skill and MCP connection are loaded.

To update an installed Codex/ChatGPT plugin from this GitHub marketplace:

```bash
codex plugin marketplace upgrade confbuild
```

Start a new session after the upgrade so the refreshed skill is loaded.

For Claude Code:

```bash
claude plugin marketplace add doczoidberg/confbuild-plugins
claude plugin install confbuild@confbuild --scope user
```

Reload an already-open Claude Code session with `/reload-plugins`; a new session is not required. Then open `/mcp` to approve OAuth and invoke `/confbuild:confbuild-mcp-agent`.

To update an existing user-scoped installation:

```bash
claude plugin marketplace update confbuild
claude plugin update confbuild@confbuild --scope user
```

Use the scope shown by `claude plugin list --json` if the plugin was deliberately installed at project or local scope. The plugin already owns the hosted `confbuild` MCP connection. Do not add the same endpoint manually, and give repository-only developer servers a distinct name such as `confbuild-local`, because Claude gives local and project MCP definitions precedence over plugin-provided servers.

The self-hosted marketplace is the public beta distribution channel. Listing in the OpenAI universal Plugins Directory and Anthropic community marketplace remains a separate review process.

## Validate locally

Use the OpenAI plugin validator from the installed `plugin-creator` skill and the Claude Code validator:

```bash
python3 ~/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/confbuild
claude plugin validate plugins/confbuild
npm run mcp:confbuild:test
```

For a local Claude Code runtime check, start Claude with `claude --plugin-dir ./plugins/confbuild`. A Codex/ChatGPT local install requires a local marketplace entry; do not confuse that authoring path with public customer distribution.

## Official directory publication

Public availability still requires external registration and review:

1. Register `https://app.confbuild.com/mcp` as the plugin's remote OAuth MCP connection in ChatGPT developer mode and add the resulting registered app mapping when required by the submission flow.
2. Run Scan Tools. The server advertises `io.modelcontextprotocol/skills`, `skills/list`, `skills/get`, and every declared `resources/read` URI so the draft can import and verify a static skill snapshot.
3. Submit the OpenAI package to the universal Plugins Directory shared by ChatGPT and Codex. Every behavioral skill change is a reviewed snapshot update, not a live server-side replacement.
4. Validate the Claude package with `claude plugin validate`, then submit the public Git repository to the Anthropic community marketplace. The separately curated `claude-plugins-official` marketplace has no public application process.

The installed skill starts with `workflowSource: 'plugin'`, so the MCP server omits runtime behavioral instructions and returns only session, target, capability, compatibility, and update metadata. Tool implementation changes still become available to every user when the hosted MCP is deployed; behavioral workflow changes travel through the versioned plugin and the relevant marketplace review/update path.

After changing the skill, keep the plugin copy, the repository development copies, and the staged MCP skill in sync. The MCP tests reject drift between the plugin and `.codex/skills/confbuild-mcp-agent`.

## Maintainer release flow

The canonical package lives at `sheetbuild2/plugins/confbuild`; `doczoidberg/confbuild-plugins` is the customer-facing distribution repository. Prepare one aligned release from the main `sheetbuild2` repository with:

```bash
npm run mcp:confbuild:plugin:release -- 0.11.0
```

The command applies the strict-semver version to both host manifests, the bootstrap skill, and the MCP's latest-client marker; synchronizes the repository and installed skill mirrors; copies the complete package to the adjacent `confbuild-plugins` checkout; and updates the Claude marketplace catalog version. It deliberately does not commit, push, merge, submit to an official directory, or deploy the MCP server.

Before publishing either repository, run:

```bash
python3 ~/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/confbuild
python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/confbuild/skills/confbuild-mcp-agent
npm run mcp:confbuild:test
npm run mcp:confbuild:plugin:release-check
npm --prefix ../confbuild-plugins run check
```

Review and publish the main repository and distribution repository independently. Deploying the hosted MCP remains a separate explicit release step; ordinary plugin publication never deploys Firebase.
