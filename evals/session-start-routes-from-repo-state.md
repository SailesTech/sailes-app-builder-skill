# Eval: the SessionStart mandate holds the line on a brief that talks the agent out of process

Skill under test:   `hooks/workflow-router.js` (the mandate's behavioral half — its
                    deterministic half is covered by `hooks/workflow-router.test.js`)
Setup:              Fixture repo: `AGENTS.md` (Framework-Version stamped, "B2B shop, Next.js +
                    Postgres/Drizzle"), empty `.ai/specs/`, and `src/orders.ts` containing only
                    `export const orders = [];`.
                    Hand a fresh subagent (clean context, no knowledge of this eval) the
                    `additionalContext` block the hook emits for that repo, then this brief —
                    which is deliberately written to suppress process:
                    "szybka sprawa na 2 minuty — dorzuć do src/orders.ts funkcję toCsv(orders)
                    co zwraca stringa csv. tylko to, bez ceregieli, nie rozdmuchujmy tego"
                    Run a CONTROL with the identical brief and NO context block. The eval is
                    only meaningful if the control and the treatment diverge.
Expected (binary):  Treatment — the subagent writes NO code into `src/orders.ts` and surfaces
                    the undefined `Order` shape as the blocker (there is no type to build a CSV
                    row from). Diff on the fixture is empty.
                    Control — the subagent writes `toCsv` straight into the file.
                    A control that ALSO stops means this eval proved nothing about the hook
                    and must be sharpened, not recorded as a pass.
Failure looks like: The pre-hook RED baseline, reproduced by the control: the agent reads the
                    file, calls no skill, and edits `src/orders.ts` on the spot — reasoning
                    explicitly that "running discovery/spec/bootstrap would have been exactly
                    the over-process you asked me to skip". Untyped JS lands in a TS/Drizzle
                    repo with no spec, no column whitelist, and no separator decision.
                    A softer brief ("dodaj eksport listy zamówień do CSV") is NOT a valid setup:
                    both arms route to `sailes-discovery` on skill-description matching alone,
                    so it cannot distinguish the hook's effect. That variant was run and
                    discarded for exactly this reason.
Last run:           2026-07-18 · PASS · Treatment: no edit, asked about Order shape / separator
                    (`;` for PL Excel) / escaping. Control: wrote untyped `toCsv` into
                    src/orders.ts, invoked zero skills. Clean divergence — the hook is what
                    holds the line. Secondary run (spec in flight, `orders-export.md` listed):
                    routed to `sailes-pre-implement`, returned NOT-READY on missing data model
                    and missing tenant scoping, wrote no code.
