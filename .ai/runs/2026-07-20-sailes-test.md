# Run log — sailes-test

Spec: `.ai/specs/2026-07-20-sailes-test.md` (approved 2026-07-20)
Branch: `feat/sailes-test`
Started: 2026-07-20

## Pre-Implement Report

### Verdict: READY-WITH-FIXES

Four findings must be folded into the spec before Phase 1. Three of them are the same class:
**a Done-when that would report success for a reason other than the one claimed** — the pattern
`.ai/STATE.md` records as five silent failures in one day.

---

### BC findings

**C1 — Critical · `codex-agents/validate-toml.test.js` hardcodes the role list.**
Line 27: `const ROLES = ['team-lead','explorer','designer','be-dev','fe-dev','checker','qa'];`
The validator iterates that array, not the directory. Shipping `tester.toml` without editing it
means the new file is **never validated** — and `npm test` stays green, because the seven listed
files still pass. The spec's Phase 4 Done-when ("all passing with 8 shipped role files") cannot
be satisfied by the current test at all, and would be read as satisfied by a green run.
- **Missing from the spec's file surface table entirely.**
- *Migration:* add `codex-agents/validate-toml.test.js` to the surface. Phase 4's Done-when must
  assert `ROLES.length === 8` **and** that `tester` is a member — not merely that the suite is green.

**C2 — Critical · `skills/sailes-implement/SKILL.md` will carry two contradictory test mandates.**
Line 30: *"Identify the RED test first (write or name a failing test before the code)"*.
Line 62 Quick Reference: *"RED test → implement → test → verify"*.
The new protocol authors the graded suite **after** the code, under informational isolation. Both
instructions will live in one file with nothing saying which governs.
- Unresolved, this is worse than either rule alone: an agent gets to pick, and it will pick the
  cheaper one.
- *Also unspecified:* if `be-dev` writes a RED test first and `tester` later authors the suite,
  who owns the overlap — does `tester` absorb, replace, or ignore the dev's test?
- *Migration:* the spec must state the resolution explicitly. Recommended reading: the dev's RED
  test is **scaffolding for the step** (it may be, and usually is, implementation-shaped); the
  `tester` suite is **the graded artifact** and is authored under isolation. `tester` may delete a
  dev test only by superseding it with an ID-bearing equivalent — never to make a suite green.

**C3 — Critical · Phase 5's Done-when passes while leaving the file half-edited.**
The pipeline order literal appears **twice** in `agent-team-structure.md`, and the two are already
not byte-identical:
- line 41 — `explorer → designer → BE contract finalized → fe-dev → checker → qa`
- line 133 — `explorer → designer → BE contract → fe-dev → checker → qa` (fallback section)

Line 133 additionally enumerates the read-only roles: *"Read-only roles (`explorer`, `checker`,
`qa`) map cleanly to read-only subagents."* `tester` is **not read-only** — it is the first gate
that writes — so that sentence becomes false the moment the role ships.
- The spec's Done-when greps for `tester → checker → qa` and is satisfied by **one** hit. Editing
  line 41 alone passes it, leaving the fallback path stale and the read-only claim wrong.
- *Migration:* Done-when must assert **both** occurrences updated **and** that line 133's read-only
  enumeration no longer implies `tester`. Every teams-off repo reads that fallback section — it is
  not a footnote.

**W4 — Warning · `agents/*.md` ↔ `codex-agents/*.toml` parity has no mechanism.**
`validate-toml.test.js` checks TOML **syntax only**; it never compares content against the
markdown definition. Editing `agents/qa.md` (qa now runs the authored suite) without editing
`codex-agents/qa.toml` leaves Codex users on the old mandate, and every test stays green.
- *Migration:* `codex-agents/qa.toml` must be named in the surface table (the spec names only
  `agents/qa.md`). Longer term this is a promotion candidate for `.ai/backlog.md` — a real parity
  check — but not in this spec's scope.

---

### Gaps

**G1 · Phase 6's Done-when counts the wrong things.** The spec asserts "all 15 numbered items"
in `harness-checklist.md`. A script counting numbered bold items returns **19** — the file has 15
checklist items plus a 4-item "four P0s" recap that needs no test column. As written the check
either fails on a correct edit or is silently mis-scoped. Fix the number and scope it to the three
checklist sections explicitly.

**G2 · No eval covers tier assignment.** The spec has evals for the isolation step and the one-way
rule, but the rule *"the agent may never lower a tier"* is precisely the self-serving behavior that
needs one. A tier is cheaper at C than at A, and nothing observes the choice. Add a third eval.

**G3 · Phase 2's Done-when depends on the network.** An HTTP-200 sweep over extracted URLs fails
for reasons unrelated to correctness (rate limits, transient 5xx, publisher paywalls). It also
cannot run offline. Keep it, but define the failure protocol: a non-200 is investigated and either
replaced or annotated `[checked YYYY-MM-DD, unreachable]`, not silently dropped.

**G4 · Intermediate state between Phase 1 and Phase 3 ships dangling references.** Phase 1 writes
`SKILL.md` pointing at three `references/*.md` files created in Phases 2–3. The repo is consistent
(tests pass), but the skill is not shippable. *Do not push to `main` between Phase 1 and Phase 3* —
noted here because `main` is production and a push deploys itself.

---

### Risks

| Scenario | Severity | Mitigation | Residual |
|---|---|---|---|
| Scripted edit to a 5-file surface silently no-ops (CRLF `\n` vs `\r?\n`) | High | use the file-writing tools, not shell/regex edits; re-read each file after editing | human must actually look at the re-read |
| Done-when greps pass on a partial edit (C1, C3) | High | Done-when asserts counts and both occurrences, not presence | a future added occurrence goes unguarded |
| Unicode arrow `→` in a grep literal misbehaves under MSYS | Medium | grep for `tester` and `checker` separately; avoid the arrow in the assertion | — |
| Isolation is prose the model can ignore | High | evals G2 + existing two | **evals grade behavior, not guarantee it** — this is the design's core uncertainty |
| Push to `main` mid-implementation deploys a half-wired pipeline | High | stay on `feat/sailes-test`; merge only after Phase 7 | one careless push |

### Remediation — spec edits required before Phase 1

1. Add `codex-agents/validate-toml.test.js` and `codex-agents/qa.toml` to the file surface table.
2. Rewrite Phase 4 Done-when: assert `ROLES.length === 8` and `tester` ∈ ROLES.
3. Rewrite Phase 5 Done-when: both order occurrences updated; line 133 read-only enumeration corrected.
4. Add the TDD-vs-isolation resolution to the spec (C2), including who owns a dev's RED test.
5. Fix Phase 6's count (15 checklist items, excluding the 4-item P0 recap) and scope it by section.
6. Add the tier-assignment eval to Phase 7.
7. Add Phase 2's non-200 protocol.
8. Note the no-push window (Phase 1 → Phase 3).

### Sequencing

Phase order 1 → 7 is otherwise sound; no phase depends on a later one. Phase 4 (create role)
correctly precedes Phase 5 (wire it in).

---

## Execution — all 7 phases shipped 2026-07-20

Every Done-when was run, not asserted. Each commit records its output.

| Phase | Commit | Done-when result |
|---|---|---|
| 1 — skill core + artifact | `1fc9da7` | 13/13 — frontmatter, trigger verbs, five template sections in order |
| 2 — technique arsenal | `87f1cf1` | 0 unsourced sections (first run FAILED on Fuzzing — check working), 23/23 links, 0 non-200 |
| 3 — browser + external systems | `6c5a6e1` | 15/15 asserts, 5/5 anti-flake rules, 9/9 links |
| 4 — `tester` role + ROLES trap | `62a4c71` | ROLES.length===8 & includes tester; tester.toml now actually validated; parity guard added |
| 5 — wire into pipeline | `a933ea4` | both order lines carry tester; absent from read-only enum; present in 4 wired files; two skill files agree |
| 6 — async proof column | `52a0d35` | 15/15 rows (naive count would be 19 — G1 confirmed real) |
| 7 — evals, changelog, release | (this commit) | four manifests identical 1.10.0; CHANGELOG heading; 3 evals with RED/GREEN arms |

**Post-implementation checks the pre-implement report did not predict, caught at the release gate:**
- The version-check hook, run against this repo after the bump, correctly flagged that `AGENTS.md`
  still carried `Framework-Version: 1.9.2`. This repo dogfoods its own standard (lesson 2026-07-05),
  so the stamp is effectively a fifth manifest. Bumped to 1.10.0; hook now silent. The hook caught
  its own repo — a small proof the instrument works.

### Two verification debts, both closed (one claim rejected)
- arXiv 2410.21136 percentages: **fabricated** — abstract has no percentages. Rejected, not quoted.
- Luo et al. flaky split: scope + ranking confirmed, **percentages unconfirmable** — ranking cited, split dropped.
Both recorded as a worked example in `techniques.md` and a lesson in `.ai/lessons.md`.

### Not done here (deliberate)
- **The core uncertainty remains unproven.** The three evals are written but marked NOT YET RUN — they
  are the only thing that can show the isolation, one-way and tier rules *land as model behavior*, and
  evals grade behavior rather than guarantee it. Running them is the next session's first job.
- **Nothing merged to `main`.** All work is on `feat/sailes-test`. `main` is production; the merge +
  `./install.sh --force` is the human's call, and should follow an eval run, not precede it.

### Verdict
Build **complete and self-verified**; **not yet behaviorally proven** and **not yet deployed**. The
distinction is the whole methodology — a green Done-when is evidence the artifact exists and is
consistent, not that the instruction changes what an agent does.
