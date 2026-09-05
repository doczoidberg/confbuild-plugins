# confBuild customer model loop

Apply all Sheet/script mutations through MCP. The connected confBuild tab is only the exact-revision preview, semantic-interaction, and capture worker: perform the `confbuild_prepare_browser` lifecycle action, then return to MCP; never author through editor controls, prompt submission, page evaluation, or developer tools. Exercise persisted INPUT buttons and named project/VBA-script functions or registered actions only through `confbuild_run_project_interaction`. UI mutation is allowed only after a structured unsupported-capability result and explicit user approval for one bounded action.

Browser handoff is project-first and single-shot. Enumerate tabs, select the exact project/configuration regardless of focus, ignore transient URL fields, retain one handle per `designSessionId`, and issue `open-new` at most once for that target. Reuse/wait on slow or rebuilding tabs; preserve and pause on dirty tabs. Concurrent sessions keep separate handles and never mutate one edit session in parallel. Use host browser control before asking the user; the resource link is the fallback only when control fails or the one requested tab never connects. Pass exact exposed model/session labels without guessing.

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

## Customer-facing INPUT control contract

Use only these canonical INPUT control types in MCP-authored sheets:

`label`, `textbox`, `slider`, `number`, `checkbox`, `radio`, `select`, `colorchooser`, `material`, `image`, `button`, `html`, `tab`, `sidebar-tab`, `expansion`, `separator`, `groupend`.

- Runtime compatibility aliases such as `accordion`, `panel`, and `section` may exist in old sheets, but new MCP output always writes `expansion`. Do not emit legacy/internal controls such as `stepper`, `window`, `timer`, `produkt`, or `produktnolabel` as customer-facing inputs. `savebutton`, `exportbutton`, and `toolpathbutton` are editor presets that create ordinary `button` rows; they are not control types.
- For value-bearing controls (`textbox`, `slider`, `number`, `checkbox`, `radio`, `select`, `colorchooser`, `material`, `image`, `html`), column C is the editable VALUE and column D is a formula that references column C of the same physical row, for example row 6 uses `=C6` or `=IF(C6<0;0;C6)`. Never use a shifted reference. `label`, `button`, and layout rows may leave D empty.
- Prefer `slider` for bounded customer-facing numbers and always provide numeric MIN, MAX, and a positive numeric PARAMS step. Use `number` only when safe bounds are genuinely unknown or unrestricted exact entry is required. Put semicolon-separated choices in PARAMS for `select` and `radio`; use pipe-separated palette entries for `material`.
- A `button` puts visible text in LABEL and its executable expression in ONCLICK; use a plain, non-awaited function call. VALUE may hold a stable action id. Do not put `await` in the sheet cell.
- `tab` opens a horizontal tab page; consecutive tab pages are siblings. `sidebar-tab` has identical grouping semantics but renders a vertical icon rail. Do not mix both forms in one tab run. `expansion` opens a collapsible panel and may be nested one level inside a tab/sidebar tab; expansion siblings never nest into each other. Arbitrary deeper nesting is unsupported.
- `groupend` closes only the innermost open group and has no cells after TYPE. A new tab closes the current tab page and nested expansion; a new expansion closes the previous sibling expansion; `OUTPUTID` closes all remaining groups. Use explicit `groupend` when ordinary controls follow a group. Blank rows do not close groups. Unmatched `groupend` rows are invalid structure.
- Group headers put their visible title in LABEL, keep VALUE, VALIDATED, MIN, and MAX empty, and may use `icon=fa-...` in PARAMS. An expansion may combine flags such as `expanded;icon=fa-sliders-h`. `separator` is a non-interactive heading/divider and neither opens nor closes a group.
- Keep the INPUT block contiguous. A correct miniature sequence is: row 2 `tab`, row 3 `slider` with D=`=C3`, row 4 `expansion`, row 5 `checkbox` with D=`=C5`, row 6 `groupend`, row 7 `groupend`, then a top-level control or `OUTPUTID`.

## 2. Plan Main Part and child sheets before project mutation

Call `confbuild_plan_sheet_topology` before create, clone, or begin-edit. This is the MCP equivalent of the Composite Model Loop's topology-planning phase.

- Choose `single-sheet` only for one genuinely indivisible manufactured part whose rows form one local feature body. A high row count alone does not make a composite, but a machine, building, product, furniture item, or structure with two or more independently mounted, serviceable, reusable, repeated, or co-moving functional units normally does.
- For a composite, keep `Main Part` as sheet 0 and let it own assembly-level inputs, world placement, instance transforms, spacing, and global choreography. Give each functional unit an exact stable child name such as `Drive Unit`, `Gantry`, `Safety Guard`, or `Stair Core`; never group sheets as `Cubes`, `Cylinders`, or `Subpart 2`.
- Model a repeated physical unit once in one parameterized child sheet and instantiate it through multiple exact `SHEET: <name>` rows. The space after the colon is mandatory. Use `PROJECT: <id>` only for a real external project supplied by the user or already present in the design.
- Each child owns complete local geometry, its own `INPUTID`/`OUTPUTID` sections, and a stable local support or mount datum (normally local z=0 at the mounting interface). Parts that move together belong in the same child.
- Declare only child-relevant editable `inputIds` in the topology plan. Every parent reference uses a governing `#` header containing those exact ids and passes a literal or formula in the same row. Different child types get different headers/contracts; do not clone one global input list into every child.
- The server seeds the planned embedded sheets on creation. Later validation blocks missing/unplanned child sheets, missing or empty parent parameter cells, missing planned child inputs, repeated children with only one instance, cyclic sheet references, and a planned main sheet that is not first. An orphan sheet is always a warning and becomes a plan mismatch for a composite.
- When editing an existing project, include every sheet that must be preserved in the new plan. If the existing model is a flat complex assembly and the task covers the whole assembly, migrate it deliberately into functional child sheets; do not choose `single-sheet` merely to preserve the defect.

## 3. Map assemblies and native part types

Choose the strongest supported row type for every recognizable real-world part before writing data.

- Prefer `aluprofile` and `aluconnector` for T-slot frames and joints. `aluprofile` accepts
  optional `startSlope` and `endSlope` degree columns for planar miter cuts on the local +Z
  member axis: empty/0 keeps a perpendicular face, `startSlope` cuts the start face, and
  `endSlope` cuts the end face (valid range -89..89). Keep `startPoint`/`endPoint` as the
  face-center span; use partner-derived `trimby`/`autoconnect` cuts or subtraction rows for
  seats, notches, and non-planar joints instead of guessing a slope.
- Prefer `dinpart` and dedicated standard-part rows for catalog hardware.
- Prefer `ibeam`, `squaretube`, and `roundtube` for structural members.
- Prefer `wall`, `slab`, `door`, `window`, `roof`, `column`, and `foundation` for buildings.
- Prefer `extrusion` for shaped plates, brackets, panels, and custom outlines.
- Prefer dedicated drivetrain, bearing, hinge, process-equipment, connector, and annotation rows when the prompt bundle exposes them.
- Use `cube` only for literal rectangular solids, simple packages, or unsupported minor details—not as a placeholder for a major recognizable component.

Treat native-type selection as a quality requirement, not cosmetic polish. Keep output IDs stable so formulas, references, later patches, and animation remain repeatable.

## 4. Establish coordinate and connection contracts

- Give each support or mount plane one coordinate owner, normally the parent/main sheet.
- Use named variables or formulas for support tops, mount planes, clearances, and centers.
- For center-positioned solids resting on a surface, use `center = support surface + size / 2` on the support axis.
- Do not compensate for the same offset in both parent and child sheets.
- Make intentional suspension visible with a bracket, cable, shaft, rail, hinge, or other support path.
- Use stable connectors or named reference points for reusable modules and mating interfaces when supported.
- Size moving or sliding parts to the clear opening minus an explicit clearance.

## Animation control contract

Every requested animation must expose two separate visible INPUT buttons: Start and Stop.

- Put animation logic and both handlers in project `scriptcode`; put the two controls in INPUT rows with plain, non-awaited `ONCLICK` calls to stable handler names.
- Registered actions may supplement the controls but never replace either visible button.
- Make Start idempotent so repeated clicks cannot create duplicate playback, frame loops, or timers.
- Make Stop idempotent and immediately cancel every motion resource owned by the animation, including API playback, `requestAnimationFrame` loops, and timers, while leaving a coherent current or resting pose and reload-safe cleanup.
- After every custom animation update, call `API.renderScene(true)` before scheduling the next update. Continuous scene rendering is disabled by default: each custom frame/timer step must update scene or camera state first and then force exactly one render frame. Built-in animation/simulation helpers that already invoke their render callback satisfy this rule and need no redundant wrapper loop.
- `ONLOADED()` may capture or restore the resting pose but must never auto-start motion. Motion begins only through Start or another explicitly requested user control.
- After the exact revision is connected, run the Start INPUT button through `confbuild_run_project_interaction`, inspect its before/after images plus `changedOutputIds`/script diagnostics, then run the Stop button the same way and verify that motion resources stop. A bare handler may be tested with `type: 'script-function'`, and an `API.registerAction` entry with `type: 'script-action'`; arbitrary expressions remain forbidden.
- Treat missing, hidden, unconnected, or non-stopping Start/Stop buttons as an incomplete animation request.

## 5. Build coarse-to-detail

For a new project, create the seeded project as soon as the plan and profile are known instead of generating the whole workbook while the editor remains blank. Build a complete coherent workbook rather than an isolated decorative fragment, and establish it in this order:

1. inputs and key formulas;
2. primary envelope and datum;
3. load-bearing or enclosing assemblies;
4. interfaces, supports, openings, and motion clearances;
5. recognizable native components;
6. secondary detail, materials, labels, and presentation.

For a long initial build, group that order into adaptive visible checkpoints. A small model may publish once; a medium model usually needs 2–4 stages; a very large model splits only at real assembly boundaries or after roughly 45–90 seconds of otherwise invisible work. Prefer `confbuild_publish_checkpoint` with the matching `previewStage`; it applies the patch, validates once, atomically saves the workbook plus project `scriptcode`, creates a mandatory pre-commit rollback snapshot, and rebuilds the exact new revision in the connected clean editor tab without a page reload. If snapshot creation fails, the checkpoint must fail without saving an unprotected project revision. If it returns `visibleInEditor: false`, perform the supplied browser handoff. Use separate patch/validate/commit calls when an invalid draft must be repaired before publication.

Checkpoint only usable revisions: required markers, formulas, references, and already introduced assemblies must remain valid. Do not create fake placeholder cubes merely to make a checkpoint visible. These intermediate commits are a progress channel, not extra review rounds, so reserve the four-view render for the complete coarse model and for targeted repair evidence.

For an existing project, use the smallest localized patch that satisfies the request. Never replace the whole workbook merely because it is easier to regenerate.

## 6. Use deterministic validation as a gate

Before every commit:

- fix all validation errors;
- assess every warning rather than ignoring the warning count;
- treat engine-trap lint warnings as real defects: a naked cell reference (`D4` instead of `=D4`) or text in a numeric column silently becomes 0/NaN, consecutive `#` header rows keep only the last header, and cells beyond the header are ignored;
- when `VALUE_SHADOWED_BY_CONFIGMODEL` appears, a saved editor configuration overrides that VALUE cell: renders show the saved value, not your patch — report this to the user rather than diagnosing a phantom geometry defect;
- check formula and reference integrity;
- require validation `topology` to match the declared plan: every planned child exists, is reachable from `Main Part`, uses the correct parent and exact `SHEET:`/`PROJECT:` target, and receives every planned child input;
- check unresolved output/reference diagnostics;
- check row, cell, output, and serialized-size summaries for implausible jumps;
- keep intentional intersections or special exceptions explicit and narrowly scoped when the row contract supports them.

Commit only a coherent revision. On a conflict, re-read and rebase the intended patch on the latest workbook.

## 7. Review multi-view visual evidence (four default views, up to seven)

Request `default`, `right`, `front`, and `left`; long-poll with `waitMs`. Prove the exact browser revision before project operations and again after commit/restore, retaining the same clean tab. Browser-tab rendering is always the default; `server-headless` plus its confirmation flag is allowed only on the user's explicit request and never bypasses browser preparation.

Read the machine-readable evidence first, then confirm it in the images:

- `diagnostics.geometry` lists BVH-confirmed collision pairs, AABB-suspected overlaps, detached parts that touch nothing, and far-outlier parts, plus model bounds. These findings are approximate: verify each against at least one view before repairing, but never ignore a confirmed collision or a detached part without an explicit explanation (an intentional gap needs a visible support path).
- `iterationDelta` compares this render with the previous render of the same project (mesh, output, collision, detachment, bounds deltas). If your patch was supposed to change geometry and the delta is empty, diagnose the data path (wrong cell, shadowed VALUE, wrong sheet) before touching geometry again.
- For composites, `diagnostics.scene.subsheets` must name every planned embedded child and report its instance output id, descendant ids, mesh count, and bounds; counts alone are insufficient. A valid-looking `Main Part` with a missing named child is a `sheet_reference_issue`, not a visual pass. Follow `qualityGate.suggestedInspectionSubsheetNames` and inspect each exact child sheet in mounting context, isolation, center section, and x-ray.

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

For every multi-part revision, follow the render result's exact `confbuild_inspect_outputs`
arguments before diagnosis, repair, or acceptance. Every planned embedded child sheet needs its
own revision-bound evidence via the returned `subsheetNames`, and every geometry defect pair stays
a separate local output-id group. The tool produces one coherent four-image inspection set:
(1) a zoomed opaque target with all surrounding objects ghosted, (2) the target
isolated, (3) an automatic section through the target center, and (4) a zoomed x-ray. Inspect
every image. A full-scene view alone is never sufficient evidence for a multi-part model.

Judge the x-ray and section images as primary evidence for everything inside a housing or
enclosure: every internal part (liner, shaft, tank, insert, baffle) must show a named fixation
feature carrying it — standoffs, bosses, pins, a bolted flange pair, a clamp. Coaxial zero-gap
placement is still floating (`support_alignment_issue`). A complete machine must also show its
mount interface to the environment (feet, base flange, clamp band with ears, or bracket with
real through-holes) as its own bolted or clamped body, never fused into the housing.

Every actionable geometric finding that names output IDs must use those exact IDs in the
inspection set. After repair, run `confbuild_inspect_outputs` again on the repaired revision to
prove the same relationship in all four modes, then return to an unscoped four-view pass.
Unchanged evidence requires a new cause hypothesis, never acceptance. Use manual `captureScope`
only for an extra angle or narrower follow-up.

For `structure`, follow the gate's `contactPairs` joint series close-up for seating,
hardware, clearance, end cuts, and load-path continuity; a whole-frame view is insufficient.

A screenshot that looks acceptable from one view does not override a failed diagnostic or a defect visible from another view.

## 8. Diagnose before repair

Use one primary category per repair round:

- `data_or_formula_issue`: invalid rows, formulas, references, outputs, or serialization;
- `part_type_selection_issue`: a major recognizable part uses a generic primitive despite an available native type;
- `sheet_topology_issue`: planned sheet count/order/ownership differs from the workbook or a complex assembly remains improperly flat;
- `sheet_reference_issue`: a `SHEET:`/`PROJECT:` row is missing, cyclic, unresolved, or did not build the planned nested instance;
- `parameter_snapshot_issue`: a child input contract is correct in the workbook but parent-driven values disappear after save/reload or configuration application;
- `support_alignment_issue`: a part floats, sinks, detaches, or mounts to the wrong datum;
- `intersection_issue`: unintended collision, overlap, or crossing member;
- `scale_or_framing_issue`: implausible bounds, tiny/off-camera model, or inconsistent scale;
- `completeness_issue`: a requested assembly, interface, opening, or functional part is missing;
- `render_or_browser_issue`: the workbook may be sound but the browser job, tab, or capture failed.

The geometry findings map directly: confirmed or verified collision pairs are `intersection_issue`, detached parts are `support_alignment_issue`, and outlier parts or implausible bounds are `scale_or_framing_issue`.

Repair the generating formula, datum, row type, connection, or clearance—not a camera angle or unexplained one-off offset. Change one diagnosed cause per round where practical, then validate, commit, and render again — and when the defect was localized with a `captureScope` detail render, re-render that same detail so the fix is proven at the resolution where the defect was found.

## Iteration budget

Default to one strong initial build and up to five targeted repair rounds; continue to eight
while concrete blockers decrease. Stop on a clean pass. After one unchanged repair, zoom and
change the cause hypothesis; after two, restore the best revision and report the residual.
A detail-only render does not consume a repair round.

On budget exhaustion or stalled repairs, preserve the best committed project. Finish as `partial` with `stopReason: 'budget-exhausted'` or `'no-progress'`, last completed `finalRenderJobId`, residual categories, and `residualFindings` (category, exact outputIds, evidence: visual/diagnostic/user-reported, description, suggestedRepair). Include visual defects missed by diagnostics. Detail renders support partial reports, never whole-model completion.

Present `residualReport`: what works, why the loop stopped, affected part names/IDs, confirmed versus suspected/unverified overlaps, totals/truncation, and proposed repairs. Empty preflight lists do not prove cable or thin-part clearance; BVH bounding-box overlap is not exact penetration depth. Explain intentional contacts.

Ask in the user's language whether to continue for up to three targeted repair rounds; wait unless already authorized. Finish deletes design/edit state. On approval start a fresh session on the same project URL, re-read the latest revision, re-plan preserved topology, and inspect the named defects. Never replace the project or reuse deleted session ids.

A bad commit is recoverable: every commit stores the pre-commit workbook and project `scriptcode` together as one rollback snapshot. Restoring that snapshot creates another normal revision and first snapshots the state being replaced, so rollback is itself undoable. Legacy workbook-only snapshots remain readable but explicitly preserve the current source code. When a repair round made the model clearly worse, restore the previous state through the snapshot tools instead of hand-reverting rows, then re-plan the repair.

## Completion gate

Finish only when all of these are true:

- validation has no errors and every warning has been assessed;
- requested assemblies and editable parameters are present;
- the declared sheet topology passes validation, every planned child is reachable, and final diagnostics name every expected child in `scene.subsheets` (plus the expected subproject count);
- output/reference counts and model bounds are plausible;
- every returned view was inspected (the four default views at minimum);
- every planned child sheet and every required local output group on the current revision has a successful `confbuild_inspect_outputs` four-image evidence set, repeated for targets affected by the last repair;
- the final completion render is unscoped and contains `default`, `right`, `front`, and `left`;
- the exact intersection preflight has no findings and no unverified pairs left from an exhausted, failed, or vertex-limited precise check;
- no unexplained floating, sinking, detachment, or unintended collision remains;
- major recognizable parts use appropriate native row types where available;
- for every requested animation, visible Start and Stop INPUT buttons exist, call working handlers, every custom scene update forces its render frame, and Stop halts the owned motion cleanly;
- the result is recognizably aligned with the request;
- remaining limitations are explicitly reported.

Report the URL, iterations, validation, native types, per-view findings, fixes, and limits. Pass
the structured outcome fields. The server rejects `completionState: complete` for a missing,
scoped, stale, incomplete-view, or blocked final render; follow its zoom arguments, or use
`partial` with truthful residual categories.
