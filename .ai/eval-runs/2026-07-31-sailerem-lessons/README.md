# Eval run — 2026-07-31 · F6 of `2026-07-30-sailerem-lessons-to-doctrine`

Four scenarios, nine arms, **PASS on all of them**. D13 of the spec makes a red eval block the
release; none was red.

This directory exists because `checker` was right to demand it. The spec's F6 `Done-when` said the
verdicts land in `.ai/eval-runs/`, and for a while they existed only as a `Last run:` line the maker
wrote inside each scenario file. That is a summary of a run, not the run — and on disk it is
indistinguishable from a line written ahead of the fact, which is **the exact defect the whole spec
is about**. The raw returns below are the artifact those lines summarize.

| Scenario | Arms | Verdict | Raw return |
|---|---|---|---|
| `lead-gives-every-writer-a-worktree` | 3 | PASS 3/3 | `worktree-mandate.md` |
| `qa-takes-exclusive-environment` | 2 | PASS 2/2 | `qa-exclusivity.md` |
| `decision-card-verifies-cited-mechanism` | 2 | PASS 2/2 | `cited-mechanism.md` |
| `lead-checks-second-order-effect` | 2 | PASS 2/2 | `second-order-effect.md` |

**Vehicle:** `sailes-app-builder:team-lead`, fresh context per arm, no hint about what was graded.
Grades the working-tree text of the role definitions on branch `spec/sailerem-lessons-to-doctrine`.

**Construction error, recorded rather than tidied away.** The first dispatch of
`decision-card-verifies-cited-mechanism` arm 1 ran against a fixture containing **both**
`heartbeat.ts` and `job-events.ts`, which silently converts arm 1 into arm 2. That run is counted as
the arm-2 result — it exercised arm 2 faithfully — and arm 1 was re-run against a copy holding only
`heartbeat.ts`. Nothing was graded twice and nothing was lost. The scenario file now states outright
that `job-events.ts` **must be absent** for arm 1, because an eval whose arms can be confused at
dispatch time will be confused.

**What these runs do not cover.** They grade the **plan and the reasoning**, not the runtime: no
worker was actually spawned into a worktree, no `ENV-LOCK` was actually written, no card was
actually acted on. A lead that describes the right spawn and then does something else at execution
time would pass every one of these.
