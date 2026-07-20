# Backlog — deferred ideas, later phases, tech debt (framework repo)

> Where non-goals and "not now, but important" land so they survive. Triage periodically;
> promote an item to a spec when it's time.

## Features / ideas (deferred)
| Item | Why deferred | Source (brief/spec) | Status |
|---|---|---|---|
| Loop mode in `sailes-implement` (loop-until-Done-when, iteration cap 5, STATE.md on stall) | ratchet + environment work shrinks the need; revisit after 1.1.0 lands in real projects | 2026-07-05 engineering spec (v1, deprioritized) | parked |
| BLOCKED-BY-POLICY protocol (worker reports model refusal verbatim; lead reroutes tier once, then human) | real but rare; one paragraph, add on next `agent-team-structure.md` edit | 2026-07-05 engineering spec (v1, deprioritized) | next |
| Scheduled maintenance routine (re-run evals + freshness check, harvest lessons → promotion candidates, digest to human) | needs its payload first — evals/ + freshness check now exist as of 1.1.0 | 2026-07-05 engineering spec (v1) + value spec | next |
| Framework-level lessons harvest across Sailes client repos → golden-module + skill candidates | needs ≥2 client repos on 1.1.0 with populated lessons.md | 2026-07-05 value spec (Phase 5/6 follow-up) | parked |
| Bespoke ESLint plugin packaging the ratchet rules (tokens-only, boundaries) as one install | start with stock rules per repo; extract once the config recurs (graduation rule applied to config) | 2026-07-05 engineering spec (Non-goals) | parked |
| CI wiring for `evals/` (run affected scenarios on PRs touching skills/) | manual dispatch first; automate when eval count grows | 2026-07-05 engineering spec (Non-goals) | parked |
| Hook enforcing that a spec cannot reach `implemented/` without a `.ai/test-plans/<spec>.md` | rejected during `sailes-test` discovery on blast radius (a hook changes behavior in every repo on the machine); revisit once the artifact has proven itself in a real client repo | 2026-07-20 discovery session (sailes-test, Non-goals) | parked |
| `run-` skill for this repo (driver piping SessionStart JSON into the hooks to show what they inject) | deliberately dropped mid-session for `sailes-test`; the hooks were exercised by hand and both behave as designed, so this is convenience, not a gap | 2026-07-20 session (parked by user) | parked |

## Tech debt
| Item | Impact | Source | Status |
|---|---|---|---|
| Behavioral GREEN re-runs pending for 1.1.0 text-level edits (see evals/ "pending" lines) | text Done-when passed; behavior unproven until re-run post-merge | this change-set | next |
| `hooks/framework-version-check.js` has **no test at all** — `npm test` runs only `workflow-router.test.js` + `validate-toml.test.js` (verified 2026-07-20 by reading package.json and running the suite: 34 tests, none touching it) | it is a SessionStart hook firing in every repo on every machine; a silent-instrument regression there is invisible by construction — the exact failure class `workflow-router.js` grew its error-fallback test for | 2026-07-20 discovery session (sailes-test) | next |

## Later phases (from specs)
| Phase / feature | From spec | Trigger to start |
|---|---|---|
| Estimation ledger location + first aggregates feeding `sailes-wycena` | 2026-07-05 value spec Phase 6 | first project closing estimate-vs-actual data |
