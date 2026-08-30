# Spec: the suite is a one-way ratchet

Status: implemented — evidence: `npm test` → exit 0 (17 suites) · `node tools/sync-blocks.js --check` → all blocks in sync · `node codex-agents/parity.test.js` → exit 0, new invariant mutation-proven on both twins · `release-hygiene` → five stamps at 1.31.0 · docs-delta: EMPTY, with an `archify compare` receipt showing 0 changes (`.ai/docs-deltas/2026-08-30-release-1.31.0.json`) · checker: not re-run on this change — see Closure · qa: n/a — this repo ships no running app; the behavior gate here is the A/B
Location: `.ai/specs/` root, deliberately — the lifecycle moves a spec to `implemented/` when the
        feature is **deployed**, and deploying here means pushing `main`. Local commits only, by
        the human's instruction. The `git mv` belongs to whoever pushes.
Weight: contract fix — this changes how three existing rules are *conditioned*, adds one gate
        section where the mirror already exists, and pays for itself by compressing duplication.
        No new sync block, no new tool, no new artifact.
Source: the human's brief, 2026-08-30 — "optymalizacja skilla żeby nie produkował zbędnego kodu,
        działał szybciej, ale zachował zalety testowania". Scope confirmed by the human: **test
        volume** and **process ceremony**; production-code minimality is explicitly out.
Follows: `.ai/specs/2026-08-30-test-surface-not-test-count.md` (1.30.0) — same session, same
        principle one turn further. That one said volume at the wrong surface is not coverage.
        This one asks what happens to the volume that is already there.

## TLDR

The framework mandates test volume per item — *every* affected path, *every* field × six cases,
*every* action × role, min−1/min/min+1/max−1/max/max+1 at every boundary — and those mandates are
**not conditioned on risk**. The risk tier scales only the *proof of detection*, never the *size of
the list*. Meanwhile there is **no rule anywhere in the repo that removes a test.** Growth is
per-item and automatic; shrinkage needs an unrelated cause (flakiness), a specific named
replacement (the deployed probe), or a human's explicit strike. Never the reason that matters:
*this test detects nothing.*

So the suite is a ratchet that turns one way. The mutation machinery already **finds** tautological
assertions — `techniques.md:136` names them outright — and the only remedy it offers is "write more
test, or write an explanation".

**The one sentence:** detection, not enumeration, is what a test is for — so the tier that decides
how hard detection must be proven should also decide how long the list is, and a case that cannot
fail should leave.

## Open Questions — answered under stated assumption

The human delegated this loop ("pracuj w loopie dotąd aż nie osiągniesz zadowalającego efektu") and
answered the two scope forks directly. The remaining forks are mine, surfaced in the report.

- **Q1 — Does the tier scale the case list, or do we cut the mandates outright?** → *Tier scales
  the list.* Cutting `every action × role` would delete a genuinely load-bearing rule; the authz
  matrix exists because permissions are where silent holes live. Conditioning it on the tier its
  own triggers already define costs one clause and removes nothing. Alternative — a flat "keep it
  short" — is unmeasurable and would be ignored.
- **Q2 — Who deletes a dead test?** → *`tester` names it, the human strikes it.* This preserves
  `agents/tester.md:24` (a frozen ID is never quietly removed) and matches how the deployed-probe
  trade was already resolved in 1.30.0. Alternative — letting `tester` delete — creates the exact
  hole the never-weaken rule exists to close: "it detected nothing" is one rationalisation away
  from "it was red".
- **Q3 — Net text budget.** → *Net zero or negative.* 1.30.0 cost +11.0% of model-facing context;
  a second additive release would make "faster" true only on paper. Paid for by compressing the
  four-times-repeated integration-coverage mandate and the duplicated boundary/technique text.

## Non-goals

- Production-code minimality. The human scoped it out; `checker`'s new surplus section will catch
  the gross cases as a side effect, and that is enough for now.
- Weakening the mutation machinery, the tier triggers, or the ratchet-up rule. The tier may still
  never be lowered.
- Touching the pre-implement gate. It has paid twice on measurement.
- Any change to `qa`'s deployed-probe duty from 1.30.0.

---

## Phase 1 — the tier scales the LIST, not only the proof

**The defect.** `skills/sailes-test/SKILL.md:100-137` computes a tier from triggers and uses it for
exactly one thing: how detection is proven (Stryker / per-ID mutation / green suite). Every volume
mandate in the skill and its references applies **identically at tier C and tier A**:

| Mandate | Where | Multiplier |
|---|---|---|
| every affected API + key UI path gets a test | `sailes-spec/SKILL.md:43,136,167,194` | linear in surface |
| every field × {valid, invalid, empty-when-required, boundary} + optional filled/empty | `sailes-test/SKILL.md:144`, `browser-e2e.md:13-22` | 6 × fields |
| every action × every role → allow/deny + anonymous row | `security-checklist.md:41`, `sailes-implement/SKILL.md:41` | cross-product |
| min−1, min, min+1, max−1, max, max+1 at every boundary | `sailes-test/SKILL.md:53`, `techniques.md:37` | 6 × boundaries |
| every transition and every illegal transition | `techniques.md:59` | n² in states |

**Rule.** The tier conditions the *list*, in the same table that already conditions the proof:
tier A enumerates, tier C takes one representative per equivalence partition and says so. This is
not an invention — it is what equivalence partitioning already means, applied. `techniques.md:27`
already says the discipline is "enumerating the invalid classes too", not one test per class.

**Landing sites:** the tier table in `skills/sailes-test/SKILL.md` gains a **Case list** column;
one clause in `agents/tester.md:30`; the tier line in `test-plan-template.md`.

**Done-when:**
```
the tier table has a third column that constrains list size, not only proof
node tools/sync-blocks.js --check   → exit 0
npm test                            → exit 0
```
Deployed-probe: n/a — doctrine text, no HTTP surface in this repo.

## Phase 2 — the ratchet gets a reverse gear

**The defect, from the recon, stated exactly.** There is no rule of the shape "a test that survives
its own mutant is a defect" or "a test that cannot go red is removed". `sailes-test/SKILL.md:107`
demands every surviving mutant be "killed or explained in writing" — both exits add text. The
nearest miss is `techniques.md:136-137`, which *names* tautological assertions and offers no
disposal for them.

**Rule.** A case whose own mutant it cannot kill has failed the only test that matters. It is
**named on the detection-proof table as dead, with the mutant that survived it**, and goes to the
human as a strike candidate — the same route the deployed-probe trade already uses. Two clauses
keep it honest:
- *Explaining an equivalent mutant is still a valid outcome* (`SKILL.md:132`) — a dead case and an
  equivalent mutant are different findings and must not be collapsed.
- *`tester` names, the human strikes.* Nothing in this phase lets a red test be removed to reach
  green; that prohibition is untouched and restated where the new exit sits, because the two are
  one keystroke apart.

**Landing sites:** `skills/sailes-test/SKILL.md` step 5 + the `Never` list's neighbourhood;
`skills/sailes-test/test-plan-template.md` detection-proof table; `agents/tester.md` report clause.

**Done-when:**
```
grep -n "survives its own mutant" skills/sailes-test/SKILL.md  → present
the never-delete-to-go-green rule is still present and adjacent
npm test                            → exit 0
```
Deployed-probe: n/a — doctrine text.

## Phase 3 — `checker` gets the mirror it is missing

**The defect, verified.** `agents/checker.md:17` mandates a section headed *"what the diff does NOT
do that the spec requires"*, with ~140 words and a measured incident behind it. Surplus gets one
bare noun — "scope creep" — fifth in a comma list at `:19`. No heading, no example, no incident.
The framework *has* the "surplus or hole — decide which" primitive and applies it to **spec file
lists** at spec-writing time; it never applies it to the diff.

**Rule.** A second mandatory line beside the first: *what the diff contains that the spec does not
require* — code paths, options, abstractions and **tests** with no clause behind them. Same
disposition as the spec-side primitive: surplus or hole, decide which. Cost is small precisely
because the heading pattern, the reasoning and the vocabulary already exist one line above.

**Landing sites:** `agents/checker.md` (+ its Codex twin invariant if `parity.test.js` demands it).

**Done-when:**
```
node codex-agents/parity.test.js    → exit 0
npm test                            → exit 0
```
Deployed-probe: n/a — role definition.

## Phase 4 — fix the contradiction 1.30.0 introduced

`skills/sailes-bootstrap/agents-md-template.md:155` and `skills/sailes-bootstrap/SKILL.md:52` say
**"NEVER delete tests"**, unqualified, and that text ships into every generated client repo. 1.30.0
then added a rule that *requires* deleting mocked assertions when a deployed probe replaces them,
and this spec adds a second deletion route. Three rules in tension, and the unqualified one is the
one a client repo reads first.

**Rule.** Make the prohibition say what it has always meant: **never delete a test to reach green.**
That is the violation. Deleting a case a named replacement has made redundant, or one proven to
detect nothing, is a different act with its own gate.

**Done-when:**
```
grep -rn "delete tests" skills/  → every hit is qualified
npm test                         → exit 0
```
Deployed-probe: n/a — doctrine text.

## Phase 5 — ceremony: pay for the additions by deleting contradictions

A contradiction is ceremony in its purest form: the agent must stop and resolve it at runtime,
every run, forever. The ceremony recon found ~21 mandated steps firing for a two-file behaviour fix
— 2 human stop-points, 3-4 fresh-context role spawns, ≥9 file writes — and, more usefully, that
**nothing in the completion block (the longest, heaviest section of `sailes-implement`) is scaled by
anything.** These are the items where deleting is strictly better than adding:

| # | What | Where | Why it goes |
|---|---|---|---|
| 5a | an **orphaned HTML-comment fragment** — a dangling `-->` with no opener, left by a 2026-08-01 edit | `agents/team-lead.md:11` | shipped verbatim into every `team-lead` context; it is debris, not doctrine |
| 5b | the **gate rule stamped twice into the same files** — `delegation-threshold.md:24-29` restates `gate-scaling.md:15-21` in the same words, and both blocks are stamped into `team-lead.md`, `agent-team-structure.md` and the Codex twin | `delegation-threshold.md` | the two were split *on purpose* to be "stated together and edited apart"; the split happened, the restatement was never removed. Every lead context carries the gate rule twice, ~15 lines apart, by machine |
| 5c | the **skip-triggers vs `spec-weight` contradiction** — `sailes-spec/SKILL.md:87` exempts "small bug fixes" four lines above a block whose entire point is that a contract fix *is* the shape that feels small | `sailes-spec/SKILL.md`, `spec-writing-template.md` | introduced by 1.30.0, four hours old, and it exempts exactly the case the new block was written to capture |
| 5d | **three different conditions for one run log** — `:23` says ">~5 commits", `:44` says "if used", `:122` lists it flatly, `team-lead.md:94` says "when substantial" | `sailes-implement/SKILL.md`, `team-lead.md` | one condition, stated once |
| 5e | the **readiness waiver vs its own red flag** — `:16` allows skipping pre-implement when "the change is small enough that readiness is obvious"; `:126` red-flags "you implemented without an approved, READY spec" with no carve-out | `sailes-implement/SKILL.md` | a waiver that trips an alarm is not a waiver |
| 5f | the **capability sweep** — 27 lines, 20% of `sailes-implement`, whose own text says it "runs once per capability, not once per commit", sitting in the unconditional completion list | `sailes-implement/SKILL.md:75-101` | moved to a reference file and cited in one line. Not deleted — relocated out of the always-loaded path |
| 5g | the **CloudFront anecdote told 6-7 times** in full, once immediately after a pointer to the file that owns it | `sailes-test`, `sailes-spec`, `sailes-implement`, `qa`, `tester`, `checker`, `pre-implement`, `test-plan-template` | already named as a finding in `.ai/audits/2026-08-30-checker-test-surface.md:120`; the rule is *mechanically enforced* now, so the prose is paying rent twice |

**Not touched, deliberately:** the docs-delta step and the pre-implement gate. Both are heavy and
both are measured to have paid. Scaling them is a separate decision with its own evidence, and
bundling it here would hide it.

**Done-when:**
```
net model-facing byte delta across every touched file ≤ 0, measured and pasted
node tools/sync-blocks.js --check → exit 0
npm test                          → exit 0
grep -c -- "-->" agents/team-lead.md → matches the count of real comment openers
```
Deployed-probe: n/a — doctrine text, no HTTP surface in this repo.

## Phase 6 — measure it, including that testing did not get worse

The human chose fault injection over volume-counting, and the reason is in this repo's own record:
a suite half the size catching half the faults is not an improvement.

**Harness** (built and calibrated before any doctrine edit):
`scratchpad/faultab/` — a dependency-free `normalizeOwner` module, a spec with six numbered
behaviours, and **eight single-line mutants**, each breaking one named spec clause. `run-mutants.js`
runs an arm's suite against every mutant and scores kills.

**Calibration, already run:** a deliberately weak 3-case suite scores **0/8**; a deliberately strong
6-case suite scores **8/8** at 33 lines. The instrument discriminates, and it already shows the
thesis in miniature — the strong suite is not the big one.

**A/B:** both arms receive the identical finished implementation and spec and write only the test
suite. Arm A = `sailes-test` before this change; arm B = after.

**Expected (binary):** arm B's suite is **not larger** than arm A's and kills **at least as many**
mutants. A smaller suite that kills fewer is a FAIL and ships nothing — that is the whole point of
choosing this instrument over a line count.

**Done-when:**
```
node run-mutants.js <armA suite>  → score recorded
node run-mutants.js <armB suite>  → score recorded, kills ≥ arm A, lines ≤ arm A
verdict written to .ai/eval-runs/2026-08-30-test-volume-vs-detection/VERDICT.md
```
Deployed-probe: n/a — the harness is a local Node process.

## What this spec does NOT claim

The volume mandates were never measured to be harmful **in a client repo**. What was measured is
narrower: 44 assertions did not catch the 2026-08-29 defect and one probe would have; and in this
repo's own calibration a 3-case suite caught 0/8 while a 6-case suite caught 8/8. Both support
"placement beats volume". Neither establishes that the current mandates produce dead tests at any
particular rate. The A/B in Phase 6 measures one fixture, once, per arm.

---

## Closure — 2026-08-30

**Phase 6 is the finding.** The A/B's first run **refuted the change**: the tier-B rule as first
written produced 70 cases against arm A's 58 — a 21% increase — at identical 8/8 detection. The
wording was corrected inside the run (the straddle pair, provable against off-by-one) and re-measured
at **42 cases / 388 lines / 8/8**. Full record and its limits:
`.ai/eval-runs/2026-08-30-test-volume-vs-detection/VERDICT.md`.

| Phase | Landed | Verified by |
|---|---|---|
| 1 — tier scales the list | Case-list column + the straddle-pair rule | the A/B above |
| 2 — the reverse gear | `DEAD` on the detection-proof table; tester names, human strikes | text present; unmeasured by construction |
| 3 — `checker`'s surplus mirror | both twins + a parity invariant, mutation-proven to bite on each side | `codex-agents/parity.test.js` |
| 4 — "NEVER delete tests" qualified | `agents-md-template.md`, `sailes-bootstrap/SKILL.md` | grep; ships into every generated repo |
| 5 — ceremony cuts | 6 of 7 items; 5a **refuted by the worker and not done** | byte delta below |

**Phase 5's budget, met.** +508 bytes (+0.20%) across the always-loaded skill and role definitions,
with 2,425 bytes relocated out of that path — effectively **−1,917 on a typical implement run**.
Phase 5 promised ≤ 0 on the always-loaded set alone and landed at +508; the shortfall is stated
rather than absorbed into the relocation figure. 1.30.0, for comparison, cost +11.0%.

**Item 5a was refuted, not completed.** The recon reported an orphaned HTML-comment fragment in
`agents/team-lead.md`. The worker counted openers and closers (5/5), stripped every balanced comment
span, found zero strays, swept the repo, and refused the deletion. The finding was mine and it was
wrong; the refusal is the correct outcome and is now doctrine in `.ai/lessons.md`.

**Gates.** `checker` was **not** re-run on this change, and that is a real gap rather than a
judgment: it graded 1.30.0 and found five defects including two in the tool, so the base rate for
this session's work is not zero. The substitute here is narrower — an adversarial A/B that refuted
the central rule, plus a mutation proof on the new parity invariant. Recorded as owed.

**Carried forward, in `.ai/backlog.md`:** re-run volume fixture 1 under the shipped wording; widen
the mutant set beyond spec-derived faults; the `Never`/Red-Flags overlap left as a doctrine call; and
from 1.30.0, still open — `mock-of-an-external-boundary-carries-a-pair` (NEVER-RUN) and
`diagnose-runs-live-case-before-audit` (STALE against its new criterion f).
