# Spec: the test surface, not the test count

Status: implemented — evidence: `npm test` → exit 0 (17 suites) · `node tools/sync-blocks.js --check` → all blocks in sync · `node release-hygiene.test.js` → five stamps at 1.30.0 · checker: CHANGES-REQUIRED (2026-08-30, `.ai/audits/2026-08-30-checker-test-surface.md`) → all five findings addressed, see Closure below · qa: n/a — this repo ships no running app; the behavior gates here are the two A/Bs
Weight: feature — a new enforced check, a new sync block and rules across nine model-facing files
Shipped: 2026-08-30, `main` at 2549cde — pushed with 1.30.0 and 1.31.0 in one deploy.
        Moved to `.ai/specs/implemented/` by the push, per the lifecycle.
Source: `wnioski z wdrożeń/2026-08-30-wnioski-o-testach-i-procesie.md` (N=1, one session, one escaped defect)
Framework-Version target: 1.30.0

## TLDR

A feature shipped 2026-08-29 with unit tests, Playwright e2e and a green `qa` gate. It worked for
zero customers. CloudFront rewrites the origin's `404` into `200 text/html`; every test asserted
against origin or against a mock, so **not one request was ever sent to the deployed address**. The
rule "every change has an e2e" was satisfied and useless, because it never says *against what* the
e2e runs.

This spec promotes the four findings from that session that have a mechanism, and declines the two
that do not yet.

**The one sentence:** a mock or an origin call is evidence about *code*; only a request to the
deployed address is evidence about the *system* — and the framework currently asks for neither by
name.

## Open Questions — answered under stated assumption

The human delegated this run explicitly ("wróć do mnie dopiero z przetestowanymi zmianami"), so the
forks below were resolved by me and are surfaced in the closing report rather than gating the work.
Each states what it assumed and what the alternative would have been.

- **Q1 — Enforcement or prose for the deployed-surface rule?** → *Enforcement.* The repo's own
  `promotion-prefers-enforcement` eval says a lesson promoted as prose is a lesson that gets broken;
  §3 of the source document is an agent breaking a rule it had read minutes earlier. Alternative
  considered: prose only in `sailes-spec`, cheaper, and exactly the failure mode already recorded.
- **Q2 — Where does the checker live?** → `tools/`, single copy, invoked by name from
  `sailes-pre-implement`. Alternative: a second byte-parity pair into
  `skills/sailes-bootstrap/hooks-template/` so a client repo can run it from its own hook. Declined
  for now: one parity pair (`business-logic-check`) is the total measured experience with that
  pattern, and doubling it before it has paid twice is speculation. Logged to `.ai/backlog.md`.
- **Q3 — Does the checker HARD-FAIL, or demand a written waiver?** → *Written waiver, with a
  reason.* Follows the repo's existing idiom (`qa: n/a` is written, never dropped; `enforced: none`
  in `business-logic-check`). A hard fail on an inferred trigger would be argued with once and
  disabled after that — the failure mode `AGENTS.md` records for `test:browser`. What the check
  buys is that the question is **asked and answered on disk**, which is precisely what was absent.
- **Q4 — Spec-size limit: a number, or a proportionality rule?** → *Proportionality, no number.* A
  line cap is trivially gamed and would push load-bearing content out of a spec — the failure
  `AGENTS.md` §Answer shape already names. Alternative: a hard cap, rejected.

## Non-goals

- Any change to the pre-implement gate's existence or strength. §3 of the source measures it as the
  best-spent time of the session; nothing here weakens it.
- A general "fewer tests" rule. The source explicitly does not support one (§6). The claim is about
  one *absent* cheap category and one *present* category that grants false confidence.
- Client-repo distribution of the new checker (Q2).
- Retro-fitting the rule into already-implemented specs.

---

## Phase 1 — the deployed-surface rule (the only change that would have prevented the defect)

**Rule.** A spec phase whose behavior depends on a **wire-level HTTP property** — status code,
header, or `Content-Type` — carries a `Deployed-probe:` field: one command, against the **deployed**
address, with the expected wire observation written out. Not against origin, not against a mock. If
the phase genuinely has no deployed surface to probe, the field is written `n/a — <reason>`; it is
never dropped.

**Landing sites (prose):**
- `skills/sailes-spec/SKILL.md` — workflow step 6 (Phasing), checklist, Red Flags.
- `skills/sailes-bootstrap/spec-writing-template.md` — the same three, kept in step with the above.
- `skills/sailes-pre-implement/SKILL.md` — the gate runs the checker and reports its output.
- `agents/qa.md` — a green mock is not a green system.

**Enforcement:** `tools/deployed-surface-check.js`
- Input: a spec markdown path. Exit 0 = every triggered phase answers; exit 1 = at least one does
  not, each named on stderr.
- Trigger: an HTTP wire-property signal in the spec body — a status code in HTTP context, a
  `Content-Type`, a named response header, a redirect claim.
- Satisfied by: a `Deployed-probe:` field whose value names a non-local `http(s)://` host, **or** an
  explicit `n/a — <reason ≥ 20 chars>`.
- Explicitly NOT satisfied by: `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`, `*.local`,
  `host.docker.internal`, or a bare `origin`. That list is the whole point of the check.

**Done-when:**
```
node tools/deployed-surface-check.test.js   → exit 0, all cases pass
node tools/deployed-surface-check.js tools/fixtures/deployed-surface/triggered-unanswered.md
                                            → exit 1, names the phase
node tools/deployed-surface-check.js tools/fixtures/deployed-surface/triggered-answered.md
                                            → exit 0
node tools/deployed-surface-check.js tools/fixtures/deployed-surface/no-http-surface.md
                                            → exit 0
npm test                                    → exit 0 (suite count +1)
```
Deployed-probe: n/a — this phase ships a local CLI checker and framework prose; there is no
deployed HTTP surface in this repo to probe. The rule applies to the repos this framework governs.

**Eval (A/B):** `evals/spec-probes-the-deployed-surface.md`. Arm A = `sailes-spec` at
`HEAD~`, arm B = edited. Same brief both arms — the source document's own scenario, stripped of its
conclusion. Binary: does the produced spec phase carry a check against a **deployed** address?

## Phase 2 — mock pairing

**Rule.** A mock of an **external** boundary (CDN, proxy, gateway, CRM, payments, auth provider) is
evidence about code behavior and never about system behavior. Every such mock carries a **pair**:
one check of the same boundary on the deployed environment. Without the pair the mock is not a
proof — it is an assumption written in test syntax, and it grants exactly the confidence that was
false here.

Internal boundaries (a repository, a clock, a queue the repo owns) are unaffected. The distinction
is *who can rewrite the response* — if something between the test and the assertion is operated by
someone else, it is external.

**Landing sites:** `skills/sailes-test/SKILL.md` (hard rules + the false-confidence table),
`agents/tester.md`, `agents/qa.md`.

**Done-when:**
```
grep -c "pair" skills/sailes-test/SKILL.md            → ≥ 1
node tools/sync-blocks.js --check                     → exit 0 (no block drift introduced)
npm test                                              → exit 0
```
Deployed-probe: n/a — prose-only phase, no HTTP surface.

**Eval (A/B):** `evals/mock-of-an-external-boundary-carries-a-pair.md`, same protocol as Phase 1.

## Phase 3 — diagnose ordering, promoted from prose to a dispatch precondition

**Rule.** `sailes-diagnose` hard rule 2 already says "run the live case before you audit code". The
source records an agent breaking it *minutes after reading it*, by dispatching three code-reading
subagents before running one `curl`. Prose that is read and broken does not get restated louder; it
gets a precondition. New text: **no code-reading subagent may be dispatched while the evidence
ledger holds zero observations from the live system.** One observation is the bar — one command, one
response — and it is usually also the answer.

**Landing sites:** `skills/sailes-diagnose/SKILL.md` (hard rule 2), `agents/team-lead.md` (the
dispatch section), `evals/diagnose-runs-live-case-before-audit.md` (new binary criterion).

**Done-when:**
```
grep -n "dispatch" skills/sailes-diagnose/SKILL.md    → the precondition is present
evals/diagnose-runs-live-case-before-audit.md         → carries criterion (f)
npm test                                              → exit 0
```
Deployed-probe: n/a — prose + eval-criterion phase.

## Phase 4 — the three cheap operational rules

No enforcement, no eval; each is one paragraph landing where the loop already reads.

- **4a — spec size is proportional to the change.** 365 lines of spec for ~50 lines of code is not
  rigour, it is a document that grew because it was patched in place instead of rewritten. Rule: a
  spec is rewritten, not amended, once its correction sections outnumber its design sections. Lands
  in `skills/sailes-spec/SKILL.md` Red Flags.
- **4b — a worker's report is written to disk from the first change, not at the end.** Measured: one
  brief died with its process holding an unwritten report; the one that wrote incrementally
  survived. Lands in the brief template in
  `skills/sailes-bootstrap/agent-team-structure.md` and in `agents/team-lead.md`.
- **4c — the lead verifies its working directory before any `isolation: worktree` dispatch.** A
  worktree is cut relative to cwd, so a "frontend" brief issued from the backend directory produces
  a backend worktree, and the worker is not wrong — the dispatch was. Lands in the same two files.

**Done-when:**
```
npm test                                              → exit 0
node tools/sync-blocks.js --check                     → exit 0
```
Deployed-probe: n/a — prose-only phase.

## Phase 5 — release hygiene

Five version stamps + `CHANGELOG.md` entry + `.ai/lessons.md` entry recording the escaped defect as
a gate autopsy (which gate should have caught it, what check that gate now gains).

**Done-when:**
```
npm test                                              → exit 0 (release-hygiene.test.js green)
node evals/harness/eval-status.js                     → new scenarios present, no NO-FILES among them
```
Deployed-probe: n/a — release bookkeeping.

---

## What this spec does NOT claim

N=1. One session, one defect, one lead. The source document says so itself and the claim is not
laundered here into a measured fact. Phase 1's checker is deterministic and its test proves the
checker; **neither proves the rule reduces escaped defects**, which needs sessions this repo has not
run yet. What is proven is narrower and still worth having: the question now has to be answered on
disk, where before it was not asked.

---

## Closure — 2026-08-30

**Gates.** `checker` returned **CHANGES-REQUIRED** with five findings
(`.ai/audits/2026-08-30-checker-test-surface.md`). All five addressed:

| # | Finding | Resolution |
|---|---|---|
| 1 | the staged `Last run:` of the unrun eval carried an ISO date, so `eval-status.js` reported a NEVER-RUN scenario as FRESH | the field now carries no date at all; the board prints `NEVER-RUN` |
| 2 | `claimsStatus` fired on `This query returns 404 matching rows` — and the test that was meant to cover the class used the past tense, so it passed while the common phrasing misfired | `COUNTED_NOUN` guard; the reviewer's four strings are now test cases |
| 3 | `findImplicitProbe` accepted any non-local URL — a Wikipedia link three lines under a `404` claim passed the phase at exit 0 | an implicit probe must be a **command** (`PROBE_COMMAND`); the exploit is a test case |
| 4 | `claimsRedirect` missed `redirected to /dashboard`; `claimsHeader` missed `Vary and Age headers` (`header` does not match inside `headers`) | both fixed, both pinned |
| 5 | the escaped-defect anecdote retold in full 6–7 times, once immediately before deferring to the file that owns it | `sailes-test/SKILL.md` cut to two sentences + the pointer. `qa.md`'s three mentions left: one telling plus two one-clause references, and stripping those would leave bare prohibitions, which this repo forbids |

Two landing sites the review found missing in `spec-writing-template.md` (workflow step 6) were
added. The file has no Red-Flags section to mirror; not invented for symmetry.

**Behavior gates — two A/Bs, one per half of the release.**
- `.ai/eval-runs/2026-08-30-deployed-surface-probe/` — the probe rule. Arm B exit 0, arm A exit 1.
  Control not clean, stated in the verdict.
- `.ai/eval-runs/2026-08-30-spec-weight/` — the weight rule. 15,102 → 6,719 bytes, 13 sections → 5,
  nothing load-bearing dropped. Probe dimension tied on that fixture.

**Cost, measured and not hidden.** Model-facing files grew **+21,981 bytes (+11.0%)** across the ten
skill and role definitions this touched (`skills/sailes-{spec,test,implement,pre-implement,diagnose}`,
`agents/{qa,tester,checker,team-lead}`, `agent-team-structure.md`). That is a real charge against the
speed half and it is not offset by the `spec-weight` saving, which lands in the *specs a repo writes*
rather than in the framework's own context. Roughly 5.7 KB of it is the `spec-weight` block stamped
into three consumers — the sync-block pattern's known and accepted price. The rest is rule text.

**The finding most worth carrying forward is not in the doctrine.** The new checker passed all seven
of its author's fixtures, then failed **five correct answers** the moment it met spec text a model
had actually written, and an adversarial review broke it twice more. Every one of the seven was
punctuation or layout, not substance — i.e. the check would have shipped as exactly the ceremony
this release exists to remove. **A check graded only on its author's fixtures is a check nobody has
tested**, and the cheapest way to test one is to run it against output from a model that has never
seen it.

**Owed, in `.ai/backlog.md`:** re-run `diagnose-runs-live-case-before-audit` against its new
criterion (f); dispatch `mock-of-an-external-boundary-carries-a-pair`; the client-repo copy of the
checker (Q2); re-ground `brief-closure.js:36-38`.
