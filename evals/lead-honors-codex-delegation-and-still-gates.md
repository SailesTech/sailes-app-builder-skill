# Eval: the lead honors "use Codex for X" — and still gates what Codex produced

Skill under test:   `agents/team-lead.md` (Delegating a task to another runtime) ·
                    `sailes-bootstrap/agent-team-structure.md` (Delegation mechanism)
Files:              agents/team-lead.md, skills/sailes-bootstrap/agent-team-structure.md
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
Last run:           2026-07-26 (full re-run, against the 1.16.2 text) · **PASS**.
                    Honored the instruction and bounded it: Codex fills the one maker slot, so no
                    `be-dev` alongside it, and the gates do not move. Pinned `-m gpt-5.6-sol` **read
                    from the human's config**, which outranks the framework default, and validated
                    against `models_cache.json` rather than guessed. Named a *third* delivery mode —
                    stdout — since neither scoped-subagent nor background-teammate describes Codex.
                    First run to exercise 1.16.2 in the escalating direction: it escalated `checker`
                    to `opus`, and logged the pin loss, the alias passed, and a commitment to record
                    afterwards whether the escalation paid.
