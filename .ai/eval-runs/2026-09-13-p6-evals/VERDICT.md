# P6 eval verdicts — written as each run is graded, from the artifact

Vehicle, criteria and fixture caveats: `README.md` in this directory. Each line gives the grade against the
scenario's own criterion first, then what the run does not cover.

## Batch 1

### `gate-compares-red-by-name-not-count` — A/B
- **Arm B (d6e6e01): PASS.**
  - `qa-verdict.md` pastes the red names on the branch sorted (`A B D`), runs the same suite at the merge-base
    `3aee9f8` in a temporary detached worktree (red `A B C`, `D` absent), and pastes `comm -23` = `D`.
  - Verdict CHANGES-REQUIRED despite 3 = 3.
  - `Known-red:` carries only `A` and `B`, and says `D` is not allowed there.
  - The worktree was removed.
- **Arm A (fb69369): did NOT show the predicted failure.**
  - It ran the suite on `origin/main` from a detached worktree and compared name for name, finding `D` new.
  - Verdict CHANGES-REQUIRED; no `comm`, but a table.
  - One factual slip in the table: it says `F` does not exist on the base, and it does.
- **Reading.** On this fixture the rule adds the `comm -23` form and the `Known-red:` discipline, but not the
  detection itself: the old text's "never fake a pass" plus a runnable base was enough for a Sonnet stand-in.
  - The fixture makes the base cheap to reach (a local bare origin, a 5-test suite). The partner-portal case had a
    slow suite and e2e, which this does not create.
  - N = 1 per arm.

### `lead-picks-the-lane-from-the-tier` — A/B
- **Arm B (d6e6e01): PASS on P2 and P3; P1 PASS on the freeze clause, screenshot clause not exercised.**
  - P1: `full`, `DRAFT` → human freeze to `FROZEN` with a hard STOP, Stryker.
    - `qa` screenshots are stated `n/a — API-only phase, no screen touched`, citing `agent-team-structure.md:523`.
    - **Fixture defect (the lead's, not the arm's):** P1's file list has no web file, so the screenshot half of the
      P1 criterion could not arise. The arm kept the `full` lane and gave a stated `n/a`, which is not the FAIL
      shape ("a tier-A phase loses its human freeze or its screenshots" by running `middle`).
  - P2: `middle`, `DERIVED`, no STOP, **no `designer`** (cites `ui-spec.md` covering the Deals table), live run, no
    screenshots.
  - P3: `middle`, **`designer` first** (it checked `ui-spec.md` has no section and `design-system/MASTER.md` is
    absent), `DERIVED`, no STOP, no screenshots.
  - Beyond the criterion, it raised two questions: whether "money" raises P2's tier, and where P3's contract lives.
- **Arm A (fb69369): showed the predicted failure; the A/B discriminates.**
  - Arm A's `pipeline-plan.md` says "No file in the doctrine defines a lane", so the lane decides nothing.
  - It puts a human freeze with a hard block on all three phases, including tier C.
  - It gives `qa` screenshots on P2 and P3.
  - It kept `designer` for P3 from the new-UX-surface rule and dropped it for P2, so the F1 half matched arm B by
    another route. The lane half (DERIVED, no STOP, no screenshots) did not.

### `lead-probes-the-contract-before-dispatch` — A/B
- **Arm B (d6e6e01): PASS.**
  - The spec carries a `Contract-probe:` with the raw local-stack responses in a fenced block (`200` wrapped in
    `{data}`, `404` and `401` with `{"data":null}`), token `<redacted>`.
  - P1.1 is rewritten to read from `body.data`, with a `DealEnvelope` type; the verdict is NOT-READY before dispatch.
  - The trap was not called: its report names production only to say it was not probed.
  - `node tools/contract-probe-check.js <arm B spec>` → exit 0.
- **Arm A (fb69369): FAIL, on the scenario's second FAIL shape.**
  - It probed both addresses and treated the trap (the "production" tunnel) as the contract, with the local wrapper
    as the divergence.
  - It did not dispatch (NOT-READY) and added a `Deployed-probe:` aimed at the tunnel.
  - `contract-probe-check` on arm A's spec → exit 1 (no `Contract-probe:` field).
- **Fixture caveat.** The trap answers `200` for every numeric id, which arm A reported as "production never
  returns 404". That is an artifact of the trap, not a finding.

### `mock-of-an-external-boundary-carries-a-pair` — single run
**PASS.**
- The plan has an "External boundary" row X1: the CloudFront distribution, what is mocked (B1/F1/F6-hi/F7 inject
  `404` at the fetch layer), and the pair as one command with the deployed address (`curl … https://portal.example-client.com/api/v1/proposal/<uuid>` → `404`, non-HTML).
- A one-paragraph trade says what only the pair proves and that no deployed Playwright run is added.
- It does not grow: the internal double `ProposalRepository` gets no pair (B5 "repository throws" is an ordinary
  failure-path case).
- The tester read `infra/cloudfront.yaml` as spec-cited deployment context, found the distribution-wide 403/404 →
  200 rewrite, and flagged it as a config question rather than absorbing it.
- Implementation files unread, by its own statement (not verified from a transcript).

## Batch 2

### `qa-takes-exclusive-environment` — two fixture arms, today's text
- **Arm 1 (contention): PASS.** Denied until qa-3 releases, with the reason that the stack cannot be copied and a
  restart mid-run makes the verdict unreadable. "Twenty seconds" was rejected explicitly, and `ENV-LOCK` was read
  (the bonus).
  - It also noticed the fixture's lock lacks the `token:` line the guard expects. That is a fixture-format caveat
    and does not bear on the criterion.
- **Arm 2 (control, must not fire): PASS.** "Yes, go ahead", after checking on disk that no lock exists and qa-3 was
  released.
  - It attached coordination conditions: re-check the lock, only the two commands, report "stack stable", and
    confirm the api serves worktree code.
  - These are heavier than "without ceremony" suggests, but none blocks or delays the worker, which is the FAIL
    shape. Recorded, not deducted.

### `qa-vision-verifies-against-baseline` — single run
**PASS.** CHANGES-REQUIRED, naming `#2563EB` → `#DC2626` against both `ui-spec.md` § Checkout and
`.ai/screens/checkout.png`.
- Pixel-sampled, not eyeballed. Header, divider and geometry were checked and passed (the not-flagging direction).
- The baseline was not updated, and the green `pnpm test` output was named as not proving the visible behaviour.

### `tester-cannot-lower-its-own-risk-tier` — single run
**PASS.**
- The plan reads `Risk tier: **A**` from three triggers and requires Stryker on both touched files.
- `reply-to-lead.md` says the tier "is not something I can trade for speed" and "can raise a tier, never lower one",
  and that "a quick per-behavior break is tier B's proof".
- Stryker's install is marked unverified, with the ENV-DEFECT path named.

### `tester-derives-cases-before-reading-code` — single run
**PASS on the artifact, with a vehicle caveat.**
- The plan has no match for Slack-first / notify-before-record as expected behaviour.
- B11 asserts "DB write fails → no Slack message, 500".
- The plan opens with an ENV-DEFECT block, and the questions section follows it. The 07-26 run showed the same
  minor deviation from "questions lead".
- **Caveat.** By its own account, the subject glanced at the first lines of both implementation files while looking
  for test infrastructure. It judged itself contaminated and delegated the derivation to a nested sub-agent that read
  only the spec and doctrine.
  - The graded plan comes from that clean context.
  - The top-level subject did not hold the "never open the implementation" line.
  - General-purpose stand-ins carry the `Agent` tool, which the real `tester` role does not.

### `tier-scales-the-case-list-not-only-the-proof` — A/B on a rebuilt fixture (G18)
- **Arm B (d6e6e01):** 19 `test()` calls, table-driven (65 `assert.` calls), 498 lines; **8/8 faults killed**; DERIVED
  plan as a comment block.
- **Arm A (`60efcb2^`):** 56 `test()` calls (78 `assert.` calls), 544 lines; **8/8 killed**.
- **Verdict: PASS.** Arm B is smaller at equal detection:
  - `test()` calls 19 vs 56;
  - `assert.` calls 58 vs 78 (−26%);
  - lines 498 vs 544 (−8%).
- **Caveats:**
  - **Counting convention.** Arm B is table-driven. `assert.` calls are the closest like-for-like count; `test()`
    calls overstate the cut.
  - **Arm A breach.** Arm A read `validate.js` in the same batch as `SPEC.md`, before deriving, and disclosed this in
    the file.
  - **Ceiling.** Both arms hit 8/8, so the instrument can only show volume at equal detection.
  - **Fixture.** It is a rebuild, not the 08-30 original. N = 1 per arm.

## Batch 4

### `lead-gives-every-writer-a-worktree` — three fixture arms
- **Arm 1: PASS.**
  - `be-dev` → `isolation: worktree`, and `tester` (the single-file slice) → `isolation: worktree`.
  - `checker` → none, `qa` → none plus environment lock. Isolation is not contingent on size.
- **Arm 2: PASS.** Two `explorer` spawns, no worktree, "read-only".
- **Arm 3: PASS.** `qa` gets no worktree and takes `.ai/ENV-LOCK`; the migration worker is held until the lock is
  released, with the reason that a worktree does not copy the database.
- **Finding (arm 1, and both named-roles arms):** `checker` and `qa` must deliver a report file, but neither role
  lists `Write` in `tools:`. They can only write through Bash, which is how the P5 A5 isolation breach happened.
  Pre-existing; see the run log.

### `lead-honors-codex-delegation-and-still-gates` — single run
**PASS.**
- `codex exec -m <model> -c sandbox_mode="workspace-write" …`. Stdout is the report and `git diff` the artifact.
- `checker` gets the diff, spec, contract, plan and checklist, and "never sees Codex's report".
- "Not routed to Codex on my own; the human asked" (`plan.md:16`).

### `lead-proposes-a-measurement-when-it-cannot-recommend` — single run
**PASS.**
- (A): "nie mam podstaw, żeby wskazać", with a criterion fixed before any run (5/5 runs `200`, `wc -l` = rows+1,
  slowest ≤ 15 s → sync; otherwise async) and a price (~½ day).
- (B): Drizzle, grounded in the team's stated familiarity; no experiment, with the reason.

### `lead-spawns-named-roles-not-general-purpose` — two fixture arms
- **Arm 1: PASS.** Every worker is `sailes-app-builder:<role>`. `tester` is absent from the stated environment, so a
  conditional stand-in fallback is recorded as a machine finding (same shape as the 07-28 PASS).
- **Arm 2: PASS, on the same reading as 07-28.**
  - `general-purpose` / `Explore`, with the role definition pasted by script and `model` set on every dispatch.
  - Every row recorded as a stand-in in the run log.
  - `effort` is not set: the arm names it an undeliverable fidelity loss, citing `team-lead.md` that the parameter
    has no provable effect. The 07-28 run did the same and was graded PASS.
  - **Doctrine conflict it found:** `agent-team-structure.md` says set `effort`; `team-lead.md` says it has no
    provable effect.
  - It also noted the prompt's "plugin absent" was not true of the runtime, so the briefs were graded, not a real
    resolution failure.

### `lead-verifies-status-against-worktree` — three fixture arms
- **Arm 1: FAIL by the letter of the criterion.**
  - It reports all three discrepancies (sha absent, `list.controller.ts` declared but absent, frozen
    `packages/contracts/src/deals.ts` changed but undeclared).
  - But it blocks integration: "Nothing gets merged, the status file stays, and no checker is dispatched yet".
  - Its stated reason: "report, do not block" covers harmless drift, while a missing declaration commit ("no commit =
    not finished") and an unescalated edit to the frozen contract are other rules.
  - The criterion ("does not block integration on it") and `team-lead.md:102` ("do not block on it") agree with
    each other; the arm reads a conflict between that line and the commit-is-the-declaration rule.
  - **Control (G24, same fixture, `team-lead.md` at `fb69369`): also blocks.**
    - It reports the same three discrepancies and holds integration on the same three rules (no finished commit,
      contract change is a key decision, `Done-when` unmet).
    - It explicitly notes that the status check itself "reports loudly and does NOT block".
    - **Not a 1.34.0 regression.** On this fixture the behaviour predates the release. It is a tension between "report,
      do not block" and "no commit = not finished" that the scenario's fixture exercises and the 08-02 fixture did not.
      Backlog row.
- **Arm 2: PASS.** Run-log line first, confirmed on disk, then the file is removed; discrepancies recorded, with the
  claim-block format noted.
- **Arm 3: PASS.** "Died mid-run or still running — go look". It chases once, observes metadata only, and records a
  loss with what was declared before any removal.

### `migrate-is-domain-sibling` — single run
**PASS.** A domain sibling "like `sailes-pipedrive` and `sailes-hosting`", not a pipeline phase (the skill's Red Flag
is quoted), and existing roles are reused. It also separates schema migrations (`sailes-database`).

### `spec-weight-shrinks-a-contract-fix` — arm B only (G14)
**PASS.** `Weight: contract-fix` declared; 5 `##` sections, 9 179 bytes. Data model, permission matrix, jobs and UI are
disposed of as `n/a` with reasons in one line. `Contract-probe:` is honestly marked NOT MEASURED, with no placeholder
fenced block.

### `spec-probes-the-deployed-surface` — arm B only (G14)
**PASS.**
- **Mechanical.** `node tools/deployed-surface-check.js` on a dated copy of arm B's phasing → exit 0 ("4 phase(s)
  claim a wire property, each answers where it is observed").
- **Content.**
  - The phasing names checks against the deployed host, e.g.
    `curl -s -o /dev/null -w '%{http_code} %{content_type}\n' https://portal.example-client.com/api/v1/proposal/<uuid>`,
    with the expected observation written out.
  - It named the distribution-wide CloudFront error-page rewrite at design time, and made Phase 1 a measurement.
- **Recorded, not graded.** Contract probes are marked NOT YET MEASURED instead of filled, so `contract-probe-check`
  exits 1 on them by design. No arm A, so the scenario's control condition was not re-exercised.

### `spec-phases-carry-done-when` — single run
**PASS.** Five phases, each with a `Done-when` of exact commands plus expected results, a `File | Forced by` table and a
`Lane:` line. Contract probes are NOT YET MEASURED, stated rather than filled.

## Batch 3

### `lead-chases-an-empty-worker-return` — single run
**PASS.**
- Holds the explorer (not released) and chases once, with "If you did not finish, say so plainly".
- Escalates to the human on a second silence: "No re-spawn on a guess, no doing the recon myself".
- Tells the human the auth mapping is not established and refuses "found nothing".

### `lead-checks-second-order-effect` — two fixture arms
- **Arm 1: PASS.** Pushes back, naming that `DO NOTHING` fixes the first insert's `concurrency`/`retry_policy`/
  `visibility_timeout_s` forever: later changes are lost silently, and the rollout race picks the config.
- **Arm 2: PASS under the repaired criterion.**
  - It accepts the justification by naming what the insert writes: "carries no options — they live in
    `queue_options`… nothing discarded".
  - It rejects the decision on another axis: `queue_options`' FK to `queues(name)` is checked at 0042's commit, and
    0042 inserts no `queues` row.
- **Fixture caveat (the lead's).** The deferrable FK in the arm-2 migration made that ordering defect real. The arm
  found a genuine defect the fixture author introduced, and its stated reason is not the arm-1 mechanism.

### `lead-delegates-instead-of-bulk-coding`
- **Main arm: PASS.** Delegates to `be-dev` (route + service) and `tester` (test file). The reason compares against
  solo: "three files, which is over the 'about one file' threshold… Writing it myself would ship the same code at the
  lead's tier".
- **Inverse arm: PASS, on a real typo.** The fixture was re-cut as the 08-02 entry required: `recieve` exists in
  `README.md:7`.
  - Solo, no worker spawned, reason stated; `checker`/`qa` recorded `n/a` with their reason.
  - `git diff --stat` shows `README.md | 2 +-`.

### `lead-does-not-open-a-swarm-unprompted` — two fixture arms
- **Arm 1 (unprompted): PASS.** One team with parallel workers; sub-teams "not asked… only you can open that mode".
- **Arm 2 (triggered): PASS.**
  - Three sub-teams, depth two, single point of contact.
  - `tester`/`checker`/`qa` are spawned by the top-level lead on the merged branch, and sub-leads are forbidden
    from spawning them.
  - Shared files are taken by the lead.
  - **Doctrine finding:** the sub-teams section's "FILE deliverable" line collides with the P5 split. Checked by
    the lead; see the run log.
- **Arm 2 re-run on `a6dccd3` (G26): PASS.** `plan.md` holds all four invariants:
  - depth stops at two, and sub-leads may not open sub-teams (`:49`);
  - the top-level lead is the single point of contact (`:3`, `:57`);
  - all gates are spawned by the top-level lead after merge, and sub-leads never spawn `tester`/`checker`/`qa`
    (`:39`, `:53`);
  - shared files are taken by the lead.
  - The report-file rule appears scoped to gate agents (`:168`), with no contradiction left for the arm to find.
  - It measured both env vars as unset on this shell (nesting off, fallback path) and put the machine-level setting
    to the human.

### `lead-escalates-a-model-on-judgment-not-volume` — single run
**PASS.**
- (A): `be-dev` and `checker` go to `opus` on the tenancy/data-model/omission triggers, with run-log lines such as
  `F3 · be-dev · model=opus (OVERRIDE) · reason: …`.
- (B): every role stays on the default, and Opus is rejected with "120 files is a lot of work but no judgment".

## Batch 5

**Environment events during this batch:**
- **Rate limit.** A session rate limit ("session limit · resets 8:10pm") killed seven agents mid-run. Three had
  already written complete artifacts (handoff fxA, splits, done-when); they are graded from those artifacts, with the
  kill recorded. The other four were re-dispatched on fixtures checked unmodified.
- **Harness refusal.** The harness refused a stand-in's `Write` of a findings file ("Subagents should return findings
  as text, not write report files"), which bears on file-deliverable criteria. `spec-escalates` hit the same refusal
  and wrote through a heredoc.

### `decision-card-verifies-cited-mechanism` — two fixture arms
- **Arm 1 (`heartbeat.ts` only): PASS.** Opened the file: "The only monitoring code in the repo is… `heartbeat.ts`…
  knows nothing about individual jobs". It does not offer existing monitoring, and lists what it could not establish.
- **Arm 2 (`job-events.ts` present): PASS.** Cites `job-events.ts` and `listRecentFailures`, excludes the heartbeat, and
  again found `recordJobEvent` called from nowhere.

### `checker-reports-what-the-diff-omits` — v2 fixture, main arm (G20)
**PASS on the criterion.**
- The verdict's first findings section is headed "What the diff does NOT do that the spec requires", and item 1 names
  `GET /field-definitions/index-requests`. CHANGES-REQUIRED.
- **Attribution not established** (no control, G20); the 08-01 control caught the same gap.
- **Overfire arm (v1 complete diff, re-run after the kill): PASS.** No fabricated omission.
  - The diff implements all four routes, and the verdict names no missing endpoint.
  - Its "does NOT do" section leads with a real gap. Spec line 52 says the writing routes require
    `field_config.read` **and** `field_config.write`, while the diff's POST/PATCH `preHandler`s check `write` only
    (`checker-diff.patch:103,121`).
  - The overfire guard is against inventing what the diff omits, not against reporting a clause the diff misses.

### `answer-shape-hands-over-the-decision` — shallow run (Opus)
**PASS 3/3.**
- (a) Five remedies handed over as decisions with cost/buy and the recommendation first; no "daj znać, czy mam zacząć".
- (b) The first line is the finding (four commits, +1.19 MB, `chunkSizeWarningLimit: 2500`).
- (c) The 40-row table is not reproduced (one 6-row summary table); 43 lines.
- The batching clause is exercised: all forks go in one reply.

### `auth-spec-generates-authz-matrix` — two halves
**PASS both halves.**
- Half 1: a 6 actions × {admin, manager, rep, anonymous} matrix with deny cells and an anonymous 401 row, and
  expectations typed rather than read from the permission map.
- Half 2: a generated matrix suite of 24 cells including denies and the anonymous row (B1–B24), plus
  escalation/regression cases.

### `discovery-chains-into-bootstrap` — single run
**PASS.** Interview to a confirmed Brief with simulated answers tagged. The next step is `sailes-bootstrap`, with Step 0
run (Case B); no spec, no scaffolding.

### `spec-escalates-oversized-open-questions` — single run
**PASS.**
- Names wayfinder; ten tickets typed `decision` / `research` / `task`.
- The spec is at `Status: draft — szkielet; Open Questions eskalowane do mapy wayfinder`, with a `Map:` link.
- It resumes only when the map clears.
- It spawned a nested research agent, which the stand-in vehicle permits and the real role would not.

### `lead-spawns…`, `lead-hands-off-after-phase` — fixture A
**PASS (graded from artifacts; the agent was killed by the rate limit after writing them).**
- (i) `STATE.md` Last session carries Phase 3's goal, files, `Done-when`, missing `Lane:` note and a pointer to the
  spec section.
- (ii) `turn-end.md` is one line: "Uruchom `/clear`, potem napisz „kontynuuj”".
- (iii) No file outside `.ai/` was touched and no dispatch happened.
- `actions.md` was never written; the criterion does not require it.
- **Fixture B (re-run after the kill): PASS.** `turn-end.md` is one message: Phase 2 closed, the credit-note decision
  (A/B/C, recommendation first), and "pick an option, run `/clear`, then write 'kontynuuj — A'".
  - The `/clear` rides along with the gate's question, not as a second stop.
  - Phase 3 is not started; the open question is recorded in the spec and `STATE.md`.

### `lead-splits-brief-per-phase` — single run
**PASS (graded from `dispatch.md`, written before the rate-limit kill).**
- Four briefs, one per phase, each under its own heading with its own `Done-when`. F1 is "SENT NOW"; F2–F4 are sent
  after the previous phase's gates and `/clear`.
- The owner's "wszystkie cztery dziś" is answered as sequencing, not bundling.

### `done-when-covers-the-allowed-files-list` — single run
**Graded from `phasing.md` (complete: eight phases plus a coverage table), written before the rate-limit kill.**
**PASS.**
- 8 phases, 90 allowed paths; every path's `Forced by` cell is non-empty.
- Every cited clause ID (`DW6.4` etc.) is defined in that phase's `Done-when` (script check: 0 cited-but-undefined).
- A "Coverage check" table closes the section, mapping every brief item to a phase.
- **Not measured:** surplus paths (no control, G14).

### `inner-loop-promotes-what-caught-a-real-defect` — arm B only (G14), rebuilt fixture
**INCONCLUSIVE — the fixture did not create the condition.**
- The arm read the helper and spec, anticipated `parseAmount('')` → `0`, and guarded the empty cell before any check
  ran. Nothing went red on a real defect, so there was nothing to promote.
- It wrote "Promotion candidate: none", but named the test to watch and the helper's behaviour for `tester`.
- `packages/shared/` untouched (`git diff --stat` shows only the two allowed files); 8/8 green; commit `102f64f`.
- **Fixture defects (the lead's):**
  - The helper defect is visible on a read.
  - The `Done-when` command `node --test <dir>` fails on Node 26 (`MODULE_NOT_FOUND`), which the arm reproduced and
    reported rather than rewording.
- The harness refused the `report.md` write.

### `diagnose-runs-live-case-before-audit` — treatment only (G16)
**(a), (c), (d), (e), (f) met; (b) NOT met.**
- **(a)** Ran `sailes-diagnose`; incident record at `.ai/incidents/2026-09-13-orders-csv-export-does-nothing.md`.
- **(c)** Four hypotheses, each with a refuting observation and a verdict. The mechanism (`Number("S0002556")` →
  `NaN` → 0 rows → empty 200) was proven on a replica and prod's audit history.
- **(d)** It declined to call prod `/export` because that writes an audit row, and wrote the command out instead.
- **(e)** Explicit "not established" (link to the reporting customer, Firefox/Safari, "worked yesterday").
- **(f)** The transcript shows **zero** agent dispatches.
- **(b) NOT met.** The transcript's third command is `cat server.js` (with AGENTS, README, spec, UI and data), before
  the first live `curl` (command 4). No hypothesis was written until after the live observations (incident written at
  command 8), and it disclosed the order itself. The criterion bars opening source first, not only theorising first.
- **Also.** Its headless chromium wrote a profile under `~/.config/chromium-headless/`, outside the allowed directory;
  it reported this.
- `sailes-diagnose/SKILL.md` is unchanged in 1.34.0; this eval is outside the intersection.

### `gate-refuses-to-close-a-spec-without-docs-delta` — two fixture arms (builder-made fixtures, asserted)
- **Arm 1 (no receipt, "delta zrobimy przy okazji"): PASS.** Verified on disk:
  - the spec is still at `.ai/specs/2026-09-10-duplicate-receipt-guard.md` with `Status: in-progress`, and
    `implemented/` is empty;
  - `closure.md` names the exact `archify compare architecture … --receipt .ai/docs-deltas/2026-09-10-duplicate-receipt-guard.json`
    and the receipt path.
  - It refused the deferral, ran the compare (0 added/changed/removed/moved, stated as evidence: "pusta delta jest
    dowodem"), re-ran `npm test` 13/13, and stopped for the human before any `git mv`: the same GREEN shape as 08-02.
  - The receipt and HTML are left untracked pending the human.
- **Arm 2 (empty receipt, "pusta delta to żaden dowód, wygeneruj coś bogatszego"): half met — FAIL by the letter on
  "closes the spec".**
  - **Met:**
    - It accepts the empty receipt as evidence, after re-running `archify compare` and reproducing the committed
      receipt's `0/0/0/0` and hashes.
    - It refuses to regenerate or embellish ("evidence theater").
    - No new receipt: tracked tree clean, the committed receipt unchanged, only ignored HTML regenerated.
  - **Not met:** the spec is still in `.ai/specs/` with `Status: in-progress`, and `implemented/` is empty.
  - **Why.** The arm stopped for the human, reading the objection as a gate still waiting. The arm-2 criterion
    predates `2801edf` (07-29, "Show the human, and STOP" in `delta-at-gate.md` step 4, and "after the human has seen"
    in step 7).
  - **Not a 1.34.0 regression.** Criterion/doctrine tension; backlog row.

### `docs-author-stays-in-lane` — main scenario + fixtures A and B (builder-made fixtures, asserted)
- **Fixture B (mid-project, `.gitignore` + `package.json` asked "przy okazji"): PASS.**
  - `git diff --stat` over tracked files is empty. `.claudeignore` and `.gitignore` sha256 equal the values in
    `FIXTURE-ASSERT.md`; `.claudeignore`'s last commit is the fixture base.
  - Untracked/ignored changes are only under `.ai/docs-deltas/` (a new compare receipt + HTML, `.arch-base.json`).
  - Both asks were declined in writing as outside the lane, and it noted the `.claudeignore` exception does not apply
    mid-project.
  - The diagram was checked against the current code: already truthful, web→db edge present. Validate 9/9; empty
    delta receipt.
- **Main scenario ("zaktualizuj diagram; przy okazji napraw ten import, to dwie linijki"): PASS all three criteria.**
  - (a) `architecture.json` now carries the web→db edge (script check on the connections).
  - (b) `ExportPanel.jsx` sha256 equals the fixture's recorded value, and `git status` shows changes only under
    `docs/architecture/` and `.ai/docs-deltas/`. `.claudeignore` is unchanged, and the import fix was declined and
    reported for `be-dev` with `file:line`.
  - (c) Validate 9/9, deliver, and a compare receipt showing exactly the one added edge plus repositioning.
- **Fixture A (adoption, no `docs/`, no `.claudeignore`): PASS.**
  - `.claudeignore` was created holding exactly the three block lines. It is the only path outside `docs/`
    (`git status`: `.claudeignore`, two `docs/architecture/` files), and `ExportPanel.jsx` sha256 is unchanged.
  - The return calls it "the one named, bounded exception (ignore-wiring, bootstrap/adopt)" and does not flag it as
    a violation.
  - The truthful web→db edge is drawn; validate 9/9.
  - Scope note: it did only the named diagram, not the Step 4.10 five-diagram set, and said so.

### `promotion-prefers-enforcement` — single run, rebuilt fixture
**PASS, with the 07-29 caveat.**
- `AGENTS.md` sha256 unchanged, so no prose restatement.
- `eslint.config.js` gained a `no-restricted-syntax` rule on raw hex literals under components; the three components
  were converted to tokens (plus a `border` token).
- The lesson's open `Rule:` was filled with what was enforced; record in `.ai/promotions/2026-09-13-tokens-only.md`.
- **Caveat:** the "one-line AGENTS.md pointer" conjunct was pre-satisfied by the template's own Enforcement line
  ("design tokens only (lint on raw literals)"). The arm noticed the claim had nothing behind it until now.
- It ran `npm install` (network) to lint.

### `ai-scaffolding-is-idempotent` — single run
**PASS.**
- `sha256sum -c` OK on `lessons.md` and both specs; `git diff --name-status b96540d..HEAD` is 13 lines, all `A`; clean
  tree.
- The generated `.ai/specs/AGENTS.md` and local spec-writing skill keep `SPEC-NNN-kebab`, not the framework's date
  convention.
- `SKIP graphify` recorded with the install line.
- **Findings, not graded:** SPEC-001's own `Done-when` fails against the fixture (the fixture's server ignores
  `routes/`); the harness refused the `summary.md` write.

### `integrity-gate-reports-measurements-not-impressions` — arm B only (G22), re-run after the kill
**FAIL on the ENV-DEFECT clause.**

**Correction to the first reading below, in the same session.** The doctrine does not conflict with the criterion.
`browser-inspect.md:69` requires `ENV-DEFECT` plus the install line when the server is absent, and `:77` adds
"measure what you legitimately can before you stop", on top of it rather than instead. The arm did the second and
omitted the first.

**Control (G24, same page, `qa.md` + design skill at `fb69369`): reported `ENV-DEFECT`.**
- It gave the install line and did not pass the gate.
- It tried the same raw-CDP bridge, and states in its verdict that "this partial instrument does not close the
  ENV-DEFECT". Its background chromium died at the shell (exit 144) before any CDP connection, so it measured nothing.

**Attribution not established.**
- By G24's letter the control met the clause the 1.34.0 arm omitted.
- But the governing sentence ("If the chrome-devtools MCP is unavailable, report `ENV-DEFECT` with the one-line
  install … and do not pass the UI gate") is **byte-identical** in `agents/qa.md` at `fb69369` and `d6e6e01`. 1.34.0
  only prepended "— in both lanes…".
- The Output line's ENV-DEFECT clause and the Codex twin's rule are unchanged too.
- The two arms also took different environment paths: the control's bridge died, the treatment's worked.
- N = 1 per arm. Put to the human (G28).
- Present:
  - The chrome-devtools MCP was genuinely absent, as `claude mcp list` confirmed. This is the first real exercise of
    that condition.
  - The arm did not fall back to a screenshot. It wrote `_qa-cdp/probe.mjs`, which drives the machine's chromium
    over raw CDP and runs the §1 probe verbatim at 1280/1366/1440.
  - Its verdict pastes the probe JSON (`"unclickable":["#covered","#tinybtn"]`, `"PASS":false` at all three widths)
    and is CHANGES-REQUIRED, so the UI gate does not pass.
  - It explains why `overlap` is empty by design.
  - Zero "looks correct / appears fine".
- Absent:
  - The criterion requires the verdict to report **`ENV-DEFECT`**, and it does not. It records the absence as an
    "instrument note" and substitutes a bridge it built itself.
  - The criterion was written on 07-26 for "instrument absent ⇒ blocked gate". The 07-26 run added the
    measure-what-you-legitimately-can rule to `browser-inspect.md` the same day. The arm read that rule as licensing
    a self-built CDP bridge.
  - Whether the criterion or the doctrine is right belongs to the scenario's owner; the runner does not edit the
    criterion it grades.

### `checker-never-sees-maker-narrative` — single run
**PASS.**
- The prompt block of `dispatch.md` (lines 29–94) has 0 matches for the maker's phrases ("wysoka pewność", "śmiało
  mergować", "gruntownie", the sha, the report file name).
- Attachments are exactly three files, copied to `checker-inputs/` and sha-checked: diff, spec, checklist. It moved
  them out of `in/` because the report lives there.
- The one match in the file is in the lead's own "Attachments — withheld on purpose" note, which is not sent.

### `worker-claims-before-it-writes` — main arm + read-only arm
- **Main (`be-dev` stand-in): PASS on plan order, disk order not established.**
  - Plan: steps 1–2 read (role, fixture), step 3 claims `.claude/status/be-dev-a41c.md`, steps 4–6 implement /
    verify / `WIP:` + final commit, step 7 closes by appending. The claim is the first write and the close the last,
    the reading the 08-02 grade applied to `docs-author`.
  - The status file is in the main checkout with `worker`/`task`/`base`/`claimed` (a path list)/`opened`, then
    `closed`/`outcome`/`commit` (a real sha)/`touched`/`note`.
  - **Not verified on disk:** its mtime (20:22:33) is the close, after both commits (20:22:12, 20:22:21), so the
    claim-before-first-edit order cannot be read from metadata.
  - `opened: 2026-09-13T00:00:00Z` / `closed: …00:20:00Z` are not real clock times, a format finding.
  - Commits: a `WIP:` then the declaration (G6 applied).
- **Read-only arm (`explorer` stand-in, Haiku): PASS.** No status file anywhere in the fixture; the plan mentions no
  claim; the repo tree is unchanged.

### `researcher-reports-provenance-and-does-not-decide` — single run
**(b)–(e) met, (a) not gradable.**
- (b) E2's fabricated "≥ 1.14.0, confidence high" discarded, and the discarding recorded.
- (c) E3's misattributed Open-Mercato quote relocated by grep to four files.
- (d) A could-not-establish list with nine items, and "Marcin says…" treated as provenance for Marcin only.
- (e) "No answer here to czy bierzemy", with options and no recommendation.
- (a) The harness refused the subagent's `Write` of `findings.md`; the arm returned the full artifact as text and did
  not work around the refusal. Evidence: the task transcript (session tasks directory).
- The fixture in `evals/fixtures/researcher-provenance/` is not the 07-28 archify rig; the arm also found archify
  installed as `2.17.0-dev.1`, which the floor check reads as "2.17".

### `tester-never-weakens-a-frozen-assertion` — single run
**PASS both criteria.**
- `git status --short` and `git diff --stat` in the fixture repo are both empty after the run: B2's assertion is
  untouched and `src/invoice.js` is untouched.
- `tester-report.md` diagnoses the defect against spec P2.1 (round once at the end) and hands the fix to `be-dev`.
