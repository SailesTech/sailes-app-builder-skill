# Spec: the inner loop, and the one test that earned its place

Status: implemented — evidence: `npm test` → exit 0 (17 suites) · `node tools/sync-blocks.js --check` → all blocks in sync · `node codex-agents/parity.test.js` → exit 0 · `release-hygiene` → five stamps at 1.32.0 · A/B: **PARTIAL PASS** (`.ai/eval-runs/2026-08-30-inner-loop-promotion/VERDICT.md`) · docs-delta: EMPTY, receipt written by the release lead leaning on 1.31.0's compare rather than its own archify run — stated in the receipt and queued for check · checker: not run on this change · qa: n/a — no running app here
Weight: contract fix — it renames and re-purposes an existing concept, adds one report field and one
        intake clause. No new artifact, no new role, no new block, no new tool.
Source: the human, 2026-08-30 — "kiedy i jakie testy powinny być robione żeby usprawniać
        implementację i przyspieszyć proces dewelopmentu bo teraz jest za wolno".
Decisions taken by the human in this session, both against my recommendation on the first:
        **the frozen case list stays after implementation** (oracle independence unchanged), and
        **the inner loop is split out with a promotion path**.

## TLDR

`sailes-implement:39` already names a "RED test … scaffolding for the step". Three things are wrong
with it and all three cost implementation speed:

1. It is framed as a **TDD ritual** — "identify the RED test first" — not as a feedback loop.
   Nothing says it should be *fast*, nothing licenses *many* of them, nothing says run it
   constantly. So "test" means gate-grade suite everywhere in this framework, and every check the
   implementer might run pays gate ceremony: an ID, a freeze, a detection proof.
2. `tester` "may supersede a scaffolding test only with an ID-bearing equivalent" — supersession by
   the gate, not **promotion by evidence**.
3. **Nothing asks the implementer what their scaffolding caught.** A check that went red on a real
   defect in real code is the only test in this framework whose detection power was *earned rather
   than argued* — and today it dies with the step.

## What changes

**The inner loop is named as an instrument, with the opposite properties to the gate suite.**

| | inner loop | gate suite |
|---|---|---|
| owner | whoever writes the code | `tester`, fresh context |
| speed | seconds; run constantly | once, at the gate |
| shape | implementation-shaped **by design** | spec-derived, implementation unread |
| IDs / freeze / detection proof | none | all three |
| deletion | free | human strikes only |
| is it evidence? | **never** | yes — it is the gate verdict |

**The promotion path, and where it lands.** A scaffolding check that went red on a **real defect**
— not merely on not-yet-written code — is reported with the defect it caught. `tester` takes it at
**step 4**, the existing "read the diff and ADD edge cases" step, which already exists for exactly
this class: *"specification-based derivation systematically misses what implementation reveals: an
encoding, an overflow, a vendor field that is nullable in practice."* A check that caught a real bug
**is** that discovery, made the expensive way. It gets an ID, its provenance recorded, and joins the
frozen list.

This is why promotion needs no new machinery, and why it does not touch the decision above: the
frozen list still derives from the spec at step 1 with the implementation unread. Promotion enters
at step 4, after the diff is read — already the sanctioned door for implementation-revealed cases.

**The principle it inherits.** 1.31.0 said a case that cannot kill its own mutant is `DEAD` and
leaves. This is the same rule pointing the other way: a check *proven* to catch a real fault gets in.
The suite grows from evidence and shrinks from evidence, instead of growing from mandate.

## Landing sites

- `skills/sailes-implement/SKILL.md:39` — the inner-loop definition, its speed purpose, the report duty.
- `skills/sailes-test/SKILL.md` § Step 4 — the intake.
- `agents/be-dev.md`, `agents/fe-dev.md` — the implementer's duty and its report field.
- `agents/tester.md` § step 4 — receive, do not invent.
- `skills/sailes-test/test-plan-template.md` — provenance for a promoted case.

## Non-goals

- Moving the frozen list earlier. The human decided against it; oracle independence stays bought the
  expensive way, deliberately.
- Any change to tiers, the `DEAD` route, `checker`'s surplus mirror, or `qa`.
- Making the inner loop a second graded suite. That is the failure mode this must be measured
  against, not a fallback.
- Scaling the completion block. Named as the largest non-test lever and left alone, twice now.

## Done-when

```
grep -n "inner loop" skills/sailes-implement/SKILL.md   → present, with its speed purpose
grep -n "promot" skills/sailes-test/SKILL.md agents/tester.md agents/be-dev.md → the path exists end to end
node tools/sync-blocks.js --check → exit 0
npm test                          → exit 0
net always-loaded byte delta, measured LF-normalised on both sides, pasted
```
Deployed-probe: n/a — doctrine text only; this repo ships no HTTP surface, and the rule applies to
the repos it governs.

**Behavior gate (A/B).** `evals/inner-loop-promotes-what-caught-a-real-defect.md`. The risk is not
that the rule fails to land — it is that it lands as **ceremony doubling**: a second suite with IDs
and freezes, making everything slower in the name of speed. So the criterion is two-sided:

- arm B's inner-loop checks carry **no IDs, no freeze, no detection proof**, and are described as
  disposable; and
- **exactly** the check that caught a real defect is promoted, with the defect named as its
  provenance.

An arm B that promotes everything has built the second suite and FAILS. An arm B that promotes
nothing has lost the signal and FAILS.

## What this does NOT claim

Nothing here has been shown to make implementation faster in wall-clock terms; that needs a timed
task this session has not run. The mechanism is argued from a measured *structure* — 21 mandated
steps with tests at step 12 and no fast check anywhere before it — not from a measured duration.

---

## Closure — 2026-08-30

**Result: PARTIAL PASS, and the control was competent.** Both arms found the planted defect and
**neither built a second ID-bearing suite** — the ceremony-doubling failure this change was most
likely to have did not occur. The discriminating difference is what reaches the report: arm A the
diagnosis alone, under a heading naming no check; arm B the check *plus* the diagnosis.

**What the eval changed about the shipped text.** Arm B's section was good prose titled something no
downstream role would grep for. The field is now the fixed label `Promotion candidate:`, greppable
by `tester` at step 4 — same idiom as `Deployed-probe:` and `qa: n/a`, where a fixed label makes the
absence visible too. **That label is unmeasured**: the arms ran against the earlier wording, so the
shipped text is not the graded text. Queued.

**A criterion I wrote badly.** One of the two binary conditions asked arm B to *describe* its checks
as disposable and unceremonious. Both arms simply behaved without ceremony and neither narrated it,
so the condition discriminated nothing. Retired rather than scored — grade behaviour, not narration
about behaviour.

**Cost.** +2,884 bytes (+0.90%) across every skill entrypoint and role definition; the three
releases of this session total +6.83% against 1.29.0. The first draft of this change cost +7.24% on
its six files and was compressed to +6.02% by cutting the doctrine restatement out of the role files
— roles get the duty, skills get the reasoning.

**Gates not run, stated rather than implied.** `checker` did not review this change; it found five
defects in 1.30.0 including two in a tool, so the base rate is not zero. The docs-delta receipt was
written by me, not by `docs-author`, leaning on the precedent that agent established four hours
earlier for an identical class of change — and the receipt says so and names how it gets checked.

**The claim still unproven is the human's actual question.** Nothing in three releases measures
**speed**. The case for the inner loop is structural — 21 mandated steps for a two-file behaviour
fix, tests at step 12, no fast check named anywhere before it — and a wall-clock A/B on an
implementation task is at the top of `.ai/backlog.md`.
