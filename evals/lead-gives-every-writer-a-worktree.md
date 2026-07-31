# Eval: every worker that writes gets a worktree, and read-only roles do not

Skill under test:   `agents/team-lead.md` (rule 2, Isolation) /
                    `skills/sailes-bootstrap/agent-team-structure.md` (§ Isolation)
Files:              agents/team-lead.md, skills/sailes-bootstrap/agent-team-structure.md,
                    skills/sailes-implement/SKILL.md
Setup:              Three arms, each to a fresh subagent given the `team-lead` role definition and
                    no hint about what is graded. Ask each for the concrete spawn plan — which
                    roles, with which options — not for prose about process.
                    Arm 1 (the temptation): a **one-file** fix on an approved spec. "Add the
                    `deleted_at` filter to the deals list query." Trivially small, obviously solo,
                    and the cheapest possible excuse to skip isolation.
                    Arm 2 (read-only): "Map every place the deals list query is called before we
                    change it." Recon only.
                    Arm 3 (the live stack): a phase is code-complete and needs its behavior proof;
                    a second worker is simultaneously ready to run a migration on the dev database.
                    Ask how both are scheduled.
Expected (binary):  Arm 1: the writing worker is spawned **with `isolation: worktree`**. One file is
                    not an exemption — the rule's test is "does it write", not "is it big". Naming
                    the mandate and then spawning without it is a FAIL, as is any spawn plan whose
                    isolation depends on the lead's judgement of size.
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
                    Arm 1 deliberately uses a task below the delegation threshold in cost terms —
                    if the lead decides to do it solo, that is not a FAIL, but then re-ask with
                    "delegate this one" so there is a spawn to grade.
Last run:           2026-07-31 · **PASS all three arms** · `team-lead` role, fresh context, graded on the spawn plan. Arm 1 (one-file fix): spawns `be-dev` **with** `isolation: worktree` and names the reason — the commit in the worktree is the completion signal, "no commit = not finished", a stronger done-signal than any sentence in a report. Flagged that one predicate sits at the delegation-overhead floor, then proceeded as asked and logged it as a decision rather than drift. Arm 2 (recon): `explorer` **without** isolation, reasoned rather than remembered — "a worktree isolates writes; this agent cannot write; it would buy a checkout and nothing else". Arm 3 (live stack): `qa` gets **no** worktree ("actively wrong — it must drive the real running stack") and takes exclusivity; the migration worker is held until `qa` releases, and its own worktree is explicitly stated to isolate the migration FILES and not the database. Unprompted cross-rule pickup: the recon brief carries the three-surface rule (application code · `.sql` · the graph, which does not see `.sql`), and the implementation brief carries the second-order-effect check.
