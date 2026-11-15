# confBuild customer model loop

Author Sheet rows and `scriptcode` only through MCP; browser handoff, recovery and the UI-fallback gate follow the MCP agent contract (server bundle) or SKILL.md (plugin).

## Loop invariant

Each iteration must follow this evidence chain:

`plan → patch → validate → commit → (diagnostics-only build check) → render four views (more on demand) → diagnose → targeted repair`

Do not skip validation or visual review. Do not repeat an unchanged patch/render cycle.

## 1. Define acceptance before rows

Translate the request into a compact internal plan: purpose and recognizable target silhouette; overall envelope and critical dimensions; main assemblies and required visible parts; support, mating, clearance and motion relationships; customer-editable parameters and formulas; expected native/domain row type per major part; completion evidence visible in diagnostics or screenshots. For an existing project add a preservation list: sheets, output IDs, formulas, interfaces and regions that must remain unchanged. Keep the plan in client reasoning; never append it to the verbatim stored request.

## Customer-facing INPUT control contract

MCP-authored sheets use only these canonical INPUT control types:

`label`, `textbox`, `slider`, `number`, `checkbox`, `radio`, `select`, `colorchooser`, `material`, `image`, `button`, `html`, `tab`, `sidebar-tab`, `expansion`, `separator`, `groupend`.

- Runtime compatibility aliases such as `accordion`, `panel`, and `section` may exist in old sheets, but new MCP output always writes `expansion`. Never emit legacy/internal `stepper`, `window`, `timer`, `produkt` or `produktnolabel` as customer-facing inputs. `savebutton`, `exportbutton` and `toolpathbutton` are editor presets that create ordinary `button` rows, not control types.
- Value-bearing controls (all except `label`, `button` and layout rows, which may leave D empty): column C is the editable VALUE, column D a formula referencing column C of the same physical row (row 6: `=C6` or `=IF(C6<0;0;C6)`), never a shifted reference.
- Bounded customer-facing numbers are `slider` rows with numeric MIN, MAX and a positive numeric PARAMS step (`NUMERIC_INPUT_SHOULD_USE_SLIDER`); `number` only when safe bounds are genuinely unknown or unrestricted exact entry is required. TRUE/FALSE and 0/1 flags are `checkbox` rows with JSON boolean VALUE and empty MIN/MAX/PARAMS (`BOOLEAN_INPUT_SHOULD_USE_CHECKBOX`). `select`/`radio` take semicolon-separated choices in PARAMS, `material` pipe-separated palette entries.
- A `button` puts visible text in LABEL and a plain, non-awaited function call in ONCLICK (never `await` in the cell); VALUE may hold a stable action id.
- Optional columns after ONCHANGE (L): M `DISABLED` and N `HINT`, ordinary cells (formulas allowed), only for rules that lock a control or option. M empty/`FALSE`/`0` = enabled, `TRUE`/`1`/`locked` locks the control (value stays visible); on `select`/`radio`/`material`/`colorchooser` a `;`-separated option list (`M63 × 1,5;NPT 1"`) disables just those options. N is help text under the control; `option=text` entries separated by `;` set an option's tooltip and disabled reason (`M63 × 1,5=Erst ab QX-P10 zulässig`). Locked controls and options also reject script and MCP writes; group rows never lock.
- `tab` opens a horizontal tab page; consecutive tab pages are siblings. `sidebar-tab` groups identically but renders a vertical icon rail; never mix both in one tab run. `expansion` opens a collapsible panel and may nest one level inside a tab/sidebar tab; expansion siblings never nest into each other. Arbitrary deeper nesting is unsupported.
- `groupend` closes only the innermost open group and has no cells after TYPE. A new tab closes the current tab page and nested expansion; a new expansion closes the previous sibling expansion; `OUTPUTID` closes all remaining groups; blank rows close nothing. Use explicit `groupend` when ordinary controls follow a group; unmatched `groupend` rows are invalid structure.
- Group headers put their title in LABEL, keep VALUE, VALIDATED, MIN and MAX empty, and may use `icon=fa-...` in PARAMS; expansion flags combine (`expanded;icon=fa-sliders-h`). `separator` is a non-interactive heading/divider that neither opens nor closes a group.
- Keep the INPUT block contiguous. Correct miniature: row 2 `tab`, row 3 `slider` with D=`=C3`, row 4 `expansion`, row 5 `checkbox` with D=`=C5`, row 6 `groupend`, row 7 `groupend`, then a top-level control or `OUTPUTID`.

## 2. Plan Main Part and child sheets before project mutation

Call `confbuild_plan_sheet_topology` before creating a project; begin-edit and clone adopt an existing project's saved sheet and manufacturing plans, so re-plan only to change sheet boundaries.

- `single-sheet` only for one genuinely indivisible manufactured part whose rows form one local feature body. Row count alone does not make a composite, but a machine, building, product, furniture item or structure with two or more independently mounted, serviceable, reusable, repeated or co-moving functional units normally is one.
- In a composite, `Main Part` stays sheet 0 and owns assembly-level inputs, world placement, instance transforms, spacing and global choreography. Each functional unit gets an exact stable child name (`Drive Unit`, `Gantry`, `Safety Guard`, `Stair Core`), never `Cubes`, `Cylinders` or `Subpart 2`.
- Model a repeated physical unit once in one parameterized child sheet and instantiate it through multiple exact `SHEET: <name>` rows (the space after the colon is mandatory). `PROJECT: <id>` only for a real external project supplied by the user or already in the design.
- Each child owns complete local geometry, its own `INPUTID`/`OUTPUTID` sections and a stable local support/mount datum (normally local z=0 at the mounting interface). Parts that move together share a child.
- Declare only child-relevant editable `inputIds` in the plan. Every parent reference uses a governing `#` header with those exact ids and passes a literal or formula in the same row. Different child types get different headers/contracts; never clone one global input list into every child.
- The server seeds the planned embedded sheets on creation. Validation then blocks missing/unplanned child sheets, missing or empty parent parameter cells, missing planned child inputs, repeated children with only one instance, cyclic sheet references and a planned main sheet that is not first. An orphan sheet is always a warning and a plan mismatch for a composite.
- When editing, include every sheet to preserve in the new plan. A flat complex assembly whose whole is in scope migrates deliberately into functional child sheets; never choose `single-sheet` merely to preserve the defect.

## 3. Map assemblies and native part types

Choose the strongest supported row type for every recognizable real-world part before writing data.

- `aluprofile` and `aluconnector` for T-slot frames and joints. `aluprofile` takes optional `startSlope`/`endSlope` degree columns (-89..89; empty/0 = perpendicular face) for planar miter cuts of the start/end face on the local +Z member axis; `startPoint`/`endPoint` stay the face-center span. Seats, notches and non-planar joints use partner-derived `trimby`/`autoconnect` cuts or subtraction rows, never a guessed slope.
- `dinpart` and dedicated standard-part rows for catalog hardware; `ibeam`, `squaretube`, `roundtube` for structural members; `wall`, `slab`, `door`, `window`, `roof`, `column`, `foundation` for buildings; `extrusion` for shaped plates, brackets, panels and custom outlines; dedicated drivetrain, bearing, hinge, process-equipment, connector and annotation rows when the prompt bundle exposes them.
- `cube` only for literal rectangular solids, simple packages or unsupported minor details, never as a placeholder for a major recognizable component.

Native-type selection is a quality requirement, not polish. Keep output IDs stable so formulas, references, later patches and animation stay repeatable.

## 4. Establish coordinate and connection contracts

- Give each support or mount plane one coordinate owner, normally the parent/main sheet.
- Use named variables or formulas for support tops, mount planes, clearances and centers.
- Center-positioned solids resting on a surface: `center = support surface + size / 2` on the support axis.
- Never compensate the same offset in both parent and child sheets.
- Make intentional suspension visible with a bracket, cable, shaft, rail, hinge or other support path.
- Use stable connectors or named reference points for reusable modules and mating interfaces when supported.
- Size moving or sliding parts to the clear opening minus an explicit clearance.

## Furniture machining and mounting checks

- Seat removable shelves on internal supports in blind side bores, never exterior through-screws; verify contact with the shelf underside.
- Rear panels need a groove/rebate, edge engagement and retention (e.g. nails).
- Seat hinges against cabinet/door; match cup-pocket diameter/depth and verify positive residual door thickness.
- Verify final geometry: invisible cutters may be skipped and chained cuts may restore earlier bodies. Use operational or boolean-consumed cutters; confirm every groove/pocket survives. Inspect exported geometry at mounting datums when images are inconclusive.

## Animation control contract

Every requested animation must expose two separate visible INPUT buttons: Start and Stop.

- Animation logic and both handlers live in project `scriptcode`, the two controls are INPUT `button` rows calling stable handler names; registered actions may supplement but never replace either visible button.
- Make Start idempotent so repeated clicks cannot create duplicate playback, frame loops or timers.
- Make Stop idempotent and immediately cancel every motion resource owned by the animation (API playback, `requestAnimationFrame` loops, timers), leaving a coherent current or resting pose and reload-safe cleanup.
- After every custom animation update, call `API.renderScene(true)` before scheduling the next update. Continuous scene rendering is disabled by default: each custom frame/timer step must update scene or camera state, then force exactly one render frame. Built-in animation/simulation helpers that already invoke their render callback need no redundant wrapper loop.
- `ONLOADED()` may capture or restore the resting pose but never auto-starts motion; motion begins only through Start or another explicitly requested control. Renders capture the resting pose.
- Scripts are event-driven, never polling: `ONLOADED` once, INPUT `ONCHANGE`/`ONCLICK` cells or `API.on()` for changes, one `ActiveWorkbook.getRangeValues()` call for several values; no timer may re-read parameters, cells, DOM or scene state (idle project = zero worker traffic), timers only drive visible Start/Stop motion.
- Rebuilds replace scene groups (any parameter change, a re-shown `PROJECT:`/`SHEET:` instance): never keep an `Object3D` across clicks; resolve it with `API.getSceneObject()` inside the handler, pass the live instance to `API.callSubproject(rowOutputId, fn, instance)` (also injected as `object`; subproject code uses `target || object` and keys per-instance state by it), and re-resolve targets in `ONMODELUPDATED(detail)`, never in a watchdog timer. Verify by toggling the instance off and on and pressing the button again.
- On the exact connected revision, run the Start button through `confbuild_run_project_interaction`, inspect its before/after images, `changedOutputIds` and script diagnostics, then run Stop the same way and verify motion resources stop. Test a bare handler with `type: 'script-function'`, an `API.registerAction` id with `type: 'script-action'`; arbitrary expressions are forbidden.
- Missing, hidden, unconnected or non-stopping Start/Stop buttons leave the animation request incomplete.

## 5. Build coarse-to-detail

For a new project, create the seeded project as soon as plan and profile are known instead of generating the whole workbook behind a blank editor. Build a complete coherent workbook, not an isolated decorative fragment, in this order: (1) inputs and key formulas; (2) primary envelope and datum; (3) load-bearing or enclosing assemblies; (4) interfaces, supports, openings and motion clearances; (5) recognizable native components; (6) secondary detail, materials, labels and presentation.

Publish adaptive checkpoints: once for small models, 2–4 stages for medium models, assembly boundaries or roughly 45–90 seconds for large builds. `confbuild_publish_checkpoint` with `previewStage` validates, atomically saves workbook + `scriptcode`, snapshots the prior revision and rebuilds the connected clean tab in place; no browser handoff follows unless the result asks for one. Checkpoints carry valid markers, formulas, references and the introduced assemblies, never invalid data or placeholder cubes faking progress; use separate patch/validate/commit calls only to repair an invalid draft before publishing. Intermediate commits are progress, not review rounds: render four views for the complete coarse model and targeted repairs, not every stage.

For an existing project, use the smallest localized patch that satisfies the request; never replace the whole workbook merely because regenerating is easier.

## 6. Use deterministic validation as a gate

Before every commit:

- fix all validation errors and assess every warning, not just the warning count;
- treat engine-trap lint warnings as real defects: a naked cell reference (`D4` instead of `=D4`) or text in a numeric column silently becomes 0/NaN, consecutive `#` header rows keep only the last header, and cells beyond the header are ignored;
- `VALUE_SHADOWED_BY_CONFIGMODEL`: a saved editor configuration overrides that VALUE cell, so renders show the saved value, not your patch; report this to the user rather than diagnosing a phantom geometry defect;
- check formula/reference integrity and unresolved output/reference diagnostics;
- require validation `topology` to match the declared plan: every planned child exists, is reachable from `Main Part`, uses the correct parent and exact `SHEET:`/`PROJECT:` target, and receives every planned child input;
- check row, cell, output and serialized-size summaries for implausible jumps;
- keep intentional intersections or special exceptions explicit and narrowly scoped when the row contract supports them.

Commit only a coherent revision. On a conflict, re-read and rebase the intended patch on the latest workbook; never overwrite a changed revision.

## 7. Review multi-view visual evidence (four default views, up to seven)

Request `default`, `right`, `front` and `left` with `confbuild_render_and_wait` (long-poll with `waitMs`), `includeImages: true` and `maxImages` covering every requested view. Read the machine-readable evidence first, then confirm it in the images:

- `placementAudit` (read before images): floating parts show air gap and nearest neighbour, misrotated machine elements their partner angle; `placementErrors` block completion: fix the named `axis` rows via `confbuild_explain_row_type` `placement`. Apply exact geometry/`trimby=` findings before interpreting images.
- `diagnostics.geometry`: BVH-confirmed collision pairs, AABB-suspected overlaps, detached parts touching nothing, far outliers and model bounds. Crossing surfaces alone are no collision: a shaft in its bore, face-on-face contact, a screw in its modelled bore or a fastener inside a cutter its host's subtraction actually cut (`cuttingOpenings`) stays a contact with `measuredDepth` near 0. Multi-solid parts (housing shell plus inserts, screw head plus shank) are checked solid by solid; a pair's `measuredDepth` is the shared-volume thickness. Declare intended embeds with `allowintersect=true` or `intersecttolerance` (mm); concealed profile connectors are exempt from the profiles they join. Findings are approximate: verify each in at least one view before repairing, but never ignore a confirmed collision or detached part without explicit explanation (an intentional gap needs a visible support path).
- `iterationDelta` compares with the project's previous render (mesh, output, collision, detachment, bounds). An empty delta after a geometry-changing patch means diagnose the data path (wrong cell, shadowed VALUE, wrong sheet) before touching geometry again.
- For composites, `diagnostics.scene.subsheets` must name every planned embedded child with its instance output id, descendant ids, mesh count and bounds; counts alone are insufficient. A valid-looking `Main Part` with a missing named child is a `sheet_reference_issue`, not a visual pass.

Inspect every returned image plus diagnostics, presenting each captioned image in returned view order in Codex/Claude with concrete feedback per view; if `presentation.omittedImageCount` is nonzero, retrieve the omitted images before diagnosing or finishing.

Check model visibility, useful framing and plausible bounds; requested type, silhouette, scale and completeness; every main assembly from the acceptance plan; physically credible supports, mounts, contacts and clearances; floating, detached, half-sunken or inconsistently repeated parts; unintended overlaps, crossing structural members, visible cutters and impossible embedding; native/domain visual language instead of major cube placeholders; for motion requests, coherent resting geometry and adequate clearance (camera movement is never model animation).

For every multi-part revision, follow the render result's exact `confbuild_inspect_outputs` arguments (`qualityGate`, `qualityGate.suggestedInspectionSubsheetNames`) before diagnosis, repair, or acceptance: inspect every returned `subsheetNames` and each separate local defect/connection `outputIds` group, using the exact output IDs of every actionable finding. Each call yields one four-image set: (1) a zoomed opaque target with all surrounding objects ghosted, (2) the target isolated, (3) an automatic section through the target center, (4) a zoomed x-ray. Inspect every image; a full-scene view alone never suffices for a multi-part model.

Judge x-ray and section images as primary evidence for everything inside a housing or enclosure: every internal part (liner, shaft, tank, insert, baffle) needs a named fixation feature carrying it (standoffs, bosses, pins, a bolted flange pair, a clamp); coaxial zero-gap placement is still floating (`support_alignment_issue`). A complete machine must also show its mount interface to the environment (feet, base flange, clamp band with ears, or bracket with real through-holes) as its own bolted or clamped body, never fused into the housing.

After repair, run `confbuild_inspect_outputs` again on the repaired revision to prove the same relationship in all four modes, then return to an unscoped four-view pass. Unchanged evidence requires a new cause hypothesis, never acceptance. Use manual `captureScope` only for an extra angle or narrower follow-up.

For `structure`, follow the gate's `contactPairs` joint series close-up for seating, hardware, clearance, end cuts, and load-path continuity; a whole-frame view is insufficient.

Results must hold in every view: a screenshot that looks acceptable from one view does not override a failed diagnostic or a defect visible from another view.

## 8. Diagnose before repair

Use one primary category per repair round:

- `data_or_formula_issue`: invalid rows, formulas, references, outputs or serialization;
- `part_type_selection_issue`: a major recognizable part uses a generic primitive despite an available native type;
- `sheet_topology_issue`: planned sheet count/order/ownership differs from the workbook or a complex assembly remains improperly flat;
- `sheet_reference_issue`: a `SHEET:`/`PROJECT:` row is missing, cyclic, unresolved or did not build the planned nested instance;
- `parameter_snapshot_issue`: a child input contract is correct in the workbook but parent-driven values disappear after save/reload or configuration application;
- `support_alignment_issue`: a part floats, sinks, detaches or mounts to the wrong datum;
- `intersection_issue`: unintended collision, overlap or crossing member;
- `scale_or_framing_issue`: implausible bounds, tiny/off-camera model or inconsistent scale;
- `completeness_issue`: a requested assembly, interface, opening or functional part is missing;
- `render_or_browser_issue`: the browser job, tab or capture failed although the workbook may be sound.

Geometry findings map directly: confirmed or verified collision pairs are `intersection_issue`, detached parts `support_alignment_issue`, outlier parts or implausible bounds `scale_or_framing_issue`.

Repair the generating formula, datum, row type, connection or clearance, not a camera angle or unexplained one-off offset. Change one diagnosed cause per round where practical, then validate, commit and render again; when a `captureScope` detail render localized the defect, re-render that same detail to prove the fix at the resolution where it was found.

## Iteration budget

Default to one strong initial build and up to five targeted repair rounds; continue to eight
while concrete blockers decrease. Stop on a clean pass. After one unchanged repair, zoom and
change the cause hypothesis; after two, restore the best revision and report the residual.
A detail-only render does not consume a repair round.

On budget exhaustion or stalled repairs, preserve the best committed project. Finish as `partial` with `stopReason: 'budget-exhausted'` or `'no-progress'`, last completed `finalRenderJobId`, residual categories, and `residualFindings` (category, exact outputIds, evidence: visual/diagnostic/user-reported, description, suggestedRepair). Include visual defects missed by diagnostics. Detail renders support partial reports, never whole-model completion.

Present `residualReport`: what works, why the loop stopped, affected part names/IDs, confirmed versus suspected/unverified overlaps, totals/truncation, proposed repairs; explain intentional contacts. Empty preflight lists do not prove cable or thin-part clearance; BVH bounding-box overlap is not exact penetration depth.

Ask in the user's language whether to continue for up to three targeted repair rounds; wait unless already authorized. Finish deletes design/edit state: on approval start a fresh session on the same project URL, begin an edit (adopting the saved plans and latest revision) and inspect the named defects; never replace the project or reuse deleted session ids.

Every commit snapshots the prior workbook + `scriptcode` together as one rollback revision; a snapshot failure blocks the save (`snapshot: false` is a no-op). Use list/diff/restore for regressions: if a repair worsens or breaks the model, restore a snapshot instead of hand-reverting rows, also when the saved revision no longer builds. Restore creates a new revision and snapshots the replaced state, so rollback is undoable; legacy workbook-only snapshots preserve current code.

## Completion gate

Finish only when all of these are true:

- validation has no errors and every warning has been assessed;
- requested assemblies and editable parameters are present;
- the declared sheet topology validates, every planned child is reachable, and final `scene.subsheets` names every expected child (plus the expected subproject count);
- output/reference counts and model bounds are plausible;
- every returned view was inspected (the four default views at minimum);
- every planned child sheet and required local output group has a successful current-revision `confbuild_inspect_outputs` four-image set, repeated for targets of the last repair;
- the final completion render is unscoped and contains `default`, `right`, `front` and `left`;
- the exact intersection preflight has no findings and no unverified pairs from an exhausted, failed or vertex-limited precise check;
- no unexplained floating, sinking, detachment or unintended collision remains;
- major recognizable parts use appropriate native row types where available;
- every requested animation has visible Start and Stop INPUT buttons calling working handlers, every custom scene update forces its render frame, and Stop halts the owned motion cleanly;
- the result is recognizably aligned with the request;
- remaining limitations are explicitly reported.

Report the URL, iterations, validation, native types, per-view findings, fixes, and limits. Pass
the structured outcome fields. The server rejects `completionState: complete` for a missing,
scoped, stale, incomplete-view, or blocked final render; follow its zoom arguments, or use
`partial` with truthful residual categories.

## Persistent AI project image history

Applied revisions and completed renders save a project-owned PNG in Project Settings → AI history, all from the camera frozen at the first capture (same-revision retries reuse it). Commit and render each iteration before the next mutation and retry failed captures; the PNGs outlive expiring MCP renders.
