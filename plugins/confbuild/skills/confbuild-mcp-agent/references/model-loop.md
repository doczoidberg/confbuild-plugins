# confBuild customer model loop

Apply project mutations through MCP tools only, including Sheet changes and project `scriptcode`. The connected confBuild tab rebuilds MCP revisions, executes render/screenshot jobs, and exposes coherent checkpoints so the user can follow progress. Host browser handoff is limited to reusing, opening, reloading, or navigating the URL selected by `confbuild_prepare_browser`, then returning to MCP. During the normal loop, never click editor controls, type or paste project content, open or submit the prompt editor, or invoke editor/page functions through browser evaluation. For a new design this first establishes a signed-in confBuild tab before creation; once a project exists it proves the exact saved revision. Preserve the local confBuild model-loop principles without assuming repository access, generator scripts, service accounts, Playwright commands, local artifact folders, or subagents.

UI mutation is an exceptional, user-approved fallback—not recovery behavior the client may choose automatically. Before using it, require a structured MCP result showing that the exact semantic operation is unsupported, verify that no MCP tool can perform it, explain the bounded action, and obtain explicit user approval. An MCP error, timeout, unavailable browser, or missing tab is not enough. Return to MCP immediately after the one approved action. Never use the confBuild AI prompt editor or a provider-backed generation endpoint as a fallback.

## Loop invariant

Each iteration must follow this evidence chain:

`plan → patch → validate → commit → (diagnostics-only build check) → render four views (more on demand) → diagnose → targeted repair`

Do not skip validation or visual review. Do not repeat an unchanged patch/render cycle.

## 1. Define acceptance before rows

Translate the request into a compact internal plan:

- purpose and recognizable target silhouette;
- overall envelope and critical dimensions;
- main assemblies and required visible parts;
- support, mating, clearance, and motion relationships;
- customer-editable parameters and formulas;
- expected native/domain row type for each major part;
- completion evidence visible in diagnostics or screenshots.

For an existing project, add a preservation list: sheets, output IDs, formulas, interfaces, and regions that must remain unchanged. Keep this plan in client reasoning; never append it to the verbatim stored request.

## 2. Map assemblies and native part types

Choose the strongest supported row type for every recognizable real-world part before writing data.

- Prefer `aluprofile` and `aluconnector` for T-slot frames and joints.
- Prefer `dinpart` and dedicated standard-part rows for catalog hardware.
- Prefer `ibeam`, `squaretube`, and `roundtube` for structural members.
- Prefer `wall`, `slab`, `door`, `window`, `roof`, `column`, and `foundation` for buildings.
- Prefer `extrusion` for shaped plates, brackets, panels, and custom outlines.
- Prefer dedicated drivetrain, bearing, hinge, process-equipment, connector, and annotation rows when the prompt bundle exposes them.
- Use `cube` only for literal rectangular solids, simple packages, or unsupported minor details—not as a placeholder for a major recognizable component.

Treat native-type selection as a quality requirement, not cosmetic polish. Keep output IDs stable so formulas, references, later patches, and animation remain repeatable.

## 3. Establish coordinate and connection contracts

- Give each support or mount plane one coordinate owner, normally the parent/main sheet.
- Use named variables or formulas for support tops, mount planes, clearances, and centers.
- For center-positioned solids resting on a surface, use `center = support surface + size / 2` on the support axis.
- Do not compensate for the same offset in both parent and child sheets.
- Make intentional suspension visible with a bracket, cable, shaft, rail, hinge, or other support path.
- Use stable connectors or named reference points for reusable modules and mating interfaces when supported.
- Size moving or sliding parts to the clear opening minus an explicit clearance.

## 4. Build coarse-to-detail

For a new project, create the seeded project as soon as the plan and profile are known instead of generating the whole workbook while the editor remains blank. Build a complete coherent workbook rather than an isolated decorative fragment, and establish it in this order:

1. inputs and key formulas;
2. primary envelope and datum;
3. load-bearing or enclosing assemblies;
4. interfaces, supports, openings, and motion clearances;
5. recognizable native components;
6. secondary detail, materials, labels, and presentation.

For a long initial build, group that order into adaptive visible checkpoints. A small model may publish once; a medium model usually needs 2–4 stages; a very large model splits only at real assembly boundaries or after roughly 45–90 seconds of otherwise invisible work. Prefer `confbuild_publish_checkpoint` with the matching `previewStage`; it applies the patch, validates once, commits, and rebuilds the exact new revision in the connected clean editor tab without a page reload. If it returns `visibleInEditor: false`, perform the supplied browser handoff. Use separate patch/validate/commit calls when an invalid draft must be repaired before publication.

Checkpoint only usable revisions: required markers, formulas, references, and already introduced assemblies must remain valid. Do not create fake placeholder cubes merely to make a checkpoint visible. These intermediate commits are a progress channel, not extra review rounds, so reserve the four-view render for the complete coarse model and for targeted repair evidence.

For an existing project, use the smallest localized patch that satisfies the request. Never replace the whole workbook merely because it is easier to regenerate.

## 5. Use deterministic validation as a gate

Before every commit:

- fix all validation errors;
- assess every warning rather than ignoring the warning count;
- treat engine-trap lint warnings as real defects: a naked cell reference (`D4` instead of `=D4`) or text in a numeric column silently becomes 0/NaN, consecutive `#` header rows keep only the last header, and cells beyond the header are ignored;
- when `VALUE_SHADOWED_BY_CONFIGMODEL` appears, a saved editor configuration overrides that VALUE cell: renders show the saved value, not your patch — report this to the user rather than diagnosing a phantom geometry defect;
- check formula and reference integrity;
- check unresolved output/reference diagnostics;
- check row, cell, output, and serialized-size summaries for implausible jumps;
- keep intentional intersections or special exceptions explicit and narrowly scoped when the row contract supports them.

Commit only a coherent revision. On a conflict, re-read and rebase the intended patch on the latest workbook.

## 6. Review multi-view visual evidence (four default views, up to seven)

Request `default`, `right`, `front`, and `left` views. Poll with a `waitMs` long-poll instead of rapid repeated calls. A proven browser connection is mandatory before creation, cloning, editing, committing, restoring, rendering, or exporting: call `confbuild_prepare_browser`, perform only the returned tab action through the host browser controller, and call it again until `connected: true`. Do not use the browser controller as an editor or scripting surface.

Apply the handoff literally: `reuse` keeps an exact current clean tab; `reload` refreshes a clean stale tab; `navigate` reuses the signed-in dashboard; `open-new` preserves any tab with unsaved changes, a different configuration/project, or handles the no-tab case by opening a new Chrome/browser tab. Never repurpose a different project or discard unsaved browser work. If the host cannot control a browser, show the returned project resource link and pause for the user instead of pretending the prerequisite was met. Repeat this proof after every commit or snapshot restore because the target revision changed.

Browser-tab rendering is always the default. Never select server compute as a fallback for a missing tab, a heavy/slow model, a timeout, or a budget condition. Pass `rendererMode: 'server-headless'` together with `serverRenderingExplicitlyRequested: true` only when the user explicitly requested server rendering; even then, keep the exact project tab connected so the user has the target revision visibly open.

Read the machine-readable evidence first, then confirm it in the images:

- `diagnostics.geometry` lists BVH-confirmed collision pairs, AABB-suspected overlaps, detached parts that touch nothing, and far-outlier parts, plus model bounds. These findings are approximate: verify each against at least one view before repairing, but never ignore a confirmed collision or a detached part without an explicit explanation (an intentional gap needs a visible support path).
- `iterationDelta` compares this render with the previous render of the same project (mesh, output, collision, detachment, bounds deltas). If your patch was supposed to change geometry and the delta is empty, diagnose the data path (wrong cell, shadowed VALUE, wrong sheet) before touching geometry again.

Inspect every returned image plus diagnostics. Set `includeImages: true` and `maxImages` high enough for all requested views. Present each captioned image in returned view order in Codex/Claude and give concrete feedback for each view; if `presentation.omittedImageCount` is nonzero, retrieve the omitted images before diagnosing or finishing.

Check:

- model visibility, useful framing, and plausible bounds;
- requested type, silhouette, scale, and completeness;
- presence of every main assembly from the acceptance plan;
- physically credible supports, mounts, contacts, and clearances;
- floating, detached, half-sunken, or inconsistently repeated parts;
- unintended overlaps, crossing structural members, visible cutters, and impossible embedding;
- native/domain visual language instead of major cube placeholders;
- consistency across views rather than a result that works from one camera only;
- for motion requests, coherent resting geometry and adequate clearance; never treat camera movement as model animation.

For any model with an interior, add one render with `captureScope: { xray: true }` and judge
it as primary evidence for everything inside a housing or enclosure: every internal part
(liner, shaft, tank, insert, baffle) must show a named fixation feature carrying it —
standoffs, bosses, pins, a bolted flange pair, a clamp. Coaxial zero-gap placement is still
floating (`support_alignment_issue`). A complete machine must also show its mount interface
to the environment (feet, base flange, clamp band with ears, or bracket with real
through-holes) as its own bolted or clamped body, never fused into the housing.

To localize a suspected defect, render the detail instead of re-reading full-scene images:
`captureScope.zoomToOutputIds` frames the camera on the suspect parts, `isolateOutputIds`
hides everything else, `sectionPlane` cuts the model open, and one targeted view keeps the
round cheap. Re-render the SAME detail after the repair to prove the fix.

A screenshot that looks acceptable from one view does not override a failed diagnostic or a defect visible from another view.

## 7. Diagnose before repair

Use one primary category per repair round:

- `data_or_formula_issue`: invalid rows, formulas, references, outputs, or serialization;
- `part_type_selection_issue`: a major recognizable part uses a generic primitive despite an available native type;
- `support_alignment_issue`: a part floats, sinks, detaches, or mounts to the wrong datum;
- `intersection_issue`: unintended collision, overlap, or crossing member;
- `scale_or_framing_issue`: implausible bounds, tiny/off-camera model, or inconsistent scale;
- `completeness_issue`: a requested assembly, interface, opening, or functional part is missing;
- `render_or_browser_issue`: the workbook may be sound but the browser job, tab, or capture failed.

The geometry findings map directly: confirmed or verified collision pairs are `intersection_issue`, detached parts are `support_alignment_issue`, and outlier parts or implausible bounds are `scale_or_framing_issue`.

Repair the generating formula, datum, row type, connection, or clearance—not a camera angle or unexplained one-off offset. Change one diagnosed cause per round where practical, then validate, commit, and render again — and when the defect was localized with a `captureScope` detail render, re-render that same detail so the fix is proven at the resolution where the defect was found.

## Iteration budget

Default to one strong initial build and at most two targeted repair rounds. Exceed that budget only when the user requests more iterations or the latest evidence shows clear progress toward a specific remaining defect. Stop early on a clean pass. Do not spend another round on unchanged evidence.

If the budget ends with unresolved issues, preserve the best committed project and report the exact residual categories and evidence.

A bad commit is recoverable: every commit stores a pre-commit rollback snapshot. When a repair round made the model clearly worse, restore the previous state through the snapshot tools instead of hand-reverting rows, then re-plan the repair.

## Completion gate

Finish only when all of these are true:

- validation has no errors and every warning has been assessed;
- requested assemblies and editable parameters are present;
- output/reference counts and model bounds are plausible;
- every returned view was inspected (the four default views at minimum);
- no unexplained floating, sinking, detachment, or unintended collision remains;
- major recognizable parts use appropriate native row types where available;
- the result is recognizably aligned with the request;
- remaining limitations are explicitly reported.

Report the project URL, iteration count, validation outcome, native types used, visual findings by view, fixed defect categories, and residual limitations. Pass the same outcome to the finish tool's structured fields (`completionState`, `iterationsUsed`, `fixedDefectCategories`, `residualDefectCategories`); they are content-free enums used for loop-quality trends.
