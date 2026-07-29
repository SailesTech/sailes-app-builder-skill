# promotion-prefers-enforcement — re-run 2026-07-29 (STALE after the Answer-shape edit)

Scenario: `evals/promotion-prefers-enforcement.md`
Branch:   `feat/adhd-mode-ab`, working tree graded as-is (clean at dispatch).
Trigger:  `skills/sailes-bootstrap/agents-md-template.md` changed today — a new `## Answer shape`
          section was appended to the generated root file (commit `cd787fd`), so every scenario
          naming that file went STALE.

## Verdict: **PASS**

Criterion, quoted verbatim from the scenario's `Expected (binary)`:

> The promotion lands as an enforcement proposal (a lint rule — e.g. `no-restricted-syntax` on
> color literals — or a convention test) PLUS a one-line pointer in AGENTS.md; NOT another prose
> paragraph restating the rule (output must name a concrete lint/test mechanism).

Both conjuncts hold in the artifact, and the failure mode (`Failure looks like:` — "the agent
appends a bolder prose rule to AGENTS.md") did not occur: AGENTS.md is **byte-identical** before
and after the run.

## Vehicle — STAND-IN, and what that costs

`general-purpose` subagent, model `sonnet` set on the invocation, pointed at working-tree text
copied into a fixture repo. **This is a stand-in, not the registered role type.** It grades the
TEXT of the doctrine as it stands in the working tree. It says **nothing** about runtime pins,
tool allow-lists, or spawn restrictions — a generic agent runs on the session's model with the
session's tools. Reading this verdict later as a runtime result is the specific error this
paragraph exists to prevent.

Instrumentation from the harness (agent spawned directly): 33 tool uses, 79,991 subagent tokens,
242s wall clock. Nothing else about the run's internals was measured.

## The fixture — what was actually built, not described

A real repo at `.ai/eval-runs/2026-07-29-stale-rerun/fixture/repo/`:

- `AGENTS.md` — **generated from the template under test**, lines 26–171 of the working-tree
  `agents-md-template.md` (the content inside its ```markdown fence). It therefore carries the
  new `## Answer shape` section that made this scenario stale, the `## Enforcement (the ratchet)`
  list, and the `## Lessons` promotion rule.
- `.ai/doctrine/agentic-first-principles.md` and `.ai/doctrine/agents-md-template.md` — copies of
  the working-tree files, **sha256-identical** to `skills/sailes-bootstrap/` (verified pre-dispatch:
  `2a3c4d3b…` and `e17a9fdc…` on both sides).
- `.ai/lessons.md` — three entries across five weeks (2026-06-30, 2026-07-11, 2026-07-27) so the
  lesson genuinely **recurs**; the third carries the scenario's sentence verbatim ("Raw hex colors
  keep appearing in components despite the tokens-only rule") and an open `Rule:` field.
- Three real components carrying **8 raw hex literals**, a `tokens.ts` they should have used, and an
  `eslint.config.js` with **no color rule at all** — so the condition was created, not asserted:
  the defect was live in the code and the enforcement did not exist yet.

Pre-dispatch assertions (all passed before any output was looked at, hashes in
`fixture/PRE-DISPATCH-SHA256.txt`): doctrine copies identical · AGENTS.md carries Answer shape +
ratchet + promotion rule · lesson sentence present · 8 raw hex in components · 0 matches for
`no-restricted-syntax|color` in the eslint config.

Brief: fresh context, no history, no hint of the expected answer — it said only "handle it exactly
the way this repo's own rules say an entry like that should be handled", and named a FILE as the
deliverable (`.ai/promotions/2026-07-29-tokens-only.md`, "no file = task not done").

## Evidence graded — the files, never the agent's summary

1. **`fixture/repo/eslint.config.js`** — a second flat-config block scoped to
   `apps/web/src/components/**` with `"no-restricted-syntax": ["error", { selector:
   "Literal[value=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]", message: "No raw hex
   color literals in components — import from packages/ui/src/tokens.ts instead." }]`.
   sha256 changed `537a606a…` → `3b877bc3…`. **A concrete lint mechanism, named — the first
   conjunct.**
2. **`fixture/repo/AGENTS.md`** — sha256 `851a315e…` **before and after, unchanged**. Zero prose
   added. The one-line pointer required by the criterion is present in the post-state
   (`## Enforcement`: "design tokens only (lint on raw literals)"), and the run's contribution is
   that the line is now **true** rather than aspirational. See the caveat below.
3. **`fixture/repo/.ai/promotions/2026-07-29-tokens-only.md`** — the deliverable. Quotes the
   promotion rule and §B.3, explains why a fourth prose restatement was rejected, and has a
   "What was deliberately not done" section that states the AGENTS.md decision explicitly rather
   than by omission.
4. **`fixture/repo/.ai/lessons.md`** — the 2026-07-27 entry's open `Rule:` field closed with the
   promotion record and a pointer to the deliverable.
5. **Components + tokens** — 8 raw hex → **0** remaining in `apps/web/src/components/**`; a missing
   `color.border` token added rather than one hex left behind.

### Independent execution by the grader (not the agent's claim)

The agent reported "npx eslint . clean, exit 0" and a probe. That is a claim about its own work, so
I re-ran it myself on a copy at
`…/scratchpad/lintcheck` (fresh `npm install`, exit 0):

- `npx eslint .` on the promoted repo → **exit 0**, clean.
- Reintroduced a raw hex (`Probe.tsx`, `color: "#1D4ED8"`) → **exit 1**,
  `2:31 error No raw hex color literals in components … no-restricted-syntax`.

So the enforcement is real and firing — GREEN on the promoted state, RED when the defect returns.

## Caveat that qualifies the PASS

**The "one-line pointer in AGENTS.md" conjunct was partly pre-satisfied by the fixture.** The
template's `## Enforcement` list already ships the line "design tokens only (lint on raw literals)",
so a faithfully generated AGENTS.md hands the agent that pointer for free — and adding a second one
would itself violate the size budget and the no-restatement rule. This run therefore establishes the
enforcement half **strongly** (a mechanism that did not exist now exists and fires) and the pointer
half **weakly**: what is proven is that the agent left AGENTS.md byte-identical, added no prose, and
reasoned explicitly about why. A fixture that wants to test the pointer being *authored* would have
to ship an AGENTS.md whose Enforcement list omits the tokens line.

This is the same template defect backlogged on 2026-07-28 (`agents-md-template.md` claims
lint-on-raw-literals that `sailes-bootstrap` never ships) seen from the other side: it is still
unfixed on this branch, and it now also blunts this eval's second conjunct.

## What this run does NOT establish

- **Nothing about the runtime.** Stand-in vehicle: no evidence about model pins, tool allow-lists,
  spawn restrictions, or whether a registered role would behave the same.
- **Nothing about the `## Answer shape` edit that caused the staleness.** The section was present in
  the graded AGENTS.md and did not derail the promotion — that is all. Answer shape has its own
  behaviour (choice windows, fork batching) which this scenario does not test and this run did not
  probe.
- **Nothing about the real `sailes-bootstrap` output.** The AGENTS.md graded here was generated by
  me from the template's fence; no bootstrap run produced it.
- **Nothing about durability.** One dispatch, one model (`sonnet`), one fixture. Not a rate.
- **Nothing about whether a *different* uncheckable lesson would be handled correctly** — this
  lesson is the worked example named in §B.3 itself, which is the easiest possible case for the
  ratchet. The scenario chose it; the criterion is met; the generalization is not tested.
- **Nothing about the backlogged template defect being fixed.** It is not; see the caveat.
- **No commit was made** in the fixture, and none in the repo under test — the eval runner does not
  edit the doctrine it is grading.

## In-flight incident — a concurrent session committed the fixture mid-run

Commit `888b7ce docs(audit): does the framework still fit the model it runs on`, made by another
session while this run was in flight, swept the **pre-dispatch** fixture into an unrelated commit.
Checked before concluding, because "do not touch the material under test while a run is in flight"
is the rule that made a 2026-07-26 coverage claim false:

- **The material under test was NOT touched.** The last commit to either file under test is still
  `cd787fd` (the Answer-shape edit that caused the staleness), and the working-tree sha256 of both
  files still equals the fixture copies (`2a3c4d3b…`, `e17a9fdc…`) — identical to what was hashed
  before dispatch. The run stands.
- **Side effect, mildly useful:** the pre-dispatch fixture state is now recoverable as
  `git show 888b7ce:<path>`, so the before/after is reconstructible from git as well as from
  `PRE-DISPATCH-SHA256.txt`.
- **Process hazard worth recording:** a blanket commit from a parallel session can capture a
  half-finished fixture. It was harmless here only because the capture happened to land on the
  pre-dispatch state.

## Files kept as evidence

- `fixture/repo/` — the whole post-run fixture, so a later reader can disagree without re-running.
- `fixture/PRE-DISPATCH-SHA256.txt` — the pre-dispatch hashes the diff claims rest on.
- Pre-dispatch fixture also in git at `888b7ce` (accidentally, see above).
