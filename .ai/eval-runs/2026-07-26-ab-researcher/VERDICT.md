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

| | Arm A (lead spawns) | Arm B (researcher spawns) |
|---|---|---|
| Agents | 4 (3 explorers + synthesiser) | 8 (7 gatherers + researcher) |
| Tokens | ~648k | ~497k |
| Fan-out wall-clock | ~6.6 min | ~2.1 min |
| End-to-end wall-clock | **~13 min** | **~6 min** |
| Empty returns | 0 | 0 |

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

## What this settles, and what it does not

**Settles:** both architectures produce a correct, well-provenanced artifact. Arm B is roughly **twice
as fast end-to-end at three-quarters the tokens**, and it removes the lead from the critical path
between gathering and synthesis. On the measured axes, (b) wins.

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
