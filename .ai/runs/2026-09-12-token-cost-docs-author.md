# docs-author run — 1.33.0 token-cost-of-running

Worker: docs-author-1. Base merged: `git merge --ff-only feat/1.33.0-token-cost` -> 4e6acf2,
ancestor check passed.

Archify: MISSING at session start (`~/.claude/skills/archify` had no SKILL.md).
Installed via `npx skills add tt-a1i/archify -g` per the SKIP protocol's step 1 one-liner
(no interactive user available to ask; ran the documented remedy). Result: version 2.17
(floor 2.12), `doctor` reports all checks `[ok]`. Proceeding with the authoring loop, not a SKIP.

## Evidence gathering (in progress)

## Diagrams touched, with reasoning

Grepped all five diagram JSONs for anything 1.33.0 changed: `STATE.md|lessons.md|backlog.md|
session-start|hooks-template|autoCompact|session-handoff|token-report|archive`, plus `adopt-
existing-repo|Upgrade mode|shadow-role|repo-done-checklist`.

- **architecture.json** — updated. `tools` component + card: named `token-report.js` (new
  tools/*.js CLI, tools/token-report{.test,.frozen.test}.js exist); sync-blocks bullet "three
  blocks" → "four blocks: …, session-handoff (1.33.0)" (tools/blocks.json now lists a 4th block).
  `memory` component + "Client Repos" card: named `.ai/archive/` and the budgeted (<9,500-byte)
  session-start.sh emission.
- **dataflow.json** — updated. `memory-files` node + "The Memory Loop" card: same archive/budget
  evidence as above.
- **workflow.json** — no change. Session-handoff (/clear after phase gate) is a session-lifecycle
  mechanic inside the existing `phase_gates` ⇄ `implement` loop, one level below what this diagram
  tracks (phases/lanes, not per-role session mechanics). Empty delta.
- **sequence.json** — no change. Diagrams "Closing a Spec (docs-delta gate)", unrelated actors.
  Empty delta.
- **lifecycle.json** — no change, and it is the only one of the five that currently passes
  `validate --quality showcase` cleanly. Empty delta.

## Root-cause finding: pre-existing archify-version drift, not a 1.33.0 regression

`docs/architecture/architecture.html` is stamped `archify 2.12.0` (its stylesheet header). The
archify just installed is **2.17**. Its `composition/desktop-readability` check treats
`architecture.json`'s `meta.viewBox` `[2260, 980]` as too wide for a 1440px desktop reader — the
scale factor (~0.41) puts even the *preferred* sublabel font size under the 6px legibility floor,
structurally, independent of any node's text. Reproduced identically on the **unmodified base**
(pre-1.33.0 `HEAD`): same failure, same evidence shape. `dataflow.json`, `workflow.json`, and
`sequence.json` fail `validate --quality showcase` too, entirely on content I never touched this
session (6 of 7 dataflow errors, all of workflow's and sequence's). Only `lifecycle.json` passes.

I fixed every `layout/constraint` error attributable to my own edits (widened `tools`/`memory` in
architecture.json, added `width: 165` to dataflow's `memory-files`) and confirmed, via a second
round using a minimally-patched *base* snapshot, that the remaining failure is structural and
outside a bounded content-only repair. Per the authoring loop's own rule ("two consecutive rounds
without improvement → stop and report"), I stopped there rather than undertaking an unbounded
four-diagram re-layout as a side effect of a release-notes update.

## Receipts

- `.ai/docs-deltas/2026-09-12-release-1.33.0-architecture-validate.json` — validate, showcase,
  `ok:false`, single structural `composition/desktop-readability` diagnostic, zero
  `layout/constraint` errors (my content is geometrically sound within its own box).
- `.ai/docs-deltas/2026-09-12-release-1.33.0-dataflow-validate.json` — same shape; the one error
  caused by my edit is fixed in the committed file (this receipt predates that last fix by one
  round, kept as the honest run artifact).
- `.ai/docs-deltas/2026-09-12-release-1.33.0-compare-attempt.json` — the real
  `compare architecture <base=pre-1.33.0 HEAD> <head=edited>` invocation; fails at the input stage,
  before diffing, for the same structural reason on the base side.
- `.ai/docs-deltas/2026-09-12-release-1.33.0-notes.md` — full narrative, evidence table, and the
  recommendation to open a dedicated re-layout pass against archify ≥2.17.

## Outcome

Content: **done**, evidence-backed, both touched diagrams free of self-introduced layout defects.
Receipt: **blocked** — no passing `deliver`/`compare` receipt this cycle, for a structural,
pre-existing (archify-version) reason unrelated to 1.33.0, reported rather than silenced or forced.
