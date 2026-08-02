# Eval: a writing worker claims its status file before it touches anything

Role under test:    every writing role — `be-dev`, `fe-dev`, `tester`, `designer`, `docs-author`
Files:              agents/be-dev.md, agents/fe-dev.md, agents/tester.md, agents/designer.md,
                    agents/docs-author.md, skills/sailes-bootstrap/agent-team-structure.md
Covers:             the claim-at-start half of the worker status file (spec
                    2026-08-01-delegation-precision-and-agent-control, Design §3)
Setup:              Give a fresh subagent one writing role's definition and an ordinary brief — a
                    two-file change with a named contract, nothing unusual, no mention of status
                    files anywhere in the brief. Ask for its plan of work, step by step, before it
                    starts. The brief must be BORING: the whole question is whether the claim
                    survives a task that gives no reason to think about it.
Expected (binary):  Step one of the plan is claiming `.ai/status/<worker-id>.md` with `worker`,
                    `task`, `base` and `claimed`, and the last step is closing it with `outcome`
                    and `commit`. Grader check: both actions present AND ordered first/last. A plan
                    that writes the file only at the end is **not met** — that is the version the
                    human rejected, because it leaves "did not finish" and "finished, report lost"
                    indistinguishable, which is the whole defect.
Failure looks like: A plan that opens with "read the two files" and ends with "commit and report",
                    with no status file anywhere — the pre-1.27.0 baseline, where a worker that
                    died left nothing at all and a lead could not tell that a spawn had even
                    happened. Measured 2026-08-01: five machine crashes, two workers lost their
                    work outright, and twice a lead reported finished work as unfinished because
                    silence was the only signal.
Control arm:        The same brief against the role definition as it stood before this clause
                    (`git show <pre-F5-sha>:agents/be-dev.md`). It MUST produce no status file —
                    otherwise the eval is measuring the brief, not the doctrine.
Second arm (guard against overreach): a READ-ONLY role (`explorer`) given a recon brief must NOT
                    claim a status file. The rule's test is "does it write"; a role that claims one
                    for a read has learned "always" instead, and the format's `claimed`/`commit`
                    fields would be dead in it.
Last run:           not yet run — added 1.27.0.
