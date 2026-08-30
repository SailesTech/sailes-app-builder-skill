# A/B: does the tier-scaled case list cut volume without costing detection?

Date: 2026-08-30 · single run per arm · fresh generic subagent per arm, clean context, pinned Sonnet,
told nothing about the eval or the mutants.
Instrument: `scratchpad/faultab*/run-mutants.js` — each arm's suite is run against **eight
single-line faults**, each breaking one numbered clause of that fixture's spec, and scored on kills.

The human's constraint was the reason for choosing this instrument over a line count: *"żeby nie
produkował zbędnego kodu … ale zachował zalety testowania"*. A suite half the size that catches half
the faults is not an improvement, and only fault injection can tell the two apart.

## Results

**Fixture 1 — `normalizeOwner`, no cross-product** (one function, two payload shapes, 7 error codes)

| arm | cases | lines | faults killed |
|---|---|---|---|
| A — `sailes-test` at HEAD | 33 | 265 | **8/8** |
| B — after the change (v1 wording) | 29 | 269 | **8/8** |

**Null.** Fewer cases, marginally more lines, identical detection. Per the harness protocol's rule 4
— *"if both arms agree, suspect the fixture before believing the result"* — the fixture is the
explanation: it has **no cross-product at all**. No fields, no roles, no UI. The mandates the new
Case-list column conditions (field × 4, action × role, six values per boundary) never fire here, so
the change could not have shown up. Recorded as a fixture defect, not a finding about the rule.

**Fixture 2 — `validateProfile`, five fields with named numeric edges** (3–80, 1–500)

| arm | cases | lines | faults killed |
|---|---|---|---|
| A — `sailes-test` at HEAD | 58 | 497 | **8/8** |
| B — v1 wording: *"every boundary the spec names, walked in full"* | **70** | 488 | **8/8** |
| **B2 — after the straddle-pair fix** | **42** | **388** | **8/8** |

## What this run actually established, in order

**1. The first version of the rule made the suite BIGGER.** 70 cases against arm A's 58, at identical
detection. This is the result the eval existed to catch and it went against the hypothesis. The
cause was one clause: tier B demanding each named edge be *"walked in full"* — six values per edge,
where arm A had no instruction at all and wrote fewer.

**2. The fix is provable, not a preference.** An off-by-one is the entire reason to test an edge and
it moves the comparison in one of two directions. For `length < 3 → too_short`: widening to `< 4` is
caught by the **last accepted value** (3); narrowing to `< 2` by the **first rejected** one (2). Both
directions die to two cases. `min+1` and `max−1` sit inside partitions already covered and kill
nothing an off-by-one can do. Four of the eight faults in this fixture (F1, F2, F5, F6) are exactly
off-by-one edge mutants, and the straddle pair kills all four.

**3. With that fix: −28% cases, −22% lines, detection unchanged.** 58 → 42 and 8/8 → 8/8. That is
the release's claim, and it is the only number in this document that supports it.

## What this does NOT establish

- **Detection is measured against eight faults derived from the spec's own clauses.** Faults outside
  that set — a race, an encoding, a vendor field nullable in practice — are unmeasured, and arm B2's
  16 fewer cases could plausibly cost something there. The instrument cannot see it.
- **The ceiling was hit by every arm.** Both arms scored 8/8 on both fixtures, so this A/B can only
  ever discriminate on volume-at-equal-detection, never show arm B detecting *more*.
- **Fixture 1's arm B was written under the v1 wording** and was not re-run after the straddle fix.
  Its null result stands as a fixture critique, not as a second data point for the shipped rule.
- **One run per arm, two fixtures, one model.** N=1 per cell.
- Nothing here measures the other half of the change — the `DEAD` case exit, `checker`'s surplus
  mirror, or the ceremony cuts. Those are unmeasured by construction: they fire on artifacts this
  harness does not produce.

## Verdict

**PASS on fixture 2 after iteration; the first wording FAILED and was corrected inside this run.**
The loop is the finding as much as the number is: a doctrine change that sounded like a cut produced
a 21% *increase*, and only fault injection against real model output revealed it. Had this shipped on
the strength of the prose — which reads persuasively either way — the framework would have gained a
rule that grows suites while claiming to shrink them.
