# Verdict — A/B on the `researcher` architecture (roster spec Q1)

Date: 2026-07-26 · Ground truth: `GROUND-TRUTH.md`, locked before either arm was dispatched.

**The question.** Q1 of `.ai/specs/2026-07-26-roster-for-people-who-are-not-you.md`: who spawns the
explorers — (a) the lead does, and `researcher` only synthesises what it is handed, or (b) `researcher`
spawns its own. Settled by experiment rather than argument at the human's instruction.

**Vehicle.** Both arms ran as `general-purpose` stand-ins, deliberately: the variable under test is
**architecture**, not role frontmatter. This grades topology, not pins or tool allow-lists.

## The scored measure — and why it did not decide anything

Recall over the ten external tools in the locked ground truth, scored by presence with at least one
correct file location:

| | Arm A (lead spawns) | Arm B (researcher spawns) |
|---|---|---|
| Recall on the 10 | **10 / 10** | **10 / 10** |

**The measure saturated**, which rule 8 of `deciding-under-uncertainty.md` predicted before the run:
a ten-item floor tells you which arm cleared it, not which arm was better. Both cleared it. Reporting
this as a tie would be reporting the instrument's ceiling as a finding.

Per rule 5 — *if both arms agree, suspect the fixture* — the agreement was examined rather than
believed. It survives: the two arms independently reached the same non-obvious conclusion about the
repo (that ~120–150 raw tool mentions collapse to a handful of genuine dependencies, the rest being
recommendations, cited sources or named anti-patterns). Independent convergence on a finding is
corroboration. The saturated *score* is still an instrument defect, and the two are separate things.

## The second discriminator — provenance, checked mechanically

Both arms ran a verification pass over their own inputs, and both caught real defects.

- **Arm B** cross-checked its 7 gatherers with its own ripgrep sweep and **discarded a fabrication**:
  a gatherer invented `supa_audit v0.3.1` in its summary table while its own body said "no version".
  Its sweep also caught `ui-ux-pro-max` (`sailes-design/SKILL.md:52-55`) which **all seven gatherers
  missed, including the one that read that exact file**. Verified here: the location is correct.
- **Arm A** went to source on 22 sampled strings and found two genuine misattributions — an
  Open-Mercato quote filed against `skills/README.md` (verified: the string does not occur there) and
  `deep-research` filed against `decision-engine.md` while the real occurrence is
  `stack-baseline.md:7` (verified: both halves correct).

Neither arm fabricated. Both found their own inputs' errors. **Provenance does not separate them
either** — which is itself the useful result: the verification pass earned its keep in both topologies.

## What actually separated them

> **CORRECTED 2026-07-26 after run 2.** The first version of this table reported Arm B at "~497k
> tokens" and a "~2.1 min fan-out". **Those numbers were never measured.** They came from Arm B's own
> run-data section, which formatted estimates identically to source-verified claims. Asked directly,
> that agent confirmed: the per-gatherer token range is unverified, the "~366k total" was its own
> arithmetic (7 × ~52k) rather than a reported aggregate, and no clock was ever read — the fan-out
> figure was derived from the maximum of unverified per-agent durations. Its own words: *"if I had
> genuinely read them as data I would be able to quote one."*
>
> I passed those figures on as measurement. The rule this repo applies to findings — grade the
> artifact, not the report — was never applied to the arms' **self-reported instrumentation**, which
> is the one part of an experiment that has no artifact to go back to.

Numbers below are harness-side only: durations and token counts for agents **this session spawned
directly**. Arm B's gatherers are children-of-children and are invisible both to me and, as run 2
established, to the researcher itself.

| | Arm A run 1 | Arm B run 1 | Arm A run 2 | Arm B run 2 |
|---|---|---|---|---|
| Agents | 4 | 8 | 4 | 7 |
| End-to-end wall-clock | 13.3 min | 6.2 min | **34.4 min** | **8.9 min** |
| Tokens (harness) | 648,945 | *uncountable* | 798,900 | *uncountable* |
| Empty returns | 0 | 0 | 0 | 0 |

**The token comparison does not exist and cannot be reconstructed.** Arm A's cost is fully visible
because every one of its four agents is spawned by the session. Arm B's is not, in either run.

**Direction is consistent across both runs; magnitude is not remotely stable.** Arm B finished first
both times. But a single Arm A explorer took **24.5 minutes in run 2 against 6.6 in run 1 for the same
slice** — a 3.7× swing on an unchanged task — and Arm B itself moved 6.2 → 8.9 min. The run-to-run
variance is larger than the between-arm difference in run 1. Treating "2× faster" as a measured
constant was over-reading a single sample.

The mechanism that survives both runs is narrower and structural: **Arm A finishes at its slowest
explorer and then pays for synthesis that must read three large files cold; Arm B waits for its
slowest gatherer and synthesises in the context it already built.** Arm A pays the tail and the
handoff separately.

Two asymmetries, and neither is about model quality:

**1. The lead is in the critical path.** Arm A's synthesis could not begin until all three explorers
returned *and the lead noticed and dispatched it*. That barrier is the whole wall-clock difference.
Arm B's researcher fanned out, waited, and synthesised inside one continuous context with no handoff.

**2. Whoever slices decides what cannot be seen.** Arm A's slicing was the lead's, and all three
slices stopped at `skills/` — so no explorer saw `package.json:14` (the only machine-readable version
constraint in the repo), the `agents/*.md` frontmatter where tools are *declared to the harness*
rather than recommended in prose, or the one executable implementation of the "explicit SKIP, never a
silent pass" doctrine. The Arm A synthesiser recovered all three by grepping itself — but only because
it was allowed to read beyond what it was handed. **A synthesiser restricted to its inputs would have
inherited the lead's blind spot silently.** Arm B chose its own slices and covered all 79 files.

Arm A did have one structural advantage the numbers do not show: **no overlap between slices meant no
claim arrived with independent corroboration.** That is a property of the slicing, not the topology,
and either arm could fix it by overlapping deliberately.

## Fixture defects, recorded

1. **The corpus was modified mid-run.** `skills/sailes-bootstrap/deciding-under-uncertainty.md` was
   written at 13:32:28; Arm A explorer 1 finished at 13:28:09. Its "22 files, all read" was correct
   when it ran. The Arm A synthesiser, starting later, saw 23 and reported the claim as false. **That
   finding is void** — it is contamination by the experimenter, not an explorer error. Promoted to
   rule 10 of `deciding-under-uncertainty.md`.
2. **The ten-tool floor was too low** to discriminate. A harder ground truth would weight tools that
   appear in exactly one file, or score locations rather than presence.

## Run 2 — what a second sample changed

Same fixture, same slices, same question, tree frozen at `b24fba1` before dispatch. Coverage is **not**
comparable across runs: run 1's corpus was 79 files, run 2's is 80, because a doctrine file was added
between them (see fixture defect 1). Cost and latency are comparable; recall is not.

Three things the second run established that the first could not:

1. **Cost visibility is a property of the topology under test.** This is the sharpest result and it
   points the opposite way to run 1's latency finding. Under Arm A the session spawns every agent, so
   every token and duration is logged automatically. Under Arm B the gatherers are one level down and
   their cost is visible to **nobody** — not the session, not the researcher. That collides with this
   framework's own run-log doctrine, which requires recording who was spawned, what they returned, and
   **whether a model escalation actually paid**. An architecture whose costs cannot be observed cannot
   satisfy a rule that requires observing them.
2. **The decisive finding came from the top agent's own mechanical sweep in all four executions** —
   never from the gatherers. Run 2's Arm A synthesiser found that `sailes-design/premium-ux.md:7`
   declares a "Sailes baseline" of TanStack Start + React Query that appears **in that file alone**,
   contradicting `premium-craft.md:7` six lines away and `stack-baseline.md:45`; it noted that neither
   explorer flagged it because *it is invisible from inside any single slice*. Arm B found the same
   defect the same way, via its own cross-cutting grep. **The verification pass is what produced the
   value in both topologies.** That is an argument about method, not about who spawns.
3. **Both arms' verification caught real defects in their own inputs, again.** Arm A run 2 corrected
   its own explorer's "only two hard version constraints exist" against that explorer's own tables,
   and spot-checked ~35 quotes at source with no fabrication found. Arm B run 2 caught its grep layer
   twice attributing **this repo's own release numbers** (1.14.0/1.14.1, 1.9.0) to external tools as
   version constraints — the line numbers real, the attribution invented.

## What this settles, and what it does not

**Settles:** both architectures produce a correct, well-provenanced artifact — four executions, zero
empty returns, zero fabrications reaching the deliverable, and in every case the top agent's own
verification pass caught real defects in what it was handed. Neither arm is unsafe on quality.

**Settles on latency, with the magnitude left open:** Arm B finished first in both runs, and the
mechanism is structural — it does not pay for a cold handoff between gathering and synthesis. How much
that is worth is unresolved: run-to-run variance (3.7× on a single explorer, unchanged task) exceeded
the run-1 gap between arms.

**Does not settle, and cannot with this instrument: cost.** Arm B's token consumption was never
measured in either run, and the reason is not an oversight that a better brief fixes — it is the
topology. Anything Arm B's gatherers spend is invisible to the session *and* to the researcher.

**Runs against (b), newly:** the same invisibility. `agent-team-structure.md` requires the run log to
record each spawn, each return, and whether an escalation paid for itself. Arm B cannot produce that
record about its own gatherers.

**Does not settle — and this is the human's call:** the win is bought with the safety invariant.
Granting `Agent` to `researcher` makes it the second role that can spawn, and the runtime audit of
2026-07-26 established that "no non-lead role carries `Agent`" is what makes depth-2 sub-teams safe by
configuration rather than by promise.

There is also an unpriced consequence: **a `researcher` that spawns, placed inside a sub-team, sits at
depth 3** — which `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=2` forbids outright. Under (b) the role either
is top-level only, or the cap moves.

The experiment surfaced a third option neither arm was built to test: **`researcher` spawns, but only
at top level**, never inside a sub-team. That keeps depth ≤ 2 and keeps the fan-out latency win. It is
untested; naming it is not the same as measuring it.
