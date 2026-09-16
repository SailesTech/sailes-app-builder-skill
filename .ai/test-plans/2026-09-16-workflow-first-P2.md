# Test plan — Workflow-first orchestration, P2 (`tools/ownership-check.js` reads spec `Owns`/`Plan wykonania`)

Spec: `.ai/specs/2026-09-16-workflow-first-orchestration.md`
Phase: P2 — `ownership-check.js` czyta spec i fale (P2.1–P2.4, `Done-when`)
Risk tier: **B** — set directly by the phase's own `Lane:` line ("Lane: middle — tier B: logika
narzędzia bramkującego"), not raised or lowered by me. Triggers checked and none of {money,
auth/permissions/tenancy, idempotency, irreversible outbound write} fire — this tool reads local
Markdown and writes nothing, calls nothing over the network. What does fire is "ordinary business
logic": a real decision table (conflict-in-same-wave × excessive-serialization × blocking-lead
exclusion × malformed-spec) with boundary-sensitive comparisons (actual wave count vs. computed
minimum) — not a pure read or pure formatting pass, so Tier C does not apply either.
Lane: **middle** — no human-STOP. Moved `DRAFT` → `DERIVED` directly per the lane rule; the
no-weakening rule in Step 4 binds this plan exactly as written, and any expectation that turns out
wrong goes to the lead as a run-log entry with a reason, not back to a human freeze.
Status: **DERIVED** (self-frozen, middle lane, 2026-09-16)

> Derived from `.ai/specs/2026-09-16-workflow-first-orchestration.md`, sections `### Narzędzia`
> (lines 129–139) and `### P2 —` (lines 224–253) **only**, implementation unread at the time of
> writing this plan. `tools/ownership-check.js` and `tools/ownership-check.test.js` are opened only
> after this file is written, per the order the role's instructions require.
> Base: `a43d2fdbd670dbd29b1a2996bd4c447971102483`.

## What I could not derive from the spec (documented, not blocking — middle lane)

These are genuine gaps in the two read sections. Since this lane skips the human-STOP, I resolved
each with a narrow, explicitly-stated default and scoped the affected test case(s) so a later
correction does not require rewriting unrelated cases. Any of these that turns out wrong is a
run-log entry to the lead, not a silent rewrite.

- **A1 — exit code for a `--spec` path that does not exist on disk.** Neither `### Narzędzia` nor
  `### P2` names a CLI-usage-error exit code (the `Done-when` list only enumerates the five
  ownership/serialization outcomes). **Default: assert only "exit code is non-zero and stderr names
  the missing path"** — a loose assertion, not a specific code — so this case (P2-B8) cannot go red
  over an unspecified number. If the human later pins an exact code, P2-B8 tightens without touching
  any other ID.
- **A2 — how a "Blokuje lidera" cell that mixes phases is attributed per-phase.** The real spec's
  own fala-1 row reads `**P0: tak** — wyniki wchodzą do P4 i P5b; reszta nie` — a free-text,
  per-phase-qualified cell, not a uniform per-fala boolean. The two read sections describe *that*
  a blocking-lead phase is excluded and reported, not the parsing rule for a mixed cell. **Default:**
  the synthetic partition test for this behavior (P2-B5) uses a fala containing exactly one phase
  with a whole-cell value (`tak`/`nie`), sidestepping the undocumented mixed-cell rule; the mixed-cell
  rule itself is exercised only as a black-box acceptance check against the real spec file (P2-B7,
  which the phase's own `Done-when` already pins: "P0 i P6 jako wyłączone"), asserting the two
  specific outcomes named there without asserting *how* the parser got there.
- **A3 — malformed/partial `Owns:` table (e.g., a phase heading present, an `Owns:` label present,
  but the table has a header row and zero data rows, or a row missing a column).** Not named in
  `Done-when`. Left untested by design — see "NOT testing" below; it is a plausible defect surface
  but manufacturing an expectation for it now would be encoding an implementation guess, not a spec
  behavior, and the acceptance test (P2-B7) already proves the parser handles every real `Owns:`
  shape this repo currently uses.

## NOT testing (deliberately)

- **The legacy `ownership:` run-log block mode.** `### Narzędzia` states explicitly: "Tryb bloku
  `ownership:` dla run logów zostaje" (unchanged) and P2's own Blast-radius note confirms "istniejące
  wywołania na run logach bez zmian" (existing run-log invocations unchanged). This is pre-existing
  behavior with its own pre-existing suite in `tools/ownership-check.test.js`; not this phase's
  behavior, and none of its existing assertions are touched.
- **Malformed/partial `Owns:` table parsing (A3 above).** No behavior is named for it in `Done-when`;
  adding an expectation now would be a guess, not a derivation.
- **Exact wording of the "excluded — blocking-lead" report line, and of any conflict/serialization
  error text.** The spec names *that* something is reported, not its exact string. Cases assert via
  substring/regex on the required components (phase id, file name, or "blocking lead" concept), never
  on an exact message, so a wording change cannot turn a correct implementation red.
- **Performance / large spec files.** No performance requirement is stated.
- **Windows path handling.** Pure-Node text tool, no shell step involved per the Narzędzia
  description — same reasoning this repo's `AGENTS.md` already applies to other governance tools.

## Requires you

🔀 **External boundaries: none.** `ownership-check.js` reads only local Markdown files named on its
command line (`--spec <plik>`) — no network call, no CDN/proxy/gateway/CRM/payment/auth-provider
boundary anywhere in the read sections. No mock, no pair, nothing to trade away here.

No manual/credentialed steps identified — every case below runs the CLI as a subprocess against
either a synthetic fixture file or this repo's own already-committed spec file.

## Working material — decision table (derivation aid, not itself the test list)

| Input class | Owns conflict same-wave? | Actual waves vs. minimal | Blocking-lead phase involved? | `Owns:` present under `## Fazy`? | Expected |
|---|---|---|---|---|---|
| well-formed, optimal | no | actual == minimal | no | yes | exit 0, summary printed |
| well-formed, conflict elsewhere-ok | no (different waves) | actual == minimal | no | yes | exit 0, no conflict reported |
| well-formed, conflict | **yes** | n/a (conflict short-circuits) | no | yes | exit 1, conflict named |
| well-formed, over-serialized | no | actual > minimal | no | yes | exit 1, "nadmierna serializacja" |
| well-formed, blocking phase alone in own wave | no | actual > naive-minimal, but phase excluded | **yes** | yes | exit 0, phase excluded + reported |
| `## Fazy` present, no `Owns:` anywhere | — | — | — | **no** | exit 1 |
| `--spec` path missing on disk | — | — | — | — | non-zero exit, stderr names path (A1) |
| real repo spec (regression) | (as authored) | (as authored) | P0, P6 | yes | exit 0, 8 phases / 3 waves, P0 & P6 excluded |

Illegal-transition / failure-path notes: a conflict in the same wave and an `Owns:`-less spec both
fail **closed** (non-zero exit) rather than silently reporting "nothing to check" — the spec
explicitly calls out ending the old silent behavior ("koniec cichego „nothing to check""). A
nonexistent `--spec` path is the CLI-input illegal transition (tool invoked with no valid target to
analyze) and must not be treated as "no conflicts found."

## Behaviors

Fixtures are synthetic Markdown spec files (`## Fazy` + per-phase `Owns:` tables + `## Plan
wykonania` table, matching the shapes shown in `### Narzędzia` lines 148–152 and P2's own `Owns:`
table lines 226–230) unless noted as a real-repo check (P2-B7). All invocations spawn
`node tools/ownership-check.js --spec <fixture>` as a subprocess and assert on exit code and
stdout/stderr content — no internal function imported directly, consistent with this repo's
`tools/*.frozen.test.js` black-box precedent.

| ID | Partition | Trigger | Expected outcome |
|---|---|---|---|
| P2-B1 | Happy path — parses `Owns:`/`Plan wykonania`, no conflicts, optimal waves | 2-phase spec, disjoint files, each phase its own wave (already minimal) | Exit 0; stdout summarizes phase count and wave count, no conflict/serialization line |
| P2-B2 | Shared file, different waves (valid) | 2 phases share one file, assigned to two different `Fala` | Exit 0; no conflict reported for that file |
| P2-B3 | Shared file, same wave (conflict, invalid) | 2 phases share one file, both listed under the same `Fala` | Exit 1; message names the shared file and both phase ids |
| P2-B4 | Excessive serialization (invalid) | 2 phases with no file overlap at all, forced into two separate waves each of one phase, when they could share a wave | Exit 1; message identifies excessive serialization (more waves than the computed minimum) |
| P2-B5 | Blocking-lead phase excluded from serialization comparison | 3rd phase, no file overlap with the other two, placed alone in its own wave, with a whole-cell "Blokuje lidera: tak" for that wave | Exit 0 overall (no false "excessive serialization" from that phase's own wave), and stdout explicitly reports that phase as excluded (blocking lead) |
| P2-B6 | Spec has `## Fazy` but no `Owns:` anywhere (invalid) | Spec with phase headings and a `## Plan wykonania` table, zero `Owns:` labels in the whole file | Exit 1 |
| P2-B7 | Real-spec acceptance / regression | `node tools/ownership-check.js --spec .ai/specs/2026-09-16-workflow-first-orchestration.md` | Exit 0; stdout lists exactly 8 phases (P0, P1, P2, P3, P4, P5a, P5b, P6) and 3 waves; P0 and P6 reported as excluded (blocking lead) |
| P2-B8 | `--spec` path does not exist (invalid CLI input) | `--spec fixtures/ownership-check/does-not-exist.md` | Non-zero exit; stderr names the missing path (loose assertion — see A1) |

> No **promoted** row yet — Step 1 (behavior derivation), written with the implementation unread and
> before any inner-loop check exists to promote from. If the implementer's report (`be-dev`) names a
> `Promotion candidate:` that caught a real defect, it is folded in at Step 4, after the diff is
> read — not mined from their scratch files, and refused if it could only ever have been red because
> the code didn't exist yet.

---

## Detection proof (filled at Step 5, after the suite exists)

Run 2026-09-16 against the implementation at base `a43d2fdbd670dbd29b1a2996bd4c447971102483`.
Method: plant the mutant in `tools/ownership-check.js` only, run
`node tools/ownership-check.test.js`, record which IDs went red, `git checkout --
tools/ownership-check.js` to revert, confirm `sha256sum` matches the pre-mutation baseline
(`92236f0e6788ec4b064456a2eaa3b2b1e468eb129d319d4809ae5316b3e88573`) and the full suite green
before the next mutant. All 8 tester-derived IDs (P2-B1–P2-B8) were killed; no `DEAD` case.

| # | Mutant (mechanism) | Mutation applied | IDs that went red | Reverted, suite green | Verdict |
|---|---|---|---|---|---|
| M1 | Phase-count report off-by-one | `phaseFiles.size` → `phaseFiles.size + 1` in the success `console.log` | **P2-B1, P2-B7** (+ 2 pre-existing be-dev tests) | ✅ | detects |
| M2 | Same-fala conflict threshold weakened | `phases.size > 1` → `phases.size > 2` in `findSpecConflicts` | **P2-B3** (P2-B2 stayed green, confirming isolation) | ✅ | detects |
| M3 | Excessive-serialization gate disabled | `if (minimalWaveCount < declaredWaveCount)` → `if (false && ...)` | **P2-B4** (all other P2-B IDs stayed green) | ✅ | detects |
| M4 | "Blokuje lidera" pin removed | `const pinned = wave.blocked.size > 0;` → `const pinned = false;` | **P2-B5** (+ P2-B7 + 2 pre-existing be-dev tests) | ✅ | detects |
| M5 | Missing-`Owns:` check disabled | `if (missingOwns.length > 0)` → `if (false && ...)` | **P2-B6** (isolated — fixture redesigned to avoid the same masking risk the implementer's own comment names for P2.4) | ✅ | detects |
| M6 | Unreadable-`--spec`-path exit code flipped | `process.exit(1)` → `process.exit(0)` in `checkSpec`'s read-failure branch | **P2-B8** (+ 1 pre-existing be-dev test) | ✅ | detects |
| M7 | Wave-boundary awareness removed from conflict check | `findSpecConflicts` pooled all phases across every fala into one owners map, ignoring `wave.num` | **P2-B2** (proves the wave-aware distinction is real; P2-B1 stayed green) | ✅ | detects |

**Finding during proof design — P2-B6's first fixture draft would have been `DEAD` against M5.**
The initial fixture referenced both Owns-less phases (`P0`, `P1`) directly in the `Plan wykonania`
wave row. With the missing-`Owns:` check disabled, the separate "unknown phase referenced by a
fala" cross-check would still have caught the same two phase ids and printed exit 1 with `P0` and
`P1` both named — identical-looking output for the wrong reason, exactly the masking risk the
implementer's own commit comment names for their analogous P2.4 fixture. Caught before running any
mutant, by re-reading the implementation's `checkSpec()` control flow (missingOwns check runs
before `parseWaves`/the unknown-phase cross-check). Fixed by adding a third phase (`P9`, has
`Owns:`) and referencing only `P9` in the wave row, so `P0`/`P1` are never checked by the
cross-check at all. No expected value changed (still exit 1, still both ids named) — only the
fixture's shape, so the ID detects the mechanism it names rather than a neighboring one. Re-verified
above: M5 now turns P2-B6 red and nothing else.

**Promotion candidate: none found.** Grepped the `be-dev` implementer's report surface for this
phase — the merge commit itself (`a43d2fdbd6...`, message above) and `.ai/runs/2026-09-16-
workflow-first.md` — for a `Promotion candidate:` line; neither exists (the commit message
documents a by-hand detection pass for P2.2/P2.3/P2.4 but names no fixed-label promotion). Nothing
folded in from step 4.

**Tier B is a proxy, not mutation testing, and this is stated as one**: the seven mutants above were
chosen by this suite's author, one per named contract mechanism (phase-count reporting, same-fala
conflict, excessive-serialization gate, blocking-lead pin, missing-`Owns:` rejection, unreadable-path
exit code, wave-boundary awareness), not swept exhaustively — no Stryker, reserved for tier A.
