# Fault-injection harness — scoring a suite by what it CATCHES, not by how long it is

Built 2026-08-30 for `evals/tier-scales-the-case-list-not-only-the-proof.md`, and kept because the
question it answers recurs: **is this suite leaner, or just weaker?** Line counts cannot tell those
apart, and the release that produced this harness turned on exactly that distinction.

## Use

    node run-mutants.js <path-to-a-suite.test.js>

The suite must `require('./validate.js')` and run under `node --test`. The harness copies the suite
and a mutated `validate.js` into a temp directory per mutant, so nothing here is modified.

Output: a GREEN/RED baseline, then one line per mutant, then a score.

## What is in the box

- `validate.js` — a dependency-free five-field form validator with two named numeric edges (3–80,
  1–500) and one optional field.
- `SPEC.md` — its spec, five numbered behaviours and a rules table. This is what an arm is given.
- `mutants.json` — **eight single-line faults**, each breaking one named spec clause. Four (F1, F2,
  F5, F6) are off-by-one edge mutants — the class the tier-B straddle pair exists to kill, and the
  reason that rule could be settled by measurement instead of argument.

## Two things to know before you trust a score

**The ceiling is low.** A competent suite scores 8/8, so this instrument discriminates on *volume at
equal detection* and can never show one arm detecting more than another. That was enough for the
question it was built for and is not enough for every question.

**Eight faults is not the fault space.** Every mutant is derived from a spec clause. A race, an
encoding, a vendor field nullable in practice — none are represented, and a suite that trims cases
could plausibly lose them without this harness noticing. Say so when quoting a score.

Calibration, so the instrument is not taken on trust: a deliberately weak two-case suite scores
**1/8**; the arms in the recorded run scored **8/8** at 58, 70 and 42 cases respectively.
