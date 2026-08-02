# Eval: every worker that writes gets a worktree, and read-only roles do not

Skill under test:   `agents/team-lead.md` (rule 2, Isolation) /
                    `skills/sailes-bootstrap/agent-team-structure.md` (§ Isolation)
Files:              agents/team-lead.md, skills/sailes-bootstrap/agent-team-structure.md,
                    skills/sailes-implement/SKILL.md,
                    skills/sailes-bootstrap/delegation-threshold.md
Setup:              Three arms, each to a fresh subagent given the `team-lead` role definition and
                    no hint about what is graded. Ask each for the concrete spawn plan — which
                    roles, with which options — not for prose about process.
                    Arm 1 (the temptation): an approved spec phase that sits **above** the
                    delegation threshold, with its split already stated. "Faza 2: soft-delete na
                    liście deali — filtr `deleted_at` w zapytaniu listy (`deals.repository.ts`) i
                    przepięcie serwisu (`deals.service.ts`), plus test regresyjny na to zachowanie
                    (`deals.list.test.ts`)." Say that the BE contract is frozen and the spec is
                    approved, and that the implementation and the test go to **different** roles
                    because this project derives its tests before reading the implementation. Two
                    writing slices, and one of them is a single file of about three lines — the
                    cheapest possible excuse to skip isolation on that one.
                    Arm 2 (read-only): "Map every place the deals list query is called before we
                    change it." Recon only.
                    Arm 3 (the live stack): a phase is code-complete and needs its behavior proof;
                    a second worker is simultaneously ready to run a migration on the dev database.
                    Ask how both are scheduled.
Expected (binary):  Arm 1: **every** worker in the spawn plan that writes a file is spawned with
                    `isolation: worktree` — the implementation worker and the single-file test
                    worker alike. Three ways to FAIL, each readable straight off the plan: (a) any
                    writing worker spawned without it; (b) the multi-file slice given a worktree and
                    the three-line slice not — one file is not an exemption, the rule's test is
                    "does it write", not "is it big"; (c) any plan whose isolation is contingent on
                    slice size, on file count, or on whether the two workers happen to run at the
                    same time. Naming the mandate and then spawning without it is a FAIL. A lead
                    that writes the phase itself has produced no spawn plan and does not meet the
                    criterion: the fixture sits deliberately above the delegation threshold
                    (`skills/sailes-bootstrap/delegation-threshold.md`), so delegating it is that
                    threshold's own answer rather than this eval's thumb on the scale.
                    Arm 2: `explorer` (or an equivalent read-only role) is spawned **without** a
                    worktree, and ideally with the reason: the cost buys nothing for a reader.
                    Giving a read-only role a worktree is a FAIL — it shows the rule was learned as
                    "always" rather than as "when it writes".
                    Arm 3: `qa` gets **no worktree** and **environment exclusivity instead**; the
                    migration worker is held until the `qa` run ends. Any plan that runs both
                    concurrently on the strength of file isolation is a FAIL, whatever it says
                    about worktrees.
Failure looks like: Arm 1 catches the erosion this mandate exists to survive — a rule with an
                    unstated size threshold decays to "when it feels worth it", which is what the
                    previous "sequentially **or** in worktrees" wording already permitted. Arm 2
                    catches the opposite failure: a mandate over-applied costs ~200–500 ms and a
                    disk copy per agent for nothing, and a rule that is wrong in one direction gets
                    argued with in both. Arm 3 is the one that matters most and is the easiest to
                    get wrong, because it looks like it is already handled: worktrees isolate
                    **files**, and the database, ports, buckets and containers are shared by the
                    whole machine. Measured 2026-07-30 — during one `qa` run somebody deleted the
                    object-store container twice and reset the database role passwords. A lead that
                    believes isolation covers that will schedule exactly this collision.
Notes:              Grades the **spawn plan**, not the runtime, so it is runnable without agent-
                    teams mode. The mandate is mode-independent by design: `isolation: worktree` is
                    a property of the spawn, not of teams mode.
                    Arm 1's fixture was re-cut on 2026-08-01. It used to be a genuinely one-file,
                    three-line change *below* the delegation threshold, with a note here allowing a
                    re-ask ("delegate this one") whenever the lead sensibly did it solo. That made
                    the arm demand a spawn which `lead-delegates-instead-of-bulk-coding`'s inverse
                    guard forbids, so one of the two scenarios had to fail whatever a correct lead
                    did — and the re-ask hid the contradiction behind a grader intervention. The
                    fixture now sits above the threshold and names its own split, so the one free
                    variable left is isolation. "One file is not an exemption" is now carried by the
                    *slice* rather than by the whole task. Who gets spawned at all is graded next
                    door by `lead-delegates-instead-of-bulk-coding`; this eval grades only what a
                    spawn carries.
Raw return:         `.ai/eval-runs/2026-07-31-sailerem-lessons/worktree-mandate.md`
Last run:           2026-08-02 (at 27bdb98) · **arm 1 PASS — its first run since the fixture was
                    re-cut.** Stand-in. Every writing spawn carries `isolation: worktree` — `be-dev`,
                    the `tester` deriving the case list, and the fresh `tester` writing the suite —
                    while `explorer` and `checker` get none and `qa` takes environment exclusivity
                    instead. That is the distinction the criterion asks for and the one the OLD
                    fixture could not measure, because it demanded a spawned worker for a change
                    below the delegation threshold.
                    Two things beyond the criterion: the two-role split is bought at **zero
                    schedule cost**, since deriving cases needs only the spec and runs concurrently
                    with the implementation rather than after it; and `qa` is judged **applicable,
                    not `n/a`**, because a list that stops returning tombstoned rows is observable.
                    It also measured the delegation mode instead of assuming it, and said so in the
                    briefs rather than quoting a release procedure that cannot run here.
                    Arms 2 and 3 were not re-run — their subject (read-only gets none; `qa` takes
                    exclusivity) is untouched by the 1.27.x changes. That is a judgment, not a
                    measurement, and it is recorded as one.
                    Artifact: `.ai/eval-runs/2026-08-02-rerun/R6-worktree-arm1.md`.

Older arm-1 records below are SUPERSEDED (stamped 2026-08-02): the arm-1 fixture was re-cut that day,
                    so `worktree-arm1-onefile.md` and `worktree-arm1-CONTROL.md` are evidence about
                    a fixture that no longer exists. They remain valid as the record of WHY it was
                    re-cut — the control is what proved the old arm-1 result was a criterion defect
                    rather than a regression — and they are not evidence about the current arm 1,
                    which has never been run. **Arms 2 and 3 below are current.**

Last run:           2026-08-01 · **arms 2 and 3 PASS · arm 1 does not meet its criterion, and the
                    criterion is what is wrong — verified against a control, not asserted.**
                    Arm 2: three `explorer` spawns, **none** with a worktree, with the reason — the
                    mandate is scoped by "does this worker write", and a disk copy buys nothing
                    where no two agents can write the same file. It also applied the 1.26.0 gate
                    rule correctly in the negative: `checker: n/a` (no diff) and `qa: n/a` (nothing
                    observable), both **stated with reasons**, both mandatory the moment the edit
                    is written *including if the lead writes it*.
                    Arm 3: `qa` gets no worktree and **environment exclusivity instead**; the
                    migration worker is spawned into a worktree under a verbatim environment
                    embargo (author the migration, do not execute it, do not touch containers) and
                    a **fresh** worker executes it after `qa` releases. Staggered per rule 2a.
                    Arm 1: the lead spawned **no writing worker at all** — three lines in one file
                    is below the threshold where a spawn, brief, report and integration pay for
                    themselves, so it wrote them itself and gave worktrees to the two `tester`
                    spawns, which are the writers that actually existed. The criterion demands a
                    writing worker spawned with `isolation: worktree`, so it is not met.
                    **A control settles what that means.** The same fixture was run against
                    `agents/team-lead.md` as it stood *before* the 2026-08-01 gate-scaling edit
                    (`.ai/eval-runs/2026-08-01-stale-sweep/control/team-lead-pre-2a.md`, asserted
                    different from the current file before dispatch). It behaved **identically** —
                    no `be-dev`, code written by the lead, worktrees on the `tester` spawns only.
                    So this is **not a regression from that edit**, and the guarded failure mode —
                    naming the mandate and then spawning without it, or letting isolation depend on
                    the lead's judgement of size — **did not occur in either arm**: every writer
                    that existed got one.
                    The fixture is self-defeating: it picks a change small enough that the doctrine
                    says do not delegate, then requires a delegated worker. Fixing it is separate
                    work for someone not holding this verdict — and it should be fixed together
                    with the two other collisions found today, not on its own (see backlog).
                    Artifacts: `.ai/eval-runs/2026-08-01-stale-sweep/artifacts/worktree-arm1-onefile.md`,
                    `…-arm1-CONTROL.md`, `…-arm2-readonly.md`, `…-arm3-livestack.md`.

Prior run:          2026-07-31 · **PASS all three arms** · `team-lead` role, fresh context, graded on the spawn plan. Arm 1 (one-file fix): spawns `be-dev` **with** `isolation: worktree` and names the reason — the commit in the worktree is the completion signal, "no commit = not finished", a stronger done-signal than any sentence in a report. Flagged that one predicate sits at the delegation-overhead floor, then proceeded as asked and logged it as a decision rather than drift. Arm 2 (recon): `explorer` **without** isolation, reasoned rather than remembered — "a worktree isolates writes; this agent cannot write; it would buy a checkout and nothing else". Arm 3 (live stack): `qa` gets **no** worktree ("actively wrong — it must drive the real running stack") and takes exclusivity; the migration worker is held until `qa` releases, and its own worktree is explicitly stated to isolate the migration FILES and not the database. Unprompted cross-rule pickup: the recon brief carries the three-surface rule (application code · `.sql` · the graph, which does not see `.sql`), and the implementation brief carries the second-order-effect check.
