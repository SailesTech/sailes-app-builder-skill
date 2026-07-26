# Team `files-migration-C` — `Files:` line migration, eight scenarios

Sub-lead report. Date 2026-07-26. Branch `feat/measurement-routing-subteams`.
No commit, no push, no branch switch. Status: **complete — 8 of 8 written.**

## 0. Method — delegated, 8 workers, one file each

I delegated. Eight `general-purpose` workers, one scenario per worker, spawned concurrently in a
single message. Rationale: the eight files are disjoint (no write conflicts), and the actual work
is not the edit — it is a *judgment* about which repo files, if edited, would invalidate that
scenario's recorded result. That judgment benefits from an independent read of the scenario;
batching it into one head would have made it a rubber stamp.

What I did centrally rather than per-worker, to keep the workers cheap and consistent:

- Established the **convention** from the five scenarios that already carried the line
  (`evals/lead-*.md`): prose drops the `skills/` prefix; a load-bearing `agents/<role>.md` brings
  its `codex-agents/<role>.toml` mirror; the line lists *everything whose edit invalidates the
  PASS*, not only what the prose names.
- Verified the repo layout up front (`hooks/` contents, `skills/` tree, `evals/fixtures/` contents)
  and handed each worker the facts, so no worker had to re-derive them.
- Supplied a **CRLF-safe insertion recipe** (a `node -e` that replaces `/^Setup:/m` with
  `'Files:              …\r\nSetup:'`), plus a mandatory `cat -A` re-read. This is the single most
  likely silent failure on this task and I did not leave it to chance.
- Integrated and re-verified everything myself afterwards (§4).

## 1. Per file — the value written, and how it was derived

Format on every line: `Files:` + 14 spaces, value at column 21. Verified: label width 20 on all eight.

### `evals/checker-never-sees-maker-narrative.md`
```
Files:              agents/team-lead.md, agents/checker.md, skills/sailes-bootstrap/agent-team-structure.md, codex-agents/team-lead.toml, codex-agents/checker.toml
```
Prose named only `agent-team-structure.md` (§Gate isolation, line 99). But `Setup` says "ask it,
**as lead**, to dispatch `checker`", so the lead's dispatch rule (`agents/team-lead.md:47`) and the
checker's intake rule (`agents/checker.md:9`) are both load-bearing; Codex mirrors restate both
verbatim.

### `evals/qa-vision-verifies-against-baseline.md`
```
Files:              skills/sailes-bootstrap/agent-team-structure.md, skills/sailes-implement/SKILL.md, agents/qa.md, codex-agents/qa.toml
```
The two prose subjects resolved to `skills/…/agent-team-structure.md` (qa role row + "Vision-verify
(UI)" gate rule) and `skills/sailes-implement/SKILL.md` (step 4 is line 33 and carries the
vision-verify clause). The graded verdict is the `qa` role's, so `agents/qa.md` + mirror.

### `evals/tester-cannot-lower-its-own-risk-tier.md`
```
Files:              skills/sailes-test/SKILL.md, skills/sailes-test/test-plan-template.md, agents/tester.md, codex-agents/tester.toml
```
`sailes-test` (Step 5) → `SKILL.md`, which holds the trigger table and the "you may raise, never
lower" rule verbatim. `test-plan-template.md` is where the tier is *recorded* and independently
restates the no-lowering rule, so an edit there could flip the result. Role + mirror restate the
rule too.

### `evals/tester-derives-cases-before-reading-code.md`
```
Files:              skills/sailes-test/SKILL.md, skills/sailes-test/test-plan-template.md, agents/tester.md, codex-agents/tester.toml
```
`sailes-test` (Step 1 informational isolation, SKILL.md:45; DRAFT hard stop, :68). The Expected
grades plan *structure* ("the `❓`/questions section leads the plan", DRAFT status) — that structure
is defined in `test-plan-template.md`. Role + mirror encode "never open the implementation before
emitting the behavior list".

### `evals/tester-never-weakens-a-frozen-assertion.md`
```
Files:              skills/sailes-test/SKILL.md, agents/tester.md, codex-agents/tester.toml
```
`sailes-test` (Step 4 one-way rule, SKILL.md:95–98 + freeze/write gate table :166–178). The
`Re-run:` block states the second PASS was obtained "under the 1.10.1 skill + `agents/tester.md`" —
criterion (b) *is* the role's write-access guard, so the role file is not optional here.
`test-plan-template.md` deliberately excluded: it supplies the fixture's `Status: FROZEN` header but
nothing graded depends on its content.

### `evals/devtools-evidence-does-not-replace-a-suite-test.md`
```
Files:              skills/sailes-test/references/browser-e2e.md, skills/sailes-design/browser-inspect.md, agents/qa.md, codex-agents/qa.toml
```
Two prose subjects plus a third named by the scenario's own `Notes:` — "re-run it whenever
`browser-inspect.md` or `browser-e2e.md` §Devtools is not a test is edited", which is a direct
instruction about invalidation. `browser-inspect.md` is unambiguous: only one file of that name
exists in the repo.

### `evals/integrity-gate-reports-measurements-not-impressions.md`
```
Files:              skills/sailes-design/SKILL.md, skills/sailes-design/browser-inspect.md, agents/qa.md, agents/fe-dev.md, codex-agents/qa.toml, codex-agents/fe-dev.toml
```
Its `Skill under test:` names four things across two lines; all four resolved, both roles have Codex
mirrors. `evals/fixtures/browser-probe/**` deliberately **excluded** — the scenario's own `Notes:`
say the probe's correctness is a *separate* runnable test and "keep them apart: 1.14.0 conflated
them"; and the recorded run states Arm A's instrument was "THE SHIPPED PROBE (the §1 code block,
**extracted from the doc**)", i.e. from `browser-inspect.md`, which is on the line — not from
`run-probe.mjs`. Listing the fixture would make an unrelated fixture edit spuriously stale this eval.

### `evals/anchor-holds-the-line-deep-in-session.md` — partial, deliberately
```
Files:              hooks/workflow-router.js
```
**The primary subject is missing and that is the correct outcome.** See §2.

## 2. Unresolved paths — named, with why

**`hooks/prompt-anchor.js`** — the *primary* subject of `anchor-holds-the-line-deep-in-session`.
**Not on this branch.** Verified three ways: `test -e` → missing; `ls -laR hooks/` → exactly
`framework-version-check.js`, `hooks.json`, `lib/repo-state.js`, `workflow-router.js`,
`workflow-router.test.js`; `git ls-files hooks/` → the same five. It is real —
`git log --all -- hooks/prompt-anchor.js` finds commits `f4cd0a8`, `da55d24`, `4a97011` — but it
lives only on the unmerged `enforce/*` branches, exactly as the scenario's own header says. Not
checked out, not written.

> **Escalation.** The line written for this eval covers the **secondary** subject only. The harness
> cannot watch a cross-branch file by construction: `eval-status.js:124` tests `fs.existsSync`
> against the working tree and `lastCommitISO` runs `git log -1` on the current branch. So if
> `prompt-anchor.js` changes on `enforce/*` and merges, this eval's coverage computation will not
> notice. A green reading here is a statement about `workflow-router.js` and silent about the anchor.

**`settings-page.before-fix.html`** — named in the `Last run:` of the integrity-gate eval as the
file the fixture was restored from. `find . -iname "*settings-page*"` (excluding `.git/`) returns
zero hits. It was a scratch working copy, never committed. Left out.

**`.ai/screens/`** — named in `qa-vision-verifies-against-baseline`'s Setup and Expected.
`test -e .ai/screens` → missing. It is a runtime artifact directory of the *graded fixture*, not a
repo file. Left out. Same for the target-project artifacts that scenario's Expected implies
(`.ai/specs/ui-spec.md`, `design-system/MASTER.md`) — named inside the role definitions as things a
*consuming* project has, absent here.

**Graded-fixture code named in scenarios** — `charge.ts`, `invoice.ts`, the frozen plan and its
suite, the Pipedrive/Slack webhook spec and impl, `tests/e2e/leads.spec.ts`. None exist in this
repo; all are artifacts the grader constructs. All left out.

**Two judgment calls, both excluded, for the anchor eval** (both files *do* exist, so this is
judgment, not availability):
- `evals/session-start-routes-from-repo-state.md` — cited in `Failure looks like:` as the recorded
  RED baseline. It is a *peer scenario document*, not a graded artifact. Listing it would flip this
  eval to STALE every time someone records a new `Last run:` on that sibling — a routine,
  non-invalidating edit. False alarms erode the instrument as surely as false greens.
- `.ai/specs/2026-07-18-prompt-anchor.md` — the design/decision record the eval cites for D2/D3.
  No model behavior is graded against a spec's prose. Consistent with the established convention,
  which lists roles, skills and hooks — never specs.

**Deliberate narrow calls worth a second opinion** (flagged, not hidden): `references/techniques.md`
excluded from both `tester-*` evals that touch mutation/async technique (it defers to SKILL.md's
tier table rather than defining it); `skills/sailes-design/browser-inspect.md` excluded from
`qa-vision-verifies-against-baseline` (that is the *categorical measurement* half of the UI verdict,
not the vision-vs-baseline behavior being graded). If the lead prefers a wider net, each is a
one-token change.

## 3. Workers — 8 spawned, 8 returned, 0 empty

| # | Scenario | Returned | Empty? |
|---|---|---|---|
| 1 | `checker-never-sees-maker-narrative` | yes | no |
| 2 | `qa-vision-verifies-against-baseline` | yes | no |
| 3 | `tester-cannot-lower-its-own-risk-tier` | yes | no |
| 4 | `tester-derives-cases-before-reading-code` | yes | no |
| 5 | `tester-never-weakens-a-frozen-assertion` | yes | no |
| 6 | `devtools-evidence-does-not-replace-a-suite-test` | yes | no |
| 7 | `integrity-gate-reports-measurements-not-impressions` | yes | no |
| 8 | `anchor-holds-the-line-deep-in-session` | yes | no |

Every worker returned all four required items (value, derivation, unresolved paths, CRLF + scope
confirmation). Every one ran its own `cat -A` CRLF check and its own `eval-status.js` self-check.
Not one required a chase. Cost: ~288k subagent tokens, ~82 tool calls, all eight inside ~82s wall
clock (concurrent).

## 4. Scope — nothing outside the eight was modified

Verified four ways, not asserted:

1. **`git diff --numstat` on the eight** → every one is exactly `1  0` (one insertion, zero
   deletions). A broken CRLF regex would have rewritten the whole file and shown ~40/40.
2. **CRLF intact on all eight** — line count equals CR-terminated line count on every file
   (15/15, 14/14, 29/29, 27/27, 41/41, 43/43, 51/51, 42/42).
3. **Alignment** — `Files:` label width is 20 on all eight, value at column 21.
4. **Against the lead's own baseline** (`BASELINE-git-status.txt`, captured 2026-07-26T06:20:11Z):
   `comm -23` of current status vs baseline shows **only `evals/*.md` files appeared as newly
   modified — nothing else in the repository**. Of those 24, eight are mine; the other sixteen
   belong to the sibling migration teams working the same tree. `evals/README.md` and
   `evals/harness/**` are untouched by team C (README was already dirty at baseline; harness is
   untracked-new from the lead).

Every path written was existence-checked. My own re-verification: **all 30 listed paths across the
eight files resolve to real files on disk. Zero missing.**

## 5. Self-check (not my gate)

`node evals/harness/eval-status.js`:

```
29 evals — 19 fresh, 10 stale, 0 never run, 0 not computable
```

None of my eight reports `NO-FILES`. Repo-wide `NO-FILES` is now **0** — team C's eight closed the
last of them (the anchor eval was the final one standing).

My eight, individually:

| Scenario | Verdict |
|---|---|
| `checker-never-sees-maker-narrative` | **STALE** — run 2026-07-02; all five deps changed since |
| `qa-vision-verifies-against-baseline` | **STALE** — run 2026-07-02; all four deps changed since |
| `tester-cannot-lower-its-own-risk-tier` | FRESH — run 2026-07-20 |
| `tester-derives-cases-before-reading-code` | FRESH — run 2026-07-20 |
| `tester-never-weakens-a-frozen-assertion` | FRESH — run 2026-07-20 |
| `devtools-evidence-does-not-replace-a-suite-test` | FRESH — run 2026-07-25 |
| `integrity-gate-reports-measurements-not-impressions` | FRESH — run 2026-07-25 |
| `anchor-holds-the-line-deep-in-session` | FRESH — run 2026-07-18 (see §6, this reading is misleading) |

The two STALE results are the instrument working, not a defect: both are 2026-07-02 PASSes whose
subjects were edited during the measurement-routing work. They now say so out loud.

## 6. What surprised me

**a) `FRESH` on an eval that concluded nothing.** `anchor-holds-the-line-deep-in-session` records
`Last run: 2026-07-18 · INCONCLUSIVE — arms did not separate, and the fixture is why`. The scenario
says in its own text that the hook must NOT merge and that the eval "should not be cited as if it
had" answered anything. It now prints the same reassuring `FRESH` as a genuinely passing eval,
because the verdict vocabulary models *staleness* only and never *outcome*. This is arguably the
silent-instrument trap described in `eval-status.js:21-23` reappearing one level up. Worth
considering whether the reporter should surface the recorded outcome — or at minimum flag non-PASS
runs — alongside freshness. Flagging, not fixing: `evals/harness/**` is out of my scope.

**b) The harness reads committed history, so this branch's own edits are invisible to it.**
`lastCommitISO` shells out to `git log`. `agents/tester.md`, `agents/qa.md` and friends are
*modified in the working tree right now* and uncommitted, so several evals currently reading FRESH
will flip to STALE the moment this branch commits. Nobody should read today's 19-fresh count as the
post-merge number. Two of my workers caught this independently.

**c) The convention is broader than "Skill under test".** I expected the task to be prose→path
transcription. It is not: the five pre-existing lines list files the prose never mentions (the Codex
`.toml` mirrors especially). Half of every derivation was deciding whether a *role definition* was
load-bearing, and the answer differed per scenario — `tester-never-weakens-a-frozen-assertion` needs
`agents/tester.md` because criterion (b) literally *is* the 1.10.1 role guard, whereas the same file
is merely corroborating elsewhere.

**d) One coverage gap found in passing, outside my eight:** `evals/fixtures/browser-probe/**` is
referenced by no `Files:` line in any scenario. The probe's own runnable correctness test is
therefore uncovered by the provenance instrument. Contrast
`evals/diagnose-runs-live-case-before-audit.md`, which does correctly list its fixture
(`evals/fixtures/diagnose-orders-export/server.js`) — there the fixture *is* the case under test.
Reported, not acted on.

**e) Zero worker friction.** Given the CRLF recipe up front, eight independent workers produced
eight byte-clean single-line insertions with no retries. The failure mode the brief warned about
(a `\n` regex silently matching nothing) did not occur once — because it was pre-empted centrally
rather than discovered eight times.
