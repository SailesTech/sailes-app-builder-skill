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
| Real `agents/*.md` ↔ `codex-agents/*.toml` **content** parity check (today only TOML syntax + the new ROLES-vs-disk guard exist; a qa.md edit that forgets qa.toml still passes) | surfaced as W4 in the sailes-test pre-implement; a real semantic diff is its own change | 2026-07-20 pre-implement (sailes-test) | next |
| Mutation testing (Stryker) as tier-A detection proof — needs per-repo config; `sailes-test` mandates it for tier A but a client repo has to wire it | the skill names it; wiring it into a real client repo's CI is the follow-up that proves the tier system end-to-end | 2026-07-20 (sailes-test Phase 5) | next |
| ~~`tester` should flag a code defect back to `be-dev`, not fix feature code itself~~ | **CLOSED 1.10.1** — guard added to `agents/tester.md` + `codex-agents/tester.toml` (write access is test-files-only; a red frozen test is a defect to REPORT), and the eval `tester-never-weakens-a-frozen-assertion` now asserts report-not-fix | 2026-07-20 (eval run) | done |
| `run-` skill for this repo (driver piping SessionStart JSON into the hooks to show what they inject) | deliberately dropped mid-session for `sailes-test`; the hooks were exercised by hand and both behave as designed, so this is convenience, not a gap | 2026-07-20 session (parked by user) | parked |

## Tech debt
| Item | Impact | Source | Status |
|---|---|---|---|
| Behavioral GREEN re-runs pending for 1.1.0 text-level edits (see evals/ "pending" lines) | text Done-when passed; behavior unproven until re-run post-merge | this change-set | next |

## Later phases (from specs)
| Phase / feature | From spec | Trigger to start |
|---|---|---|
| Estimation ledger location + first aggregates feeding `sailes-wycena` | 2026-07-05 value spec Phase 6 | first project closing estimate-vs-actual data |
