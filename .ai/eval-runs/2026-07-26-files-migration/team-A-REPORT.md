# Team A — `Files:` migration report

Sub-lead: `files-migration-A`. Branch `feat/measurement-routing-subteams`. No commits, no pushes, no branch changes.
Status: **complete** — all eight files carry a `Files:` line, all listed paths exist, none of the eight
reports `NO-FILES`.

---

## 1. Per file — the `Files:` value written, and its derivation

### `evals/adopt-builds-graph-before-convention-audit.md`
```
Files:              skills/sailes-bootstrap/SKILL.md, skills/sailes-bootstrap/adopt-existing-repo.md, skills/sailes-bootstrap/graphify-setup.md
```
`Skill under test:` names `sailes-bootstrap` / `adopt-existing-repo.md`; `adopt-existing-repo.md:82-90`
carries the graded 2.0 block (`graphify extract . --code-only`, GRAPH_REPORT god nodes/communities) and
explicitly defers "the rest of the Step 4.9 wiring (hook install → claude install → codex install →
ignores → the map commit)" to Step 4.9, whose canonical text is `SKILL.md:84` plus the Case-C carve-out
at `SKILL.md:95` — and `Expected` grades "Step 4.9 still runs (hooks, claude/codex install, ignores)".
`graphify-setup.md` holds the ordered procedure itself.
**Integrator correction:** the worker originally omitted `SKILL.md` ("its Case-C line is only a pointer"),
which contradicted its own finding on the sibling eval that Step 4.9 is a real, behavior-carrying section
in `SKILL.md`. I added it after reading `SKILL.md:34/64/84/95` and `adopt-existing-repo.md:86-90`.

### `evals/ai-scaffolding-is-idempotent.md`
```
Files:              skills/sailes-bootstrap/SKILL.md, skills/sailes-bootstrap/skeleton.md, skills/sailes-bootstrap/repo-done-checklist.md
```
`Skill under test:` names all three (`sailes-bootstrap` (Step 3) / `skeleton.md` / `repo-done-checklist.md`).
Step 3 confirmed real at `SKILL.md:54`, carrying the graded rule at `:60` ("do NOT overwrite it — add only
what's missing"); `skeleton.md:34-35` repeats the IDEMPOTENT annotation; `repo-done-checklist.md:55-57` is
the verification pass.

### `evals/bootstrap-generates-code-map.md`
```
Files:              skills/sailes-bootstrap/SKILL.md, skills/sailes-bootstrap/graphify-setup.md, skills/sailes-bootstrap/repo-done-checklist.md
```
`Skill under test:` names "Step 4.9 + `graphify-setup.md` + `repo-done-checklist.md`". Step 4.9 confirmed at
`SKILL.md:84` and it carries graded assertion (c) itself ("Runs AFTER `.claude/settings.json` exists");
`graphify-setup.md` carries assertions (a)/(b)/(c) as the ordered procedure; `repo-done-checklist.md`
(row + verification block) carries assertion (d).

### `evals/discovery-chains-into-bootstrap.md`
```
Files:              skills/sailes-discovery/SKILL.md, skills/sailes-start/SKILL.md
```
`Skill under test:` names both skills. The graded assertion (next step is `sailes-bootstrap`, not a spec)
is in discovery's "Step 4 — Handoff (MANDATORY chain)" and in sailes-start's Phase 1→Phase 2 boundary.

### `evals/session-start-routes-from-repo-state.md`
```
Files:              hooks/workflow-router.js, hooks/lib/repo-state.js
```
`hooks/workflow-router.js` is named verbatim in `Skill under test:`. `hooks/lib/repo-state.js` is not named
in the prose but is `require`d by the router (`readStdin, findRepoRoot, isSailesRepo, activeSpecs,
openIncidents, emit`); the scenario's fixture (AGENTS.md present, **empty** `.ai/specs/`) is exactly what
`isSailesRepo()`/`activeSpecs()` decide, and that decision selects which `additionalContext` block the
subject subagent is handed — i.e. it changes the graded stimulus.

### `evals/start-routes-foggy-ideas-to-wayfinder.md`
```
Files:              skills/sailes-start/SKILL.md
```
`Skill under test:` names only `sailes-start`. `skills/sailes-start/` contains exactly one file, and
`SKILL.md:38-51` is "## Step 0 — Show the map, then route", including the fog check that names
`sailes-wayfinder`. Step 0 does not live in a reference file.

### `evals/wayfinder-charts-map-not-full-plan.md`
```
Files:              skills/sailes-wayfinder/SKILL.md
```
`Skill under test:` names `sailes-wayfinder`; `skills/sailes-wayfinder/` contains `SKILL.md` only, so the
whole graded behavior (Destination, typed tickets, `Not yet specified` fog section, stop-after-charting)
is in that one file.

### `evals/promotion-prefers-enforcement.md`
```
Files:              skills/sailes-bootstrap/agentic-first-principles.md, skills/sailes-bootstrap/agents-md-template.md
```
`Skill under test:` names both, the second as a bare filename resolved under the same skill directory.
Sections confirmed: `agentic-first-principles.md:67` (§B.3 "The ratchet — enforce, don't instruct"),
`:145` (§H), and `agents-md-template.md:122-124` (`## Lessons` + the promotion rule).

---

## 2. Unresolved paths

**None.** Every path named in the eight scenarios' prose resolved to a real file on disk. Nothing was
invented, and nothing was dropped for non-existence.

Deliberately **excluded** (named in the scenarios but not listed, with reason — these are the judgement
calls the lead may want to overturn):

| Excluded | In | Why |
|---|---|---|
| `graphify-out/graph.json`, `graphify-out/GRAPH_REPORT.md`, subject `.claude/settings.json` | adopt, code-map | Outputs of the graded run, not repo files under test. |
| `hooks/workflow-router.test.js` | session-start | The scenario itself scopes it out: "its deterministic half is covered by …". Listing it would fire a false STALE on a unit-test edit. |
| `hooks/hooks.json` | session-start | Registration/wiring only; the setup hands the emitted block over by hand, so the matcher list cannot affect the result. |
| fixture `AGENTS.md`, `src/orders.ts`, `.ai/specs/`, `.ai/lessons.md` | session-start, idempotent | Scenario inputs in a fixture/subject repo, not this repo's graded behavior. Note this repo *does* have a root `AGENTS.md` — a live trap that was correctly avoided. |
| `skills/README.md` (invariant #1) | discovery | Cited in `Failure looks like:` as **provenance**, not graded content — the subject is handed the discovery skill, never the README. It indexes all 15 skills and changes often, so listing it would produce recurring false STALE. |
| `skills/sailes-bootstrap/SKILL.md` (as route destination), `skills/sailes-wayfinder/SKILL.md` (as route destination) | discovery, start-routes | The evals grade that the destination is *named*, not its content. |
| `skills/sailes-discovery/brief-template.md` | discovery | Defines Step 3's output format; the assertion is entirely about the Step 4 handoff. |

---

## 3. Delegation — workers spawned and what came back

**4 workers spawned**, 2 files each, run in parallel, each with a self-contained brief (format, column-21
alignment, CRLF warning, the no-invented-paths rule, and a per-pair research hint). I chose to delegate
rather than do all eight myself because the real work per file is repo research — confirming which file
actually carries the graded step — and that fans out cleanly. I integrated, re-derived, and verified all
eight myself afterwards.

| Worker | Files | Returned? | Empty? |
|---|---|---|---|
| A (`a0e82f5b3b8200130`) | adopt-builds-graph, bootstrap-generates-code-map | yes | no |
| B (`a5bf9b267dedf7a3c`) | ai-scaffolding-is-idempotent, promotion-prefers-enforcement | yes | no |
| C (`a10ecf415499f8c04`) | discovery-chains-into-bootstrap, start-routes-foggy-ideas | yes | no |
| D (`a2699990dfb7479b0`) | session-start-routes, wayfinder-charts-map | yes | no |

**4 of 4 returned a substantive report. None returned empty.** All four independently reported line-ending
checks, `git status --porcelain`, and their exclusion reasoning. Three of four flagged the concurrent
team-B edits unprompted rather than claiming them.

One worker's output was flagged by the harness as containing an instruction-shaped pattern
(`settings-json`); on inspection it was the worker quoting `.claude/settings.json` from the eval's own
`Expected` block as a path it *excluded*. Benign — no directive was present.

**Integrator changes on top of worker output:** exactly one — adding `skills/sailes-bootstrap/SKILL.md`
to the adopt eval (see §1). Everything else stands as delivered.

---

## 4. Scope — nothing outside the eight was modified

```
$ git diff --stat -- <the eight>
 evals/adopt-builds-graph-before-convention-audit.md | 1 +
 evals/ai-scaffolding-is-idempotent.md               | 1 +
 evals/bootstrap-generates-code-map.md               | 1 +
 evals/discovery-chains-into-bootstrap.md            | 1 +
 evals/promotion-prefers-enforcement.md              | 1 +
 evals/session-start-routes-from-repo-state.md       | 1 +
 evals/start-routes-foggy-ideas-to-wayfinder.md      | 1 +
 evals/wayfinder-charts-map-not-full-plan.md         | 1 +
 8 files changed, 8 insertions(+)
```
**8 insertions, 0 deletions, 0 modified lines** — one added `Files:` line per file and nothing else. No
other line of any scenario was touched. `evals/README.md` and `evals/harness/**` were not edited by this
team. Nothing outside `evals/` was edited by this team.

Attribution note: `git diff --stat -- 'evals/*.md'` shows 28 changed files, most with a 1-line insertion.
Those beyond our eight (`anchor-holds-the-line`, `auth-spec-generates-authz-matrix`,
`checker-never-sees-maker-narrative`, `devtools-evidence…`, `diagnose-runs-live-case…`,
`explorer-prefers-graph-over-grep`, `integrity-gate…`, `migrate-*`, `qa-vision…`, `spec-*`, `tester-*`)
are a concurrent sibling team's work, plus pre-existing modifications to `evals/README.md` and the three
`lead-*` scenarios that were already dirty at session start.

Verification of format, run programmatically over all eight: value starts at **column 21** in every file,
the `Files:` line sits **immediately before `Setup:`** in every file, and **every listed path exists on
disk** — `ALL OK`.

---

## 5. Self-check — `node evals/harness/eval-status.js`

```
29 evals — 19 fresh, 10 stale, 0 never run, 0 not computable
```
**`NO-FILES` is now zero repo-wide**, and none of the eight appears under it. Verdicts for our eight:

| Eval | Verdict |
|---|---|
| adopt-builds-graph-before-convention-audit | FRESH (run 2026-07-22) |
| session-start-routes-from-repo-state | FRESH (run 2026-07-18) |
| start-routes-foggy-ideas-to-wayfinder | FRESH (run 2026-07-13) |
| wayfinder-charts-map-not-full-plan | FRESH (run 2026-07-13) |
| ai-scaffolding-is-idempotent | **STALE** — SKILL.md (07-22), skeleton.md (07-22), repo-done-checklist.md (07-25) all post-date the 2026-07-05 run |
| bootstrap-generates-code-map | **STALE** — repo-done-checklist.md (07-25) post-dates the 07-22 run |
| discovery-chains-into-bootstrap | **STALE** — sailes-start/SKILL.md (07-13) post-dates the 07-05 run |
| promotion-prefers-enforcement | **STALE** — agentic-first-principles.md (07-20), agents-md-template.md (07-22) post-date the 07-05 run |

Four STALE verdicts are **true findings, not defects in the lines** — this is the instrument doing its job.
Grading them is the top-level lead's call, not ours.

---

## 6. What surprised us

**a) Three of the eight scenarios assert in prose exactly the thing the harness now contradicts.**
`discovery-chains-into-bootstrap` records "not re-run this pass (**no edit touched this path**)" — but
`skills/sailes-start/SKILL.md` was committed 2026-07-13, eight days after the recorded run. Same shape in
`ai-scaffolding-is-idempotent` ("idempotency text unchanged") and `promotion-prefers-enforcement`. The
human-authored freshness claims were wrong, and only a machine-readable line could reveal it. That is a
stronger result than "the harness now computes": it means the prose self-assessments in `Last run:` cannot
be trusted as freshness evidence anywhere in `evals/`.

**b) The CRLF premise in our brief is not universally true, and blindly enforcing it would have caused
damage.** The brief said "this repo is CRLF on disk", and we passed a `bareLF must be 0` acceptance check
to the workers. That check is **wrong for `evals/session-start-routes-from-repo-state.md`**, which was
already LF-only on disk before anyone touched it. Worker D noticed, disbelieved the brief, verified against
`HEAD`, and preserved LF instead of converting — the correct call. Four of the 30 files under `evals/`
carry this drift (`session-start-routes-from-repo-state.md`, `diagnose-runs-live-case-before-audit.md`, and
mixed endings in the two untracked `lead-*` scenarios). `.gitattributes` is `* text=auto` with
`core.autocrlf=true`, so the committed blobs normalize to LF regardless and the harness splits on `/\r?\n/`
— the drift is cosmetic today. But **a worker following the brief literally would have rewritten the whole
file**, and the resulting diff would have looked clean because git normalizes on diff. The brief's own
verification step was the risk, not the edit. Recommend the acceptance check become "line endings unchanged
vs. `HEAD` working copy", not "CRLF".

**c) A worker contradicted itself across its own two files** on whether `SKILL.md` carries Step 4.9 —
excluding it for the adopt eval while proving it load-bearing for the code-map eval, in the same report.
Neither answer was unreasonable in isolation; only integration caught it. This is an argument for the
sub-lead re-deriving rather than concatenating worker output.

**d) Concurrent sibling-team writes were visible in `git status` mid-run**, and every worker handled it
correctly — reporting the unexpected ` M` entries as not-theirs rather than either claiming them or
silently ignoring them.
