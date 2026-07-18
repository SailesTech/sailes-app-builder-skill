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

## Tech debt
| Item | Impact | Source | Status |
|---|---|---|---|
| Behavioral GREEN re-runs pending for 1.1.0 text-level edits (see evals/ "pending" lines) | text Done-when passed; behavior unproven until re-run post-merge | this change-set | next |
| Worker-side report clause in the 6 remaining `agents/*.md` + 7 `codex-agents/*.toml` twins | Phase 2 of the delegation-reports spec. Redundant with the lead-side fix, which already reaches every agent type including the built-ins that actually failed; the twins must stay in sync (`validate-toml.test.js`, `repo-done-checklist.md`), so a 13-file pass for a belt-and-braces net is poor value alone. Fold into the next edit that touches those files. | `2026-07-18-delegation-reports.md` D3 | parked |

## Later phases (from specs)
| Phase / feature | From spec | Trigger to start |
|---|---|---|
| Estimation ledger location + first aggregates feeding `sailes-wycena` | 2026-07-05 value spec Phase 6 | first project closing estimate-vs-actual data |
