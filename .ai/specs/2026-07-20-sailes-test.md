# sailes-test — make testing a craft with a gate, not a reminder

Status: approved
Date: 2026-07-20
Approved: 2026-07-20 by Jacek

> Open Questions answered 2026-07-20 (Q1→C, Q2→B, Q3→B, Q4→A, Q5→A). Research landed after the
> first gate and forced three amendments — risk-tiered detection proof, browser-first UI testing,
> and the `tester`/`qa` split — each re-decided with the human. Awaiting `Status: approved`.

## TLDR & Context

This framework treats tests as a **gate, never a craft**. `sailes-implement` gives test design a
single paragraph (§3); `agents/checker.md` verifies tests are *present*, not that they *detect*
anything; `agents/qa.md` proves behavior only at the end, by clicking around ad hoc. Nothing
answers the question that actually costs client projects time: **how do you design a suite for a
feature wired into Pipedrive + Make + Slack + an LLM API?**

The consequence is a specific, documented failure: an agent reads the implementation and writes
tests that mirror it. They are green on the first run and green forever, because they encode the
same assumption the code encodes. Such a suite is worse than none — it converts "untested" into
"verified" while changing nothing, and the presence of tests *raises* reviewer confidence exactly
when it should lower it.

This spec adds a `sailes-test` skill and a `tester` role running as the last verification step
**within each phase** of a spec, before `checker` and `qa`.

## Problem Statement

Verified against the repo on 2026-07-20 (files read, `npm test` run — 34 tests green):

1. **No skill owns test design.** 13 skills; none about testing. `grep -ril test skills/` matches
   40 files, every hit a gate condition or checklist line.
2. **One real test-design pattern exists** — `sailes-spec`'s permission matrix → generated
   authz-matrix suite (`sailes-spec/SKILL.md:88`). It works because the spec declares a table and
   implementation turns it into its executable form. This spec generalizes that pattern; nothing
   else does.
3. **`checker` grades presence, not detection** (`sailes-implement/SKILL.md:40`). A tautological
   test passes that check.
4. **Integration rules exist only as architecture.** `sailes-async/harness-checklist.md` specifies
   idempotency, replay, retry-by-error-class, ordering. Nobody turns them into assertions.
5. **The human is structurally absent.** An agent cannot obtain a Pipedrive sandbox or a Slack test
   channel. It mocks the boundary and reports green — invisible precisely because the mock always answers.

### Evidence base

Commissioned during this session; sources verified by URL.

- **The core pathology is documented.** Konstantinou, Degiovanni & Papadakis, *Do LLMs generate test
  oracles that capture the actual or the expected program behaviour?* — https://arxiv.org/abs/2410.21136
  Verified verbatim from the abstract on 2026-07-20: "LLM-based test generation approaches are also
  prone on generating oracles that capture the actual program behaviour rather than the expected
  one." Study scope: 24 open-source Java repositories. Two further findings from the same abstract,
  both useful here: LLMs "can generate better test oracles when the code contains meaningful test or
  variable names", and LLM-generated oracles "have higher fault detection potential than the Evosuite
  ones" — so the problem is oracle *provenance*, not model incapability, which is exactly what the
  isolation step attacks.
- **The principle, stated plainly.** "The oracle cannot be derived from the thing you're testing"
  — https://arthurhertweck.dev/writing/tautological-testing
- **Survey evidence**: raw LLM test output pass rates 24–34%, rising above 70% with
  generate-validate-repair; hallucinated APIs up to 43.6% of compile failures; the standing
  conclusion is that usability improved while **effectiveness did not** — tests compile and pass
  but do not catch bugs — https://arxiv.org/abs/2511.21382
- **Mutation feedback measurably helps**: MuTAP reports 93.57% mutation score and 28% more
  real-world bugs detected. https://arxiv.org/abs/2405.03786
- **Anthropic's own guidance** treats TDD as the strongest agentic pattern precisely because tests
  are an external oracle, paired with committing tests before implementation so tampering shows in
  the diff. https://code.claude.com/docs/en/best-practices
- **Doubles**: Fowler's taxonomy and the classicist/mockist split —
  https://martinfowler.com/articles/mocksArentStubs.html; Google's "unfaithful doubles" and the
  ownership rule — https://abseil.io/resources/swe-book/html/ch13.html
- **Flakiness**: ~1.5% of runs flaky, ~16% of tests have flaked, at Google —
  https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html
- **Flake causes, ranked**: Luo et al., *An Empirical Analysis of Flaky Tests* (FSE 2014) categorized
  **201 commits across 51 projects** and found **asynchronous calls, concurrency bugs and test-order
  dependencies** to be the most common causes, in that order — scope and ranking confirmed 2026-07-20
  via an independent peer-reviewed citation (https://arxiv.org/html/2504.16777, Related Work).
  **The widely-circulated 45% / 20% / 12% split could NOT be confirmed against the paper or any
  peer-reviewed citation of it** — cite the ranking, never the percentages.

## Proposed Solution — informational isolation, then a human freeze

The phase runs **after** the code. The anti-mirroring defense comes not from chronology but from
**what the agent has been allowed to read** — the trick `checker` already uses (it receives the
diff and the spec, never the maker's narrative).

| # | Step | Actor | Constraint |
|---|---|---|---|
| 1 | Derive expected behaviors **from the spec only** | `tester` | must not read the implementation |
| 2 | Approve / add / strike → freeze to `.ai/test-plans/<spec>.md` | **human** | hard block |
| 3 | Write the suite from the frozen list | `tester` | authors code; runs it while authoring |
| 4 | Read the diff → **add** edge cases | `tester` | **weakening an assertion is forbidden** |
| 5 | Prove detection at the risk tier the feature earns | `tester` | tier from triggers, not opinion |
| 6 | Review diff incl. tests | `checker` | read-only; + uncovered-ID check |
| 7 | Run the suite on the live app as the **gate verdict**, plus what a script cannot judge | `qa` | read-only |

**Step 1 — derivation is the agent's own work, not the human's reading.** Before writing the
behavior list, `tester` must build equivalence partitions (including invalid ones), boundary values
(min−1/min/min+1/max−1/max/max+1), a decision table where output depends on condition combinations,
and a state-transition table **including illegal transitions** — plus, explicitly, the failure path
for every behavior, because specs describe happy paths almost exclusively. That derivation stays
with the agent. The human sees only the resulting list and the questions.

**Step 2 is a hard block** (Q4) and is **question-shaped, not a wall of test names.** This is the
design's biggest lever and its biggest liability: a gate that gets skimmed and signed launders
false confidence, which is worse than no gate because the artifact now carries a human signature.
The agent must surface **what it could not derive from the spec** as a short list of real questions.
A human answering five genuine ambiguities is a working gate; a human approving forty test names is not.

**Step 4's one-way rule is load-bearing.** Without it, an agent facing a red test edits the
expectation to match the code and step 1 buys nothing. Every behavior carries a stable ID, so
`checker` can enumerate IDs with no corresponding test.

**Step 7 — `tester` authors, `qa` adjudicates.** `tester` runs the suite while authoring (a test
nobody ran is not a test) and performs the detection proof. The gate verdict comes from `qa`
running it against the live app in a fresh context, plus the judgments no script makes: comparison
against the design artifact and visual regression against `.ai/screens/`. Two independent runs; the
second by an agent that did not author what it is grading.

## Detection proof — tiered by what a false green costs

Self-chosen mutation is self-assessment: an agent picks a fault its test already catches. Every
positive result in the literature comes from **tool-generated** mutants the model did not choose.
The tier decides how far to close that hole, and **the tier is computed from triggers, never from
the agent's judgment** — the same principle the session router runs on: the filesystem decides, not
the model's read.

| Tier | Trigger (mechanical) | Detection proof required |
|---|---|---|
| **A — critical** | money · auth / permissions / tenancy · idempotency · irreversible outbound write (CRM, email, Slack, payment) | **Stryker** on the touched files; every surviving mutant killed or explained in writing |
| **B — standard** | ordinary business logic, internal writes | mutation **per B-ID**: break exactly that behavior, show that ID's test go red, revert, suite green again |
| **C — low** | reads, UI, formatting, cosmetics | green suite; per-B-ID proof only for behaviors the human marks as material |

Rules: the human may **raise** a tier (recorded in the plan with a reason); the agent may **never
lower** one. Stryker's cost lands only on files touched in a tier-A phase — typically a handful, not
the repo.

## Browser-first for anything a user can see

**Every behavior visible in the UI is proven through a real browser** (Playwright/Chromium), clicked
as a user would. Pure computation and data mapping stay at a lower level, where they are fast and stable.

**Form coverage rule.** Every field is exercised: a valid value, an invalid value, empty-when-required,
and boundary length. Optional fields are exercised both filled and empty. The assertion lands on the
**resulting state** (database row / API response), never on a "Saved" toast alone.

**Anti-flake rules ship with this or the suite dies.** A flickering E2E suite gets disabled within
weeks, and then it protects nothing — timing is the dominant flake cause, and the browser is its home turf.

- Never `sleep`. Poll for a condition with a timeout, or control the clock.
- Inject the clock; fake timers for anything time-dependent.
- Seed all randomness; print the seed on failure.
- Fresh state per test; no shared mutable fixtures; the suite must pass under randomized order.
- **Auto-retry to green is banned.** It destroys the only signal separating a real intermittent bug
  from flake.

## Artifact contract — `.ai/test-plans/<spec>.md`

Business language, not code. Contested and omitted material comes **first** — that is where the
human's two minutes belong.

```markdown
# Test plan — <spec title>
Spec: .ai/specs/<spec>.md
Phase: <n>          Risk tier: A | B | C  (triggers: <which fired>)
Status: DRAFT | FROZEN            # step 3 may not start while DRAFT
Frozen: <date> by <human>

## I could not derive this from the spec — please decide
❓ B<n>: <the ambiguity, as a question with options>

## NOT testing (deliberately)
—  <thing> — <why out of scope>

## Requires you
🔑  <credential / sandbox>                   → blocks B<n>, B<m>
👉  <manual step no automation can perform>  → covers B<n>

## Behaviors
### Happy path
B1  <trigger>  ⇒  <expected outcome>            [browser | api | unit]
### Edges and failures
B4  <trigger>  ⇒  <expected outcome>            [browser | api | unit]
```

**ID contract (Q2 → B).** IDs are append-only within a phase. Striking a behavior marks it
`~~B3~~ (struck by <human>, <date>)` rather than renumbering — otherwise a test pointing at B3
silently starts "covering" something else. Test names must contain their ID
(`B4 — duplicate webhook creates exactly one record`), which is what lets `checker` grep for
uncovered IDs. Lifecycle mirrors the spec's: the plan moves to `implemented/` alongside it.

## External systems — a decision card per integration, not one house rule

Slack and a payment provider carry different costs of being wrong, so one blanket policy is wrong
for one of them. `tester` presents the fork; the human chooses; the answer is recorded in the plan.

| Option | Buys | Costs |
|---|---|---|
| Mock / MSW | fast, hermetic, no credentials | drifts from the real API silently — the classic false green |
| Fake (in-memory implementation) | real behavior incl. state, still fast | you maintain it, and you are not the API owner |
| Recorded cassette | real payloads, replayable | staleness invisible until re-recorded; looks realer than it is |
| Real sandbox | actual contract verified | needs credentials from the human; slow; flaky |

**Hard constraint the skill must state: consumer-driven contract testing does not work against
third-party APIs.** Pipedrive will not run your provider verification. The substitutes are schema
validation of real recorded responses, a scheduled canary against a sandbox, or comparison against
the vendor's published OpenAPI spec. Every cassette carries a recorded-at date and a scheduled
re-record that fails on diff; replayed responses are schema-validated so shape drift fails even
where the assertion would not.

**Where no exact oracle exists — LLM-backed features especially — use metamorphic relations**
(reordering semantically identical input yields the same extracted fields; a broader search's
results are a superset of a narrower one's) and property-based tests (round-trip, idempotency,
order-independence). Asserting exact LLM output is not a test.

## Skill & role surface

| Path | Kind | Purpose |
|---|---|---|
| `skills/sailes-test/SKILL.md` | new | the 7 steps, artifact contract, human protocol, tier table |
| `skills/sailes-test/references/techniques.md` | new | arsenal + "when to reach for which", sourced |
| `skills/sailes-test/references/external-systems.md` | new | the four-option card + third-party contract limits |
| `skills/sailes-test/references/browser-e2e.md` | new | Playwright rules, form coverage, anti-flake |
| `skills/sailes-test/test-plan-template.md` | new | the artifact above, copyable |
| `agents/tester.md` + `codex-agents/tester.toml` | new | the role, both sides (Q5 → A) |
| `agents/qa.md` + `codex-agents/qa.toml` | edit | runs the authored suite as the gate verdict |
| `agents/checker.md` | edit | uncovered frozen IDs are a defect |
| `skills/sailes-async/harness-checklist.md` | edit | "how this is tested" column (Q3 → B) |
| `skills/sailes-implement/SKILL.md` | edit | §3, phase gate, Quick Reference, Red Flags |
| `skills/sailes-bootstrap/agent-team-structure.md` | edit | roster, order, gate isolation |
| `codex-agents/validate-toml.test.js` | **edit** | its `ROLES` array is hardcoded to 7 — a new `.toml` is otherwise never validated |
| `evals/tester-derives-cases-before-reading-code.md` | new | the isolation must actually hold |
| `evals/tester-never-weakens-a-frozen-assertion.md` | new | the one-way rule |
| `evals/tester-cannot-lower-its-own-risk-tier.md` | new | the tier rule is self-serving without one |

### The RED-test mandate and the `tester` suite are different artifacts

`sailes-implement` tells the implementing dev to identify a **RED test first** (`SKILL.md:30`,
restated at `:62`). That stays, and it does not contradict this protocol — but the file must say
so, because two test mandates in one document without a stated relationship is an invitation to
follow the cheaper one.

- The dev's RED test is **scaffolding for its step**. It is allowed to be implementation-shaped;
  its job is to drive one increment, not to grade it.
- The `tester` suite is **the graded artifact**, authored under informational isolation, and is
  what the gate reads.
- `tester` may delete or replace a dev's test **only** by superseding it with an ID-bearing
  equivalent from the frozen list. Deleting a test to make a suite green is the one-way rule's
  violation under a different name.

**No test infrastructure? (Q1 → C.)** `tester` reports `ENV-DEFECT` — `qa`'s vocabulary — and
attaches a concrete setup proposal (runner, fixtures, seed path) for the human to approve. It never
stands infrastructure up unilaterally: that is a stack decision and the HUMAN rule forbids it.

## Phasing & Steps

### Phase 1 — artifact contract + skill core
**Done-when:** `skills/sailes-test/SKILL.md` and `test-plan-template.md` both exist; a `node -e`
check prints frontmatter `name` = `sailes-test` and confirms `description` contains `test`,
`edge case`, `test plan`; the template contains all five required headings in the specified order
(questions → not-testing → requires-you → behaviors). Output pasted.

### Phase 2 — technique arsenal
**Done-when:** every technique section in `references/techniques.md` carries ≥1 source URL; zero
unsourced sections; a scripted loop over the extracted links is run and its full output pasted.
**Non-200 protocol:** a failing link is investigated and either replaced with a working source or
annotated `[checked YYYY-MM-DD, unreachable]` in the file — never silently dropped, and never
counted as a pass. Network failure is not a correctness signal, so the gate is "every link was
checked and its result recorded", not "every link returned 200".

### Phase 3 — browser + external-systems references
**Done-when:** `references/browser-e2e.md` contains the form-coverage rule and all five anti-flake
rules (asserted by grep, 5/5); `references/external-systems.md` contains the four-option table and
the explicit third-party contract-testing limitation. Output pasted.

### Phase 4 — the `tester` role
**Done-when:** a `node -e` check reads `codex-agents/validate-toml.test.js`, prints its `ROLES`
array, and asserts **`length === 8` and `ROLES.includes('tester')`** — a green `npm test` alone does
NOT satisfy this phase, because the validator iterates that hardcoded array rather than the
directory and stays green while ignoring an unlisted file. Then `node codex-agents/validate-toml.test.js`
→ all passing, output pasted. `agents/tester.md` frontmatter parses and its `tools:` includes
`Write` and `Edit` (the one gate role that writes).

### Phase 5 — wire into the pipeline
The pipeline order appears **twice** in `agent-team-structure.md` (line 41, and line 133 in the
teams-off fallback), and the two are already not byte-identical. Line 133 additionally enumerates
the read-only roles as `explorer, checker, qa` — a sentence that becomes **false** once a writing
gate ships. Every repo running with teams mode off reads that fallback section.

**Done-when:** `grep -c 'tester' skills/sailes-bootstrap/agent-team-structure.md` → **≥ 2**, and a
printed grep shows `tester` present in *both* the main order line and the fallback order line;
the read-only enumeration on the fallback line no longer implies `tester` (asserted by reading the
line back and pasting it). `grep -n 'tester'` returns ≥1 hit in each of `sailes-implement/SKILL.md`,
`agents/checker.md`, `agents/qa.md`, `codex-agents/qa.toml`. `npm test` still green.
Assertions grep for `tester` and `checker` as separate literals — **never for the `→` arrow**,
which is not reliable through MSYS.

### Phase 6 — async proof column
**Done-when:** all **15** checklist items in `harness-checklist.md` — the numbered items under
*Intake boundary* (1–5), *Durable pipeline* (6–10) and *Observability / safety net* (11–15) — have
a non-empty test column; counted by script, **15/15** pasted, not "most". The closing *four P0s*
recap is numbered 1–4 but is a summary, not a checklist item: a naive `^[0-9]` count returns **19**
and must not be used as the assertion.

### Phase 7 — evals, changelog, release
**Done-when:** a `node -e` check prints the version from `VERSION`, `package.json`,
`.claude-plugin/plugin.json` **and** `.claude-plugin/marketplace.json` → **four identical** `1.10.0`
strings (this fourth manifest has drifted twice); `CHANGELOG.md` has a `## 1.10.0` heading;
`npm test` green; **all three** eval scenarios written with RED/GREEN arms — isolation, the one-way
rule, and tier-lowering.

> **No-push window.** Phase 1 writes a `SKILL.md` referencing `references/*.md` that do not exist
> until Phase 3. The repo stays consistent (tests pass) but the skill is not shippable. `main` is
> production and a push deploys itself — so nothing merges before Phase 7.

## Integration Coverage

| Surface | Check |
|---|---|
| `codex-agents/tester.toml` | existing `validate-toml.test.js`, +1 file |
| four manifests | version-parity assertion, Phase 7 |
| `harness-checklist.md` | scripted 15/15 column count |
| references' sources | HTTP 200 sweep, Phase 2 |
| `tester` isolation behavior | `evals/tester-derives-cases-before-reading-code.md` |
| `tester` one-way rule | `evals/tester-never-weakens-a-frozen-assertion.md` |

Model behavior under these instructions is not script-testable and gets **evals, not tests** — the
repo's standing distinction (`AGENTS.md` Verification).

## Risks

- **Approval fatigue is the top risk, and a signed rubber stamp is worse than no gate.** Mitigation
  is structural: the artifact leads with questions the agent could not answer from the spec, and
  re-freezes surface deltas rather than the whole list. Revisit granularity — never soften the gate
  — if it proves heavy in practice.
- **The one-way rule has a partial mechanism.** `checker` detects an *uncovered* ID; it cannot
  detect an assertion quietly weakened under a retained ID. That residue stays on human review.
- **Tier B proof remains a proxy.** Per-B-ID mutation removes cherry-picking but is not mutation
  testing, and the skill must not describe it as if it were.
- **Browser-first raises flake exposure.** The anti-flake rules are not advisory; a suite that
  flickers gets disabled, and then the whole investment protects nothing.
- **Blast radius.** New skill + new role changes behavior in every repo on the machine. Branch until
  the evals return a verdict; `main` is not a staging area.

## Non-Goals

- Not touching `evals/` as a mechanism — a test is not an eval.
- Not building a hook to guard the test plan — rejected on blast radius, parked in `.ai/backlog.md`.
- **Never gating on line coverage.** Trivially satisfiable by an agent, and it raises reviewer
  confidence exactly when it should lower it. Mutation score on tier-A modules replaces it.
- Not mandating Stryker outside tier A.
- Not replacing `checker`; not removing `qa` — `qa` gains an instrument and keeps its judgment.

## Decisions Ledger

| Decision | Chosen | By | Rejected (why) |
|---|---|---|---|
| Audience | client B2B repos | user | framework itself; both (skill-for-everything) |
| Shape | skill + `tester` role, own gate | user | reference in implement (no gate = no change) |
| Timing | last phase + informational isolation | user | pure pre-code TDD; from-diff (mirror pathology) |
| Gate order | `tester` → `checker` → `qa` | user | checker-first; tester absorbs qa |
| Authoring vs verdict | `tester` authors + self-checks; `qa` runs as verdict | user | tester never runs (pushes step 5 onto read-only qa); tester runs everything (loses the independent second run) |
| Enforcement | `.ai/test-plans/<spec>.md` | user | prose only; guard hook (blast radius) |
| Granularity | per spec phase | user | once at end (phase-1 bug surfaces after phase 5) |
| External systems | decision card per integration | user | one imposed strategy |
| Detection proof | **risk-tiered**: A Stryker / B per-B-ID / C green | user | flat self-chosen break (self-assessment); Stryker everywhere (cost) |
| Tier assignment | mechanical triggers; human may raise, agent may never lower | user | agent judgment (would lowball) |
| UI behaviors | browser-driven, all fields exercised | user | everything through browser (flake); one journey per flow (edges unclicked) |
| Step-1 derivation | agent's own work, not in the artifact | user | full table in artifact (approval fatigue) |
| Arsenal depth | full + "when to use which" | user | basics only |
| Language | English | user | Polish |
| Q1 no infrastructure | ENV-DEFECT + proposal to approve | user | bare ENV-DEFECT; agent sets it up |
| Q2 list format | stable IDs + test-name convention | user | free markdown; full YAML |
| Q3 async rules | `sailes-async` gains test column | user | duplicate chapter (drift); bare pointer |
| Q4 human absent | hard block | user | provisional list; agent decides |
| Q5 codex parity | ship both | user | Claude-only (breaks an invariant silently) |
| Version / plan lifecycle / file layout | 1.10.0 · mirrors spec folders · SKILL.md + references/ | AI-stated, unvetoed | — |

## Verification log — both debts closed 2026-07-20

Research surfaced two sets of figures and flagged them unverified. A second research agent was
dispatched to check them and went idle three times without delivering, so the checks were done
directly. Both resolved, and **one of the two number-sets does not survive**.

| Claim | Verdict |
|---|---|
| arXiv 2410.21136 reports ~62% implementation-biased vs ~38% expected oracles; ~45% of oracles passing on buggy variants; docstrings shifting bias ~70%→~55% | **REJECTED — the abstract contains no percentages at all.** Its only figure is "24 open-source Java repositories". The qualitative finding is real and quoted above; these numbers appear to have been manufactured during summarization. They must never be cited. |
| Flaky causes split ~45% async / ~20% concurrency / ~12% test-order, attributed to Luo et al. FSE 2014 | **PARTIALLY CONFIRMED.** Scope (201 commits, 51 projects) and the *ranking* (async → concurrency → order-dependency as most common) confirmed via a peer-reviewed citation. The **percentages could not be confirmed** from the paper or any peer-reviewed citation of it. Cite the ranking; never the split. |

This is the pathology the skill exists to prevent, encountered while writing the skill: a
confident, well-formatted claim that dissolves on contact with the source. It belongs in
`references/techniques.md` as a worked example, and in `.ai/lessons.md`.

Phase 2's Done-when — a live URL per technique section — remains the standing guard.
