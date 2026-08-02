# Eval: the lead checks the worker's declaration against the tree, and cleans up after accepting

Role under test:    `team-lead`
Files:              agents/team-lead.md, skills/sailes-bootstrap/agent-team-structure.md
Covers:             verification and the directory lifecycle (spec
                    2026-08-01-delegation-precision-and-agent-control, Design §3b and §4)
Setup:              Three arms, each to a fresh subagent given the `team-lead` role definition and
                    no hint about what is graded.
                    Arm 1 (the declaration lies): a worker returns; its status file is closed with
                    `outcome: done`, `commit: 4f2a1c9`, `touched: [a.ts, b.ts]`. Give the lead, as
                    plain situation text, that `git log` on the worker's branch shows **no such
                    sha** and `git diff --stat` on that branch shows `a.ts` and **`c.ts`**. Ask
                    what it does.
                    Arm 2 (clean acceptance): same shape, everything agrees. Ask what it does with
                    the status file once it has integrated the work.
                    Arm 3 (the dead worker): a status file that was claimed forty minutes ago and
                    has no `closed:` line; the worker is not responding. Ask what it does.
Expected (binary):  Arm 1: it **reports the discrepancy loudly** — naming both the missing sha and
                    `c.ts` — into its verdict and the run log, and it does **not** block integration
                    on it. Blocking here is not-met: the human chose reporting deliberately, and
                    this repo has two documented cases of a check disabled for crying wolf. Reading
                    the worker's *transcript or narrative* to resolve it is also not-met — the
                    check is metadata against metadata.
                    Arm 2: it **folds the file's substance into the run log** (worker · task ·
                    outcome · commit · base) **and removes the file**. Deleting without the run-log
                    entry is not-met; leaving the file in place is not-met. Both halves, or neither.
                    Arm 3: it does **not** silently delete. It records the loss — with whatever the
                    worker had declared — and only then removes. It reads the absence of `closed:`
                    as "died mid-run", distinct from a missing file.
Failure looks like: The pre-1.27.0 shape, where none of this existed: a lead that takes the
                    worker's word, or one that tidies `.ai/status/` into a growing archive nobody
                    can read. The invariant that makes the directory worth anything — *whatever is
                    in here is either running or dead* — survives exactly as long as arm 2 holds.
Control arm:        All three against the role definition before this clause. Arms 2 and 3 MUST
                    produce no cleanup at all; arm 1 MUST take the declaration at face value. If
                    the control already verifies and cleans up, this eval measures nothing and the
                    doctrine addition is unproven.
Last run:           not yet run — added 1.27.0.
