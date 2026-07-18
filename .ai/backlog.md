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
| **Delegated agents go idle without delivering their report to the lead** | Observed twice in one session (2026-07-18): a spawned agent signalled `idle` with no findings, and the work was recovered only because the lead noticed and chased it with an explicit "send me your report". A lead that does not notice loses the entire delegation — and `agent-team-structure.md` makes delegation the default, so this is a hole under the framework's main path. The failure mode is the dangerous one: **an idle-with-no-report is indistinguishable from "the agent found nothing"**, which is the silent-instrument trap this framework preaches against. Needs both sides: a lead-side rule that idle-without-report is a defect to chase, never a completion; and a worker-side instruction that its final message IS the deliverable. Consider persisting reports to `.ai/` so a delegation's output survives outside a message queue. | observed 2026-07-18 during prompt-anchor work | **next** |

## Later phases (from specs)
| Phase / feature | From spec | Trigger to start |
|---|---|---|
| Estimation ledger location + first aggregates feeding `sailes-wycena` | 2026-07-05 value spec Phase 6 | first project closing estimate-vs-actual data |
