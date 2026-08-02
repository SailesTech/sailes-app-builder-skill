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
Last run:           2026-08-02 (at 27bdb98) · **PASS on all three arms** — re-run against the
                    `.claude/status/` path, the fallback clause and both hardenings. Stand-in.
                    Arm 1 split the discrepancy into **three** distinct findings rather than one,
                    and ranked them: a `commit:` that does not exist is a stale or fabricated field
                    that integration never depended on; an **unclaimed edit to a shared contract**
                    is the substantive one, because it means the contract was not frozen during the
                    run; and the branch tip being `WIP: query parsing` **above** the `feat:`
                    declaration means cherry-picking the declaration alone would silently drop the
                    query parsing. That last one is the 1.27.1 branch-not-commit rule applied
                    unprompted, in a scenario that does not grade it — the strongest evidence in
                    this run that the rule landed.
                    Arm 2: run-log line and deletion as one act, and it recorded discrepancies as
                    **"none"** rather than leaving the field silent — the `qa: n/a` convention
                    carried across to verification.
                    Arm 3: reads the middle state correctly, folds the loss into the run log before
                    removing the file, gives the replacement a **new harness id** rather than
                    reusing the dead worker's, and checks the delegation mode first, because with
                    teams mode off "does not answer messages" is not evidence of anything.
                    Controls were not re-run: they are recorded below and the doctrine they lack
                    only grew, so their result cannot have moved toward the treatment.
                    Artifacts: `.ai/eval-runs/2026-08-02-rerun/R3-lies.md`, `R4-accept.md`, `R5-dead.md`.

Prior run:          2026-08-02 · **PASS on all three arms — and the controls make the result
                    sharper than a pass does.** Vehicle: stand-in on working-tree text.
                    Arm 1: reports both discrepancies — the absent sha and the undeclared contracts
                    file — ranks the second as the costlier (a shared contract surface edited after
                    the freeze, which worktree isolation does not protect), and does **not** block.
                    Refused to call the worker dishonest, listing three mechanisms that produce a
                    missing sha, and kept `checker` blind to the whole story.
                    Arm 2: folds the substance into the run log **and** removes the file — run-log
                    line first, because a file removed with no matching line is a lost declaration.
                    Arm 3: does not delete silently, records the loss first, and **sharpened the
                    criterion**: a file with no `closed:` means "died mid-run OR still running", and
                    the file alone cannot separate those. Added unprompted: never write `closed:`
                    yourself, because that forges a declaration; and a re-spawn gets its own file
                    rather than inheriting the dead worker's.
                    **What the controls show, and it is not "the doctrine is unnecessary".** Arm 1's
                    control **detected everything** and then **froze integration** — the disposition
                    the human rejected, and defensible on its own terms. Arm 2's control **left the
                    file untouched**, correctly refusing to invent a lifecycle its definition lacks.
                    Arm 3's control **invented a third convention** — rewrite in place, then
                    `git mv` to `.ai/status/closed/` — and honestly marked it as its own
                    construction. So this doctrine buys **disposition, not detection**, and the
                    argument for it is that without a stated rule two competent leads reach two
                    incompatible answers.
                    **Arm 3's control also found the design hole this spec shipped with**, while
                    grading something else: every writing worker is in a worktree, so a status file
                    it writes lands in the worktree and is invisible from the main tree — and the
                    directory is gitignored, so it never arrives by cherry-pick either. The doctrine
                    never says where the file physically lives. Filed to `.ai/backlog.md` as the
                    open decision.
                    Artifacts: `.ai/eval-runs/2026-08-02-status-file/artifacts/S2-*`.
