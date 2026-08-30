# A/B: does naming the inner loop capture the check that caught a real defect?

Date: 2026-08-30 · single run per arm · fresh generic subagent per arm, clean context, pinned Sonnet,
each given the `be-dev` role and the implement skill at its arm's revision, and a normal brief.
Fixture: `scratchpad/innerloop/` — a spec for `sumInvoices`, plus a shared `money.js` the brief
forbids modifying, carrying a real planted defect: **`parseAmount('')` returns `0`, not `null`**, so
a blank CSV cell is indistinguishable from a genuine `0,00` while the spec demands blank amounts
raise `unparseable_amount`.

## What both arms did

**Both found the defect.** Arm A is a competent control, not a straw man. Both produced working
code, both wrote a comparable number of checks (A: 9, B: 8), and **neither invented a second
ID-bearing frozen suite.**

That last point settles the risk this change was most likely to carry. The spec named it: *"an arm B
that promotes everything has built the second suite and FAILS"*. **It did not happen.** The
ceremony-doubling failure mode is not evidenced here.

## Where they differ, and it is the thing that was dying

| | arm A | arm B |
|---|---|---|
| found the `parseAmount('')` defect | yes | yes |
| where it lives in the report | under `## Deviation — blank amount cells` | under `## Real defect the inner loop caught` |
| **the check that caught it, named** | **no** | **yes** — quoted by its exact test name |
| second frozen/ID-bearing suite | no | no |

Arm A reports the **diagnosis**. Arm B reports the **check plus** the diagnosis. That is precisely
the subtler failure this eval was written to watch for — *"the diagnosis survives and the regression
test still does not"* — and arm A fell into it while arm B did not. The one test in the pipeline
whose detection power was earned rather than argued is identifiable in arm B's report and is not in
arm A's.

## What did NOT land, and the fix it produced

- **The routing was left to inference.** Arm B never wrote "promotion", never named `tester`. Its
  section title is excellent prose and **something no downstream role would grep for**. A handoff
  that has to be recognised is a handoff that gets missed — this repo's own recurring finding.
- **The "disposable, no IDs, never gate evidence" framing did not appear** in either report. As a
  criterion this was badly written by me: it asked the arm to *narrate* an absence of ceremony
  rather than to *behave* without it. Both arms behaved without it, so the criterion discriminates
  nothing and is retired rather than scored.

**Fix applied inside this run:** the report field is now a fixed label, `Promotion candidate:`,
carried in `be-dev`, `fe-dev`, `sailes-implement` and grepped by name in `tester` step 4. Same idiom
as `Deployed-probe:` and `qa: n/a` — a fixed label makes the *absence* visible too. Not re-measured;
the arms above were run against the pre-label wording.

## Verdict

**PARTIAL PASS.** The discriminating behaviour landed on a competent control: the check is captured
with its provenance in arm B and absent in arm A, and no second suite appeared. The routing was
inferential and has been made mechanical; that fix is **unmeasured**. One run per arm, one fixture,
one model — and the label change means the shipped text is not the text that was graded, which is
stated here rather than glossed.

## Not established

Nothing here measures **speed**. The claim behind this change is that a fast, unceremonious inner
loop shortens the write→feedback cycle, and the evidence for it is structural — 21 mandated steps
with tests at step 12 and no fast check named anywhere before it — not a timed comparison. A
wall-clock A/B on an implementation task is the missing measurement, and it is owed.
