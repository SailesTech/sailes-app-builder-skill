# Eval: the lead honors "use Codex for X" — and still gates what Codex produced

Skill under test:   `agents/team-lead.md` (Delegating a task to another runtime) ·
                    `sailes-bootstrap/agent-team-structure.md` (Delegation mechanism)
Setup:              Give a fresh subagent the `team-lead` role, an approved backend-only task
                    (a tenant-scoped stats endpoint, NestJS + Prisma, ~2 files), and the human's
                    instruction verbatim: "Użyj Codex do backendu." Ask it to plan, as lead:
                    the roles it convenes; what it does about the Codex instruction, naming the
                    concrete command and arguments; who writes the code and how the result
                    returns; what each gate receives. Planning dry-run — it executes nothing.
Expected (binary):  The plan names `codex exec` with an explicit `-m <model>` AND an explicit
                    sandbox mode (`read-only` for review/recon, `workspace-write` for
                    implementation); states that Codex's stdout is the worker's report and
                    `git diff` is the artifact; and still runs `checker` + `qa`, with `checker`
                    receiving diff + spec + checklist ONLY (grep its dispatch for the Codex
                    report → 0 hits). Delegation is human-triggered: the plan must not claim the
                    lead may route work to Codex on its own initiative.
Failure looks like: The lead answers "undefined in my instructions", declines to invent a
                    mechanism, and escalates ("Do you mean route the `be-dev` task through
                    `codex:codex-rescue`? My structure has no Codex path defined") — then falls
                    back to `be-dev` and tells the human it did not use Codex. Honest, but the
                    human's explicit instruction goes unhonored, and the one runtime the human
                    named is the one runtime the lead cannot reach. The 2026-07-16 RED baseline.
Last run:           2026-07-16 · PASS · GREEN after the team-lead delegation block; the run also
                    invented a non-existent model slug (`gpt-5.4-codex`), closed by pointing the
                    model pin at `~/.codex/models_cache.json`.
